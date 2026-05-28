<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '@bigmarket/bm-ui';
	import { stacks } from '@bigmarket/sdk';
	import {
		appConfigStore,
		requireAppConfig,
		walletState,
		initWallet,
		requireDaoConfig,
		daoConfigStore
	} from '@bigmarket/bm-common';
	import type { SignedWithdrawMessage, StacksWithdrawParams } from '@bigmarket/sdk';

	const appConfig = $derived(requireAppConfig($appConfigStore));
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));

	let amount = $state('');
	let recipient = $state('');
	/**
	 * Two-step flow state:
	 *   idle     → user fills form
	 *   signing  → waiting for stx_signStructuredMessage wallet popup
	 *   signed   → signature obtained, ready to relay to server
	 *   relaying → server call in-flight
	 */
	let step = $state<'idle' | 'signing' | 'signed' | 'relaying'>('idle');
	let signed = $state<SignedWithdrawMessage | null>(null);
	let errorMsg = $state<string | null>(null);
	let txid = $state<string | null>(null);

	const stxAddress = $derived($walletState.accounts.find((a) => a.type === 'stx')?.address ?? '');

	const resolvedRecipient = $derived(recipient.trim() || stxAddress);
	const recipientOk = $derived(
		resolvedRecipient.length > 0 &&
			(resolvedRecipient === stxAddress || /^S[TP][A-Z0-9]{38,39}$/.test(resolvedRecipient))
	);

	const explorerTxUrl = $derived(
		txid ? stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, txid) : null
	);

	const connected = $derived(
		$walletState.status === 'connected' && $walletState.chain === 'stacks' && stxAddress.length > 0
	);

	const amountOk = $derived(
		amount.trim().length > 0 && Number(amount) > 0 && Number.isFinite(Number(amount))
	);

	const canSign = $derived(connected && amountOk && recipientOk && step === 'idle');
	const canRelay = $derived(connected && step === 'signed' && signed !== null);

	onMount(() => void initWallet(appConfig.VITE_BIGMARKET_API));

	async function sign() {
		if (!canSign) return;
		errorMsg = null;
		signed = null;
		step = 'signing';
		try {
			const { requestWithdrawSignatureStacks } = await import('@bigmarket/sdk');
			const amountMicro = BigInt(Math.round(Number(amount.trim()) * 1_000_000));
			const params: StacksWithdrawParams = {
				daoConfig: daoConfig,
				apiBaseUrl: appConfig.VITE_BIGMARKET_API,
				stacksApi: appConfig.VITE_STACKS_API,
				stxAddress,
				amountMicro,
				recipientAddress: resolvedRecipient
			};
			signed = await requestWithdrawSignatureStacks(params);
			console.log('requestWithdrawSignatureStacks signed', signed);
			step = 'signed';
			relay();
			step = 'relaying';
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
			step = 'idle';
		}
	}

	async function relay() {
		if (!canRelay || !signed) return;
		errorMsg = null;
		step = 'relaying';
		try {
			const { relayWithdrawToServer } = await import('@bigmarket/sdk');
			const amountMicro = BigInt(Math.round(Number(amount.trim()) * 1_000_000));
			const params: StacksWithdrawParams = {
				daoConfig: daoConfig,
				apiBaseUrl: appConfig.VITE_BIGMARKET_API,
				stacksApi: appConfig.VITE_STACKS_API,
				stxAddress,
				amountMicro,
				recipientAddress: resolvedRecipient
			};
			console.log('relayWithdrawToServer params', params);
			const result = await relayWithdrawToServer(params, signed);

			if (!result.success) throw new Error(result.error ?? 'Relay failed');
			txid = result.txid ?? null;
			step = 'idle';
			signed = null;
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
			step = 'signed'; // stay in signed state so user can retry relay
		}
	}

	function reset() {
		step = 'idle';
		signed = null;
		errorMsg = null;
	}
</script>

<div
	class="w-full space-y-5 rounded-lg border border-neutral-200 bg-neutral-50/80 p-5 dark:border-neutral-700 dark:bg-neutral-900/40"
>
	<p class="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
		Withdraw USDCx from your vault balance to any Stacks address. Sign the withdrawal message in
		your wallet, then the server broadcasts the transaction on your behalf (no STX gas required).
	</p>

	{#if $walletState.status !== 'connected'}
		<p class="text-sm text-amber-800 dark:text-amber-200">
			Connect a <strong>Stacks wallet</strong> (Leather or Xverse) to withdraw.
		</p>
	{:else if $walletState.chain !== 'stacks'}
		<p class="text-sm text-amber-800 dark:text-amber-200">
			Switch to a <strong>Stacks</strong> connection to use this withdrawal path.
		</p>
	{:else if !stxAddress}
		<p class="text-sm text-amber-800 dark:text-amber-200">
			No Stacks address in session. Reconnect your wallet.
		</p>
	{:else}
		<!-- Address summary -->
		<div class="space-y-1 font-mono text-xs text-neutral-700 dark:text-neutral-300">
			<p>
				<span class="text-neutral-500 dark:text-neutral-400">From (vault balance of)</span>
				<span class="mt-0.5 block break-all">{stxAddress}</span>
			</p>
			<p>
				<span class="text-neutral-500 dark:text-neutral-400">To</span>
				<span
					class="mt-0.5 block break-all {resolvedRecipient === stxAddress
						? 'text-neutral-400 italic'
						: ''}"
				>
					{resolvedRecipient === stxAddress
						? `${stxAddress} (own address)`
						: resolvedRecipient || 'Enter recipient below'}
				</span>
			</p>
		</div>

		<!-- Step indicator -->
		<div class="flex gap-2 text-xs">
			<div
				class="flex items-center gap-1.5 rounded-full px-2.5 py-1 {step === 'idle' ||
				step === 'signing'
					? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
					: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'}"
			>
				<span class="font-semibold">1</span>
				<span>Sign message</span>
			</div>
			<div
				class="flex items-center gap-1.5 rounded-full px-2.5 py-1 {step === 'signed' ||
				step === 'relaying'
					? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
					: txid
						? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
						: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'}"
			>
				<span class="font-semibold">2</span>
				<span>Bridge funds to Ethereum</span>
			</div>
		</div>

		<!-- Form fields — only editable before signing -->
		{#if step === 'idle'}
			<div class="space-y-1">
				<label
					class="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
					for="bm-ws-recipient"
				>
					Send to (leave blank for own address)
				</label>
				<input
					id="bm-ws-recipient"
					type="text"
					autocomplete="off"
					placeholder={stxAddress}
					bind:value={recipient}
					class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
				/>
				{#if recipient.trim().length > 0 && !recipientOk}
					<p class="text-[11px] text-red-600 dark:text-red-400">
						Must be a valid Stacks address (SP… or ST…).
					</p>
				{/if}
			</div>

			<div class="space-y-1">
				<label
					class="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
					for="bm-ws-amount"
				>
					Amount (USDCx)
				</label>
				<input
					id="bm-ws-amount"
					type="text"
					inputmode="decimal"
					placeholder="e.g. 100"
					bind:value={amount}
					class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
				/>
			</div>
		{:else}
			<!-- Summary once signed — fields locked -->
			<div
				class="rounded-md border border-neutral-200 bg-white p-3 text-xs dark:border-neutral-700 dark:bg-neutral-900"
			>
				<p class="text-neutral-500 dark:text-neutral-400">Withdrawal details (locked)</p>
				<p class="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">
					{amount} USDCx → {resolvedRecipient === stxAddress ? 'own address' : resolvedRecipient}
				</p>
				{#if step === 'signed'}
					<p class="mt-1 text-emerald-600 dark:text-emerald-400">
						✓ Message signed — relay to server to broadcast the transaction.
					</p>
				{/if}
				<button
					type="button"
					onclick={reset}
					class="mt-2 text-[11px] text-neutral-500 underline hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
				>
					Start over
				</button>
			</div>
		{/if}

		<!-- Error -->
		{#if errorMsg}
			<p class="text-sm text-red-700 dark:text-red-300">{errorMsg}</p>
		{/if}

		<!-- Success -->
		{#if txid}
			<p class="text-xs text-emerald-800 dark:text-emerald-200">
				Withdrawal submitted.
				{#if explorerTxUrl}
					<a
						class="font-mono break-all underline"
						href={explorerTxUrl}
						target="_blank"
						rel="noreferrer"
					>
						{txid}
					</a>
				{:else}
					<span class="font-mono break-all">{txid}</span>
				{/if}
			</p>
		{/if}

		<!-- Action buttons -->
		{#if step === 'idle'}
			<Button type="button" onclick={sign} disabled={!canSign} class="w-full cursor-pointer">
				Sign withdrawal message
			</Button>
		{:else if step === 'signing'}
			<Button type="button" disabled class="w-full cursor-pointer">
				Waiting for wallet signature…
			</Button>
		{:else if step === 'signed'}
			<Button type="button" onclick={relay} disabled={!canRelay} class="w-full cursor-pointer">
				Relay withdrawal to server
			</Button>
		{:else if step === 'relaying'}
			<Button type="button" disabled class="w-full cursor-pointer">Broadcasting…</Button>
		{/if}
	{/if}
</div>
