<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '@bigmarket/bm-ui';
	import { stacks } from '@bigmarket/sdk';
	import {
		appConfigStore,
		requireAppConfig,
		daoConfigStore,
		requireDaoConfig,
		walletState,
		initWallet
	} from '@bigmarket/bm-common';
	import type { EvmWithdrawParams, SignedEvmWithdrawMessage } from '@bigmarket/sdk';

	const appConfig = $derived(requireAppConfig($appConfigStore));
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));

	let amount = $state('');
	//let tokenSymbol = $state<'USDC' | 'USDT'>('USDC');
	/**
	 * Two-step flow state:
	 *   idle     → user fills form
	 *   signing  → waiting for MetaMask personal_sign
	 *   signed   → signature obtained, ready to relay
	 *   relaying → server call in-flight
	 */
	let step = $state<'idle' | 'signing' | 'signed' | 'relaying'>('idle');
	let signed = $state<SignedEvmWithdrawMessage | null>(null);
	let errorMsg = $state<string | null>(null);
	let txid = $state<string | null>(null);

	const ethAddress = $derived($walletState.accounts.find((a) => a.type === 'eth')?.address ?? '');
	const mappedAddress = $derived($walletState.activeAccount?.mappedAddress ?? '');

	const explorerTxUrl = $derived(
		txid ? stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, txid) : null
	);

	const connected = $derived(
		$walletState.status === 'connected' &&
			$walletState.chain === 'ethereum' &&
			ethAddress.length > 0
	);

	const amountOk = $derived(
		amount.trim().length > 0 && Number(amount) > 0 && Number.isFinite(Number(amount))
	);

	const canSign = $derived(connected && amountOk && mappedAddress.length > 0 && step === 'idle');
	const canRelay = $derived(connected && step === 'signed' && signed !== null);

	onMount(() => void initWallet(appConfig.VITE_BIGMARKET_API));

	async function sign() {
		if (!canSign) return;
		errorMsg = null;
		signed = null;
		step = 'signing';
		try {
			const { requestWithdrawSignatureEvm } = await import('@bigmarket/sdk');
			const amountMicro = BigInt(Math.round(Number(amount.trim()) * 1_000_000));
			const params: EvmWithdrawParams = {
				daoConfig,
				apiBaseUrl: appConfig.VITE_BIGMARKET_API,
				stacksApi: appConfig.VITE_STACKS_API,
				ethAddress,
				mappedAddress,
				amountMicro
			};
			signed = await requestWithdrawSignatureEvm(params);
			step = 'signed';
			relay();
			step = 'relaying';
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
			step = 'idle';
		}
	}

	async function relay() {
		if (!canRelay || signed === null) return;
		errorMsg = null;
		step = 'relaying';
		try {
			const { relayEvmWithdrawToServer } = await import('@bigmarket/sdk');
			const amountMicro = BigInt(Math.round(Number(amount.trim()) * 1_000_000));
			const params: EvmWithdrawParams = {
				daoConfig,
				apiBaseUrl: appConfig.VITE_BIGMARKET_API,
				stacksApi: appConfig.VITE_STACKS_API,
				ethAddress,
				mappedAddress,
				amountMicro
			};
			const result = await relayEvmWithdrawToServer(params, signed);
			if (result.success) txid = result?.txid ?? null;
			else errorMsg = result.error ?? 'Relay failed';
			step = 'idle';
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
			step = 'signed';
		}
	}

	function reset() {
		step = 'idle';
		signed = null;
		txid = null;
		errorMsg = null;
		amount = '';
	}
</script>

<div
	class="w-full space-y-5 rounded-lg border border-neutral-200 bg-neutral-50/80 p-5 dark:border-neutral-700 dark:bg-neutral-900/40"
>
	{#if !connected}
		<p class="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
			Withdraw USDCx from your vault balance. Sign the withdrawal message in your wallet, the USDC
			is bridged back to your ethereum address.
		</p>
		<p class="text-sm text-amber-800 dark:text-amber-200">
			Connect <strong>MetaMask</strong> to withdraw USDCx to Ethereum.
		</p>
	{:else if !mappedAddress}
		<p class="text-sm text-amber-800 dark:text-amber-200">
			Mapped Stacks address not found. Reconnect MetaMask and try again.
		</p>
	{:else}
		<!-- Step indicator -->
		<div class="flex gap-3">
			<div
				class="flex items-center gap-1.5 text-xs {step === 'idle' || step === 'signing'
					? 'font-semibold text-orange-600 dark:text-orange-400'
					: 'text-neutral-400'}"
			>
				<span
					class="flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold {step ===
						'idle' || step === 'signing'
						? 'border-orange-400 bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
						: 'border-neutral-300 text-neutral-400'}"
				>
					1
				</span>
				Sign with MetaMask
			</div>
			<span class="text-neutral-300 dark:text-neutral-600">→</span>
			<div
				class="flex items-center gap-1.5 text-xs {step === 'signed' || step === 'relaying'
					? 'font-semibold text-orange-600 dark:text-orange-400'
					: 'text-neutral-400'}"
			>
				<span
					class="flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold {step ===
						'signed' || step === 'relaying'
						? 'border-orange-400 bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
						: 'border-neutral-300 text-neutral-400'}"
				>
					2
				</span>
				Relay to server
			</div>
		</div>

		<!-- Address summary -->
		<div class="space-y-1 font-mono text-xs text-neutral-700 dark:text-neutral-300">
			<p>
				<span class="text-neutral-500 dark:text-neutral-400">From (ETH controller)</span>
				<span class="mt-0.5 block break-all">{ethAddress}</span>
			</p>
			<p>
				<span class="text-neutral-500 dark:text-neutral-400">To (mapped Stacks)</span>
				<span class="mt-0.5 block break-all">{mappedAddress}</span>
			</p>
		</div>

		<!-- Amount -->
		{#if step === 'idle'}
			<div class="space-y-1">
				<label
					class="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
					for="bm-wb-evm-amount"
				>
					Amount (USDCx)
				</label>
				<input
					id="bm-wb-evm-amount"
					type="text"
					inputmode="decimal"
					placeholder="e.g. 100"
					bind:value={amount}
					class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
				/>
			</div>
		{/if}

		<!-- Signed state -->
		{#if step === 'signed'}
			<p class="text-xs text-emerald-700 dark:text-emerald-300">
				MetaMask signature obtained. Relaying withdrawal to server…
			</p>
		{/if}

		<!-- Error -->
		{#if errorMsg}
			<p class="text-sm text-red-700 dark:text-red-300">{errorMsg}</p>
		{/if}

		<!-- Success -->
		{#if txid}
			<div
				class="space-y-2 rounded-md border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-700/50 dark:bg-emerald-900/10"
			>
				<p class="text-xs font-medium text-emerald-800 dark:text-emerald-300">
					Withdrawal submitted — USDCx is moving to your mapped Stacks address.
				</p>
				{#if explorerTxUrl}
					<a
						class="block font-mono text-[11px] break-all text-emerald-700 underline dark:text-emerald-400"
						href={explorerTxUrl}
						target="_blank"
						rel="noreferrer"
					>
						{txid}
					</a>
				{:else}
					<span class="block font-mono text-[11px] break-all text-emerald-700 dark:text-emerald-400"
						>{txid}</span
					>
				{/if}
				<p class="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">
					Once confirmed, USDCx will be at your mapped Stacks address. Use the admin panel below to
					bridge it back to Ethereum via AllBridge (or sweep for testing).
				</p>
				<button
					type="button"
					onclick={reset}
					class="text-xs text-neutral-500 underline hover:text-neutral-700 dark:hover:text-neutral-300"
				>
					New withdrawal
				</button>
			</div>
		{/if}

		<!-- CTA -->
		{#if !txid}
			{#if step === 'idle' || step === 'signing'}
				<Button
					type="button"
					onclick={sign}
					disabled={!canSign || step === 'signing'}
					class="w-full cursor-pointer"
				>
					{step === 'signing' ? 'Sign in MetaMask…' : 'Sign withdrawal'}
				</Button>
				<p class="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
					MetaMask will ask you to sign a message (no gas required). The server then submits the
					withdrawal transaction on-chain. USDCx is released from the vault to your mapped Stacks
					address, from where AllBridge can bridge it back to Ethereum.
				</p>
			{:else if step === 'signed' || step === 'relaying'}
				<Button type="button" onclick={relay} disabled={!canRelay} class="w-full cursor-pointer">
					{step === 'relaying' ? 'Relaying to server…' : 'Retry relay'}
				</Button>
			{/if}
		{/if}
	{/if}
</div>
