<script lang="ts">
	import { Button } from '@bigmarket/bm-ui';
	import { stacks } from '@bigmarket/sdk';
	import { walletState } from '@bigmarket/bm-common';
	import { fmtMicroToStx } from '@bigmarket/bm-utilities';
	import type { AppConfig, DaoConfig, WalletAccount } from '@bigmarket/bm-types';

	interface Props {
		walletBalance: bigint;
		appConfig: AppConfig;
		daoConfig: DaoConfig;
	}

	const { walletBalance, appConfig, daoConfig }: Props = $props();

	const MICRO = 1_000_000n;

	// Mapped address comes from walletState (populated by initWallet)
	const mappedAddress = $derived($walletState.activeAccount?.mappedAddress ?? '');
	let stxAddress = $derived(
		$walletState.accounts.find((a: WalletAccount) => a.type === 'stx')?.address ?? ''
	);
	let busy = $state(false);
	let txHash = $state<string | null>(null);
	let intentId = $state<string | null>(null);
	let errorMsg = $state<string | null>(null);
	let rawInput = $state('');

	const amountMicro = $derived.by((): bigint | null => {
		const trimmed = (rawInput + '').trim();
		if (!trimmed) return null;
		const parsed = parseFloat(trimmed);
		if (!Number.isFinite(parsed) || parsed <= 0) return null;
		return BigInt(Math.floor(parsed * 1_000_000));
	});

	const amountError = $derived.by((): string | null => {
		if ((rawInput + '').trim() === '') return null;
		if (amountMicro === null) return 'Enter a valid amount.';
		if (amountMicro > walletBalance)
			return `Amount exceeds balance of ${fmtMicroToStx(Number(walletBalance), 6)} USDCx.`;
		return null;
	});

	const canTransfer = $derived(
		stxAddress.length > 0 &&
			mappedAddress.length > 0 &&
			!busy &&
			walletBalance > 0n &&
			amountMicro !== null &&
			amountMicro > 0n &&
			amountError === null
	);

	const explorerUrl = $derived(
		txHash
			? stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, txHash)
			: null
	);

	function setMax() {
		rawInput = (Number(walletBalance) / Number(MICRO)).toFixed(6).replace(/\.?0+$/, '');
	}

	async function transferToRelay() {
		if (!canTransfer || amountMicro === null) return;

		busy = true;
		errorMsg = null;
		txHash = null;
		intentId = null;

		try {
			// 1. Register intent so the relayer knows to sweep it
			const intentRes = await fetch(`${appConfig.VITE_BIGMARKET_API}/cross-chain/intents`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ sourceChain: 'stacks', sourceAddress: stxAddress })
			});
			if (!intentRes.ok) throw new Error(await intentRes.text());
			const { intentId: newIntentId } = await intentRes.json();
			intentId = newIntentId;

			// 2. Transfer USDCx from the user's wallet to the mapped relay address
			const vault = stacks.createVaultClient(daoConfig);
			const transferResult = await vault.transferUsdcxTo({
				amountMicro,
				senderStxAddress: stxAddress,
				recipientStxAddress: mappedAddress
			});
			if (!transferResult.success) {
				throw new Error(transferResult.error ?? 'Transfer failed');
			}
			txHash = transferResult.txid ?? null;

			// 3. Mark the intent as submitted so the cron job picks it up
			await fetch(`${appConfig.VITE_BIGMARKET_API}/cross-chain/intents/${newIntentId}/submitted`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ sourceTxHash: txHash })
			});

			rawInput = '';
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
		}
	}
</script>

<div
	class="space-y-3 rounded-md border border-dashed border-amber-300 bg-amber-50/60 p-4 dark:border-amber-700/60 dark:bg-amber-900/10"
>
	<div class="flex items-center gap-2">
		<span
			class="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-800 uppercase dark:bg-amber-800/40 dark:text-amber-300"
			>devnet : {intentId}</span
		>
		<h3 class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
			Transfer to mapped address
		</h3>
	</div>
	<p class="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">
		Sends USDCx from your wallet to the mapped address. The server relayer will detect the balance
		and sweep it into your vault, crediting your Stacks address.
	</p>

	{#if mappedAddress}
		<div class="font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
			<span class="text-neutral-500 dark:text-neutral-500">Mapped address</span>
			<span class="mt-0.5 block break-all">{mappedAddress}</span>
		</div>
	{/if}

	<div class="space-y-1.5">
		<label
			class="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
			for="relay-amount"
		>
			Amount (USDCx)
		</label>
		<div class="flex gap-2">
			<input
				id="relay-amount"
				type="number"
				min="0"
				step="any"
				placeholder="0.000000"
				bind:value={rawInput}
				disabled={!mappedAddress || busy}
				class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-500"
			/>
			<button
				type="button"
				onclick={setMax}
				disabled={!mappedAddress || busy || walletBalance === 0n}
				class="shrink-0 rounded-md border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-800"
			>
				Max
			</button>
		</div>
		{#if amountError}
			<p class="text-xs text-red-600 dark:text-red-400">{amountError}</p>
		{/if}
	</div>

	{#if errorMsg}
		<p class="text-xs text-red-700 dark:text-red-300">{errorMsg}</p>
	{/if}

	{#if txHash}
		<p class="text-xs text-emerald-700 dark:text-emerald-300">
			Transfer submitted — relayer will sweep to vault shortly.
			{#if explorerUrl}
				<a class="font-mono break-all underline" href={explorerUrl} target="_blank" rel="noreferrer"
					>{txHash}</a
				>
			{:else}
				<span class="font-mono break-all">{txHash}</span>
			{/if}
		</p>
	{/if}

	<Button
		type="button"
		variant="secondary"
		onclick={transferToRelay}
		disabled={!canTransfer}
		class="w-full cursor-pointer"
	>
		{busy ? 'Submitting…' : 'Transfer to mapped address'}
	</Button>
</div>
