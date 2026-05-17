<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '@bigmarket/bm-ui';
	import { stacks } from '@bigmarket/sdk';
	import {
		appConfigStore,
		daoConfigStore,
		getCreateMappedStacksAddress,
		initWallet,
		requireAppConfig,
		requireDaoConfig,
		walletState
	} from '@bigmarket/bm-common';
	import { fmtMicroToStx, requestMappedDepositToVault } from '@bigmarket/bm-utilities';

	type VaultSourceChain = 'evm' | 'stacks' | 'solana';
	type ApiSourceChain = 'ethereum' | 'solana' | 'stacks';

	const appConfig = $derived(requireAppConfig($appConfigStore));
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));

	let busy = $state(false);
	let loadingBalance = $state(false);
	let errorMsg = $state<string | null>(null);
	let txHash = $state<string | null>(null);
	let custodyBalanceMicro = $state<bigint | null>(null);
	let vaultBalanceMicro = $state<bigint | null>(null);

	const stxAddress = $derived($walletState.accounts.find((a) => a.type === 'stx')?.address ?? '');
	const ethAddress = $derived($walletState.accounts.find((a) => a.type === 'eth')?.address ?? '');
	const solAddress = $derived($walletState.accounts.find((a) => a.type === 'sol')?.address ?? '');

	const stacksConnected = $derived(
		$walletState.status === 'connected' && $walletState.chain === 'stacks' && stxAddress.length > 0
	);

	const sourceIdentity = $derived.by((): { chain: VaultSourceChain; address: string } | null => {
		if (ethAddress) return { chain: 'evm', address: ethAddress };
		if (solAddress) return { chain: 'solana', address: solAddress };
		if (stxAddress) return { chain: 'stacks', address: stxAddress };
		return null;
	});

	const apiSourceChain = $derived.by((): ApiSourceChain | null => {
		if (!sourceIdentity) return null;
		if (sourceIdentity.chain === 'evm') return 'ethereum';
		if (sourceIdentity.chain === 'solana') return 'solana';
		return 'stacks';
	});

	const apiSourceAddress = $derived(sourceIdentity?.address ?? '');

	let mappedAddress = $state('');

	const canDepositViaWallet = $derived(
		mappedAddress.length > 0 &&
			stxAddress.length > 0 &&
			mappedAddress.toLowerCase() === stxAddress.toLowerCase() &&
			custodyBalanceMicro !== null &&
			custodyBalanceMicro > 0n
	);

	const canDepositViaRelayer = $derived(
		mappedAddress.length > 0 &&
			stxAddress.length > 0 &&
			mappedAddress.toLowerCase() !== stxAddress.toLowerCase() &&
			custodyBalanceMicro !== null &&
			custodyBalanceMicro > 0n
	);

	const canSubmit = $derived(
		stacksConnected &&
			!busy &&
			!loadingBalance &&
			mappedAddress.length > 0 &&
			sourceIdentity !== null &&
			custodyBalanceMicro !== null &&
			custodyBalanceMicro > 0n &&
			(canDepositViaWallet || canDepositViaRelayer)
	);

	const custodyBalanceDisplay = $derived(
		custodyBalanceMicro === null ? '—' : fmtMicroToStx(Number(custodyBalanceMicro), 6)
	);

	const vaultBalanceDisplay = $derived(
		vaultBalanceMicro === null ? '—' : fmtMicroToStx(Number(vaultBalanceMicro), 6)
	);

	const explorerTxUrl = $derived(
		txHash
			? stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, txHash)
			: null
	);

	onMount(() => {
		void initWallet(appConfig.VITE_BIGMARKET_API);
	});

	$effect(() => {
		if (stacksConnected && apiSourceChain && apiSourceAddress) {
			void refreshBalances();
		}
	});

	async function resolveMappedAddress() {
		if (!apiSourceChain || !apiSourceAddress) return '';
		const result = await getCreateMappedStacksAddress(
			appConfig.VITE_BIGMARKET_API,
			apiSourceChain,
			apiSourceAddress
		);
		return result.mappedAddress?.trim() ?? '';
	}

	async function refreshBalances() {
		if (!stacksConnected || !sourceIdentity) return;

		loadingBalance = true;
		errorMsg = null;
		txHash = null;

		try {
			mappedAddress = await resolveMappedAddress();
			if (!mappedAddress) {
				throw new Error('Could not resolve mapped Stacks address');
			}

			const vault = stacks.createVaultClient(daoConfig);
			custodyBalanceMicro = await vault.getUsdcxBalance(
				appConfig.VITE_STACKS_API,
				mappedAddress
			);
			vaultBalanceMicro = await vault.getVaultUsdcxBalance(
				appConfig.VITE_STACKS_API,
				sourceIdentity.chain,
				sourceIdentity.address
			);
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
			custodyBalanceMicro = null;
			vaultBalanceMicro = null;
		} finally {
			loadingBalance = false;
		}
	}

	async function depositToVault() {
		if (!canSubmit || !sourceIdentity || !apiSourceChain) return;

		busy = true;
		errorMsg = null;
		txHash = null;

		try {
			if (canDepositViaWallet) {
				const vault = stacks.createVaultClient(daoConfig);
				const amount = custodyBalanceMicro!;
				const result = await vault.depositUsdcxToVault({
					amountMicro: amount,
					userChain: sourceIdentity.chain,
					sourceAddress: sourceIdentity.address,
					senderStxAddress: stxAddress
				});
				if (!result.success) {
					throw new Error(result.error ?? 'Vault deposit failed');
				}
				txHash = result.txid;
			} else {
				const result = await requestMappedDepositToVault(
					appConfig.VITE_BIGMARKET_API,
					apiSourceChain,
					apiSourceAddress
				);
				txHash = result.txid;
			}

			await refreshBalances();
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
		}
	}
</script>

<div
	class="w-full max-w-lg space-y-5 rounded-lg border border-neutral-200 bg-neutral-50/80 p-5 dark:border-neutral-700 dark:bg-neutral-900/40"
>
	<h2 class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Manage vault</h2>
	<p class="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
		Move USDCx from your mapped Stacks custody address into the BigMarket vault. Your vault balance is
		credited to your cross-chain identity (Ethereum, Solana, or native Stacks).
	</p>

	{#if !stacksConnected}
		<p class="text-sm text-amber-800 dark:text-amber-200">
			Connect with a <strong>Stacks</strong> wallet (Hiro or compatible) to manage vault deposits.
		</p>
	{:else if !sourceIdentity}
		<p class="text-sm text-amber-800 dark:text-amber-200">
			No linked source identity found. Reconnect your wallet or link an Ethereum / Solana account.
		</p>
	{/if}

	<div class="space-y-1 font-mono text-xs text-neutral-700 dark:text-neutral-300">
		{#if stxAddress}
			<p>
				<span class="text-neutral-500 dark:text-neutral-400">Stacks wallet</span>
				<span class="mt-0.5 block break-all">{stxAddress}</span>
			</p>
		{/if}
		{#if mappedAddress}
			<p>
				<span class="text-neutral-500 dark:text-neutral-400">Mapped custody (USDCx)</span>
				<span class="mt-0.5 block break-all">{mappedAddress}</span>
			</p>
		{/if}
		{#if ethAddress}
			<p>
				<span class="text-neutral-500 dark:text-neutral-400">Source (ETH)</span>
				<span class="mt-0.5 block break-all">{ethAddress}</span>
			</p>
		{/if}
	</div>

	<div class="grid grid-cols-2 gap-3">
		<div class="rounded-md border border-neutral-200 bg-white/80 p-3 dark:border-neutral-600 dark:bg-neutral-900/60">
			<p class="text-[11px] text-neutral-500 dark:text-neutral-400">USDCx on mapped address</p>
			<p class="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
				{loadingBalance ? '…' : custodyBalanceDisplay}
			</p>
		</div>
		<div class="rounded-md border border-neutral-200 bg-white/80 p-3 dark:border-neutral-600 dark:bg-neutral-900/60">
			<p class="text-[11px] text-neutral-500 dark:text-neutral-400">USDCx in vault</p>
			<p class="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
				{loadingBalance ? '…' : vaultBalanceDisplay}
			</p>
		</div>
	</div>

	{#if errorMsg}
		<p class="text-sm text-red-700 dark:text-red-300">{errorMsg}</p>
	{/if}

	{#if explorerTxUrl}
		<p class="text-xs text-emerald-800 dark:text-emerald-200">
			Deposit submitted.
			<a class="font-mono break-all underline" href={explorerTxUrl} target="_blank" rel="noreferrer"
				>{txHash}</a
			>
		</p>
	{:else if txHash}
		<p class="text-xs text-emerald-800 dark:text-emerald-200">
			Deposit submitted. <span class="font-mono break-all">{txHash}</span>
		</p>
	{/if}

	<div class="flex gap-2">
		<Button
			type="button"
			variant="secondary"
			onclick={() => refreshBalances()}
			disabled={!stacksConnected || busy || loadingBalance}
			class="flex-1 cursor-pointer"
		>
			{loadingBalance ? 'Refreshing…' : 'Refresh'}
		</Button>
		<Button
			type="button"
			onclick={() => depositToVault()}
			disabled={!canSubmit}
			class="flex-1 cursor-pointer"
		>
			{busy ? 'Submitting…' : 'Move USDCx to vault'}
		</Button>
	</div>

	{#if canDepositViaRelayer}
		<p class="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
			USDCx sits on your mapped address (derived from your {apiSourceChain} key). The relayer will
			submit <code class="text-[10px]">deposit</code> on your behalf.
		</p>
	{:else if canDepositViaWallet}
		<p class="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
			You will sign the vault <code class="text-[10px]">deposit</code> call in your Stacks wallet.
		</p>
	{/if}
</div>
