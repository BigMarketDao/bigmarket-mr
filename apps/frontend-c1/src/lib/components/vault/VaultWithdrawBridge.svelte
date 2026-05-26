<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '@bigmarket/bm-ui';
	import { stacks } from '@bigmarket/sdk';
	import { appConfigStore, requireAppConfig, walletState, initWallet } from '@bigmarket/bm-common';

	const appConfig = $derived(requireAppConfig($appConfigStore));

	let amount = $state('');
	let tokenSymbol = $state<'USDC' | 'USDT'>('USDC');
	let ethRecipient = $state('');
	let busy = $state(false);
	let errorMsg = $state<string | null>(null);
	let txHash = $state<string | null>(null);

	const tokenSymbolSource = $derived(tokenSymbol === 'USDT' ? 'USDTx' : 'USDCx');
	const isTestnet = $derived(appConfig.VITE_NETWORK !== 'mainnet');

	const explorerTxUrl = $derived(
		txHash
			? stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, txHash)
			: null
	);

	const stxAddress = $derived($walletState.accounts.find((a) => a.type === 'stx')?.address ?? '');
	const ethRecipientOk = $derived(/^0x[a-fA-F0-9]{40}$/.test(ethRecipient.trim()));

	const ready = $derived(
		$walletState.status === 'connected' &&
			$walletState.chain === 'stacks' &&
			stxAddress.length > 0 &&
			ethRecipientOk
	);

	const canSubmit = $derived(
		ready && !busy && amount.trim().length > 0 && Number(amount) > 0 && Number.isFinite(Number(amount))
	);

	onMount(() => void initWallet(appConfig.VITE_BIGMARKET_API));

	async function submit() {
		if (!canSubmit) return;
		errorMsg = null;
		txHash = null;
		busy = true;
		try {
			const { sendAllbridgeWithdraw, ChainSymbol } = await import('@bigmarket/sdk/ethereum');

			const { txHash: hash } = await sendAllbridgeWithdraw({
				amount: amount.trim(),
				fromAccountAddress: stxAddress,
				toAccountAddress: ethRecipient.trim(),
				sourceChain: ChainSymbol.STX,
				destinationChain: ChainSymbol.ETH,
				tokenSymbol: tokenSymbolSource,
				tokenSymbolDestination: tokenSymbol,
				stxIsTestnet: isTestnet
			});

			txHash = hash;
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
		}
	}
</script>

<div
	class="w-full space-y-5 rounded-lg border border-neutral-200 bg-neutral-50/80 p-5 dark:border-neutral-700 dark:bg-neutral-900/40"
>
	<p class="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
		Send {tokenSymbolSource} from your Stacks wallet to an Ethereum address as {tokenSymbol} via
		AllBridge.
	</p>

	{#if $walletState.status !== 'connected'}
		<p class="text-sm text-amber-800 dark:text-amber-200">
			Connect a <strong>Stacks wallet</strong> (Hiro or compatible) to withdraw.
		</p>
	{:else if $walletState.chain !== 'stacks'}
		<p class="text-sm text-amber-800 dark:text-amber-200">
			Switch to a <strong>Stacks</strong> connection to withdraw.
		</p>
	{:else if !stxAddress}
		<p class="text-sm text-amber-800 dark:text-amber-200">
			No Stacks address in session. Reconnect your wallet and choose a Stacks account.
		</p>
	{:else}
		<!-- Address summary -->
		<div class="space-y-1 font-mono text-xs text-neutral-700 dark:text-neutral-300">
			<p>
				<span class="text-neutral-500 dark:text-neutral-400">From (Stacks)</span>
				<span class="mt-0.5 block break-all">{stxAddress}</span>
			</p>
			<p>
				<span class="text-neutral-500 dark:text-neutral-400">To (ETH)</span>
				<span class="mt-0.5 block break-all {ethRecipientOk ? '' : 'italic text-neutral-400'}">
					{ethRecipientOk ? ethRecipient.trim() : 'Enter recipient below'}
				</span>
			</p>
		</div>

		<!-- ETH recipient -->
		<div class="space-y-1">
			<label class="block text-xs font-medium text-neutral-700 dark:text-neutral-300" for="bm-wb-recipient">
				Recipient on Ethereum (0x…)
			</label>
			<input
				id="bm-wb-recipient"
				type="text"
				autocomplete="off"
				placeholder="0x..."
				bind:value={ethRecipient}
				class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
			/>
			<p class="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
				The address where you want to receive {tokenSymbol} (e.g. your MetaMask account).
			</p>
		</div>

		<!-- Token selector -->
		<div class="space-y-1">
			<label class="block text-xs font-medium text-neutral-700 dark:text-neutral-300" for="bm-wb-token">
				Token
			</label>
			<select
				id="bm-wb-token"
				bind:value={tokenSymbol}
				class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
			>
				<option value="USDC">USDC</option>
				<option value="USDT">USDT</option>
			</select>
		</div>

		<!-- Amount -->
		<div class="space-y-1">
			<label class="block text-xs font-medium text-neutral-700 dark:text-neutral-300" for="bm-wb-amount">
				Amount
			</label>
			<input
				id="bm-wb-amount"
				type="text"
				inputmode="decimal"
				placeholder="e.g. 100"
				bind:value={amount}
				class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
			/>
		</div>

		<!-- Error -->
		{#if errorMsg}
			<p class="text-sm text-red-700 dark:text-red-300">{@html errorMsg}</p>
		{/if}

		<!-- Success -->
		{#if txHash}
			<p class="text-xs text-emerald-800 dark:text-emerald-200">
				Stacks transaction sent. Funds will arrive on Ethereum after AllBridge completes the transfer.
				{#if explorerTxUrl}
					<a class="font-mono break-all underline" href={explorerTxUrl} target="_blank" rel="noreferrer">
						{txHash}
					</a>
				{:else}
					<span class="font-mono break-all">{txHash}</span>
				{/if}
			</p>
		{/if}

		<Button type="button" onclick={submit} disabled={!canSubmit} class="w-full cursor-pointer">
			{busy ? 'Confirm in wallet…' : `Bridge ${tokenSymbolSource} → Ethereum`}
		</Button>
	{/if}
</div>
