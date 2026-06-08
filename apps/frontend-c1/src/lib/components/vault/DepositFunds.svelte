<script lang="ts">
	import { onMount } from 'svelte';
	import { stacks } from '@bigmarket/sdk';
	import {
		appConfigStore,
		daoConfigStore,
		getStxAddress,
		initWallet,
		requireAppConfig,
		requireDaoConfig,
		showTxModal,
		userWalletStore,
		walletState,
		watchTransaction
	} from '@bigmarket/bm-common';
	import UsdcxWalletBalance from './UsdcxWalletBalance.svelte';
	import DepositAction from './DepositAction.svelte';
	import RelayTransfer from './RelayTransfer.svelte';

	const appConfig = $derived(requireAppConfig($appConfigStore));
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));

	let loading = $state(false);
	let busy = $state(false);
	let errorMsg = $state<string | null>(null);
	let txHash = $state<string | null>(null);
	let walletBalance = $derived(
		BigInt(
			$userWalletStore.tokenBalances?.fungible_tokens[
				`${daoConfig.VITE_DAO_DEPLOYER}.usdcx::usdcx-token`
			]?.balance || 0
		)
	);
	let vaultBalance = $state<bigint | null>(null);

	const stxAddress = $derived($walletState.accounts.find((a) => a.type === 'stx')?.address ?? '');

	const stacksConnected = $derived(
		$walletState.status === 'connected' && $walletState.chain === 'stacks' && stxAddress.length > 0
	);

	const canDeposit = $derived(
		stacksConnected && !busy && !loading && walletBalance !== null && walletBalance > 0n
	);

	const explorerUrl = $derived(
		txHash
			? stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, txHash)
			: null
	);

	onMount(() => {
		void initWallet(appConfig.VITE_BIGMARKET_API);
	});

	$effect(() => {
		if (stacksConnected && stxAddress) {
			void loadBalances();
		}
	});

	async function loadBalances() {
		loading = true;
		errorMsg = null;

		try {
			const vault = stacks.createVaultClient(daoConfig);
			[vaultBalance] = await Promise.all([
				// vault.getUsdcxBalance(appConfig.VITE_STACKS_API, stxAddress),
				vault.getVaultUsdcxBalance(appConfig.VITE_STACKS_API, 'stacks', stxAddress)
			]);
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
			vaultBalance = null;
		} finally {
			loading = false;
		}
	}

	async function deposit(amountMicro: bigint) {
		if (!canDeposit) return;

		busy = true;
		errorMsg = null;
		txHash = null;

		try {
			const vault = stacks.createVaultClient(daoConfig);
			const response = await vault.depositSip10ToVault({
				amountMicro,
				userChain: 'stacks',
				sourceAddress: getStxAddress(),
				senderStxAddress: stxAddress
			});

			if (!response.success) {
				throw new Error(response.error ?? 'Vault deposit failed');
			} else {
				showTxModal(response.txid);
				await watchTransaction(
					appConfig.VITE_BIGMARKET_API,
					appConfig.VITE_STACKS_API,
					`${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO}`,
					response.txid
				);
				//await refreshBalances();
			}

			txHash = response.txid ?? null;
			await loadBalances();
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
		}
	}
</script>

<div
	class="w-full space-y-4 rounded-lg border border-neutral-200 bg-neutral-50/80 p-5 dark:border-neutral-700 dark:bg-neutral-900/40"
>
	<div>
		<h2 class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Deposit USDCx</h2>
		<p class="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
			Move USDCx from your Stacks wallet into the BigMarket vault.
		</p>
	</div>

	{#if !stacksConnected}
		<p class="text-sm text-amber-800 dark:text-amber-200">
			Connect a <strong>Stacks</strong> wallet to deposit USDCx.
		</p>
	{:else}
		<div class="font-mono text-xs text-neutral-700 dark:text-neutral-300">
			<span class="text-neutral-500 dark:text-neutral-400">Stacks wallet</span>
			<span class="mt-0.5 block break-all">{stxAddress}</span>
		</div>

		<UsdcxWalletBalance {walletBalance} {vaultBalance} {loading} />

		<DepositAction
			maxBalance={walletBalance}
			{canDeposit}
			{busy}
			{txHash}
			{explorerUrl}
			{errorMsg}
			onDeposit={deposit}
		/>

		{#if appConfig.VITE_NETWORK === 'devnet'}
			<RelayTransfer {walletBalance} {appConfig} {daoConfig} />
		{/if}
	{/if}
</div>
