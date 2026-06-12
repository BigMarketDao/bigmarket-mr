<script lang="ts">
	/**
	 * Generic "sweep mapped address → vault" panel.
	 *
	 * Reused by both the EVM deposit flow (after AllBridge lands USDCx at the
	 * mapped address) and the Stacks relay path in StacksVaultPanel.
	 *
	 * The mapped address is read from walletState (populated by initWallet).
	 * The initial balance comes from userWalletStore.mappedTokenBalances.
	 * "Refresh" triggers a live SDK call to get the current on-chain balance.
	 *
	 * Props:
	 *   sourceChain   – 'evm' | 'stacks'
	 *   sourceAddress – the controller identity (ETH 0x… or STX address)
	 */
	import { Button } from '@bigmarket/bm-ui';
	import { stacks } from '@bigmarket/sdk';
	import {
		appConfigStore,
		daoConfigStore,
		requireAppConfig,
		requireDaoConfig,
		userWalletStore,
		walletState
	} from '@bigmarket/bm-common';
	import { fmtMicroToStx, requestMappedDepositToVault } from '@bigmarket/bm-utilities';
	import type { VaultUserChain } from '@bigmarket/bm-types';

	type Props = {
		sourceChain: VaultUserChain;
		sourceAddress: string;
		/** Called after a successful sweep so the parent can refresh its balances. */
		onSwept?: (txid: string) => void;
	};

	const { sourceChain, sourceAddress, onSwept }: Props = $props();

	const appConfig = $derived(requireAppConfig($appConfigStore));
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));

	// Mapped address comes from walletState (set during initWallet)
	const mappedAddress = $derived($walletState.activeAccount?.mappedAddress ?? '');

	const usdcxKey = $derived(
		`${daoConfig.VITE_USDCX_CONTRACT_ADDRESS}.${daoConfig.VITE_USDCX_CONTRACT_NAME}::usdcx-token`
	);

	// Initial balance from store; refreshed on demand via SDK
	const storeBalance = $derived(
		BigInt($userWalletStore.mappedTokenBalances?.fungible_tokens[usdcxKey]?.balance || 0)
	);

	let liveBalance = $state<bigint | null>(null); // null = not yet refreshed
	let refreshing = $state(false);
	let loadError = $state<string | null>(null);

	// Effective balance: live (after refresh) or store
	const mappedBalance = $derived(liveBalance ?? storeBalance);
	const balanceDisplay = $derived(fmtMicroToStx(Number(mappedBalance), 6));

	let sweepBusy = $state(false);
	let sweepTxid = $state<string | null>(null);
	let sweepError = $state<string | null>(null);

	const sweepExplorerUrl = $derived(
		sweepTxid
			? stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, sweepTxid)
			: null
	);

	const canSweep = $derived(!sweepBusy && mappedAddress.length > 0 && mappedBalance > 0n);

	async function refreshBalance() {
		if (!mappedAddress) return;
		refreshing = true;
		loadError = null;
		try {
			const vault = stacks.createVaultClient(daoConfig);
			liveBalance = await vault.getUsdcxBalance(appConfig.VITE_STACKS_API, mappedAddress);
		} catch (e) {
			loadError = e instanceof Error ? e.message : String(e);
		} finally {
			refreshing = false;
		}
	}

	async function sweepToVault() {
		if (!canSweep) return;
		sweepBusy = true;
		sweepError = null;
		sweepTxid = null;
		try {
			const result = await requestMappedDepositToVault(
				appConfig.VITE_BIGMARKET_API,
				sourceChain,
				sourceAddress
			);
			sweepTxid = result.txid;
			liveBalance = 0n;
			onSwept?.(result.txid);
		} catch (e) {
			sweepError = e instanceof Error ? e.message : String(e);
		} finally {
			sweepBusy = false;
		}
	}
</script>

<div class="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-600">
	<!-- Header row -->
	<div class="flex items-center justify-between">
		<p class="text-xs font-medium text-neutral-700 dark:text-neutral-300">
			Sweep mapped address → vault
			{#if mappedBalance > 0n}
				<span class="ml-1.5 text-emerald-600 dark:text-emerald-400">
					({balanceDisplay} USDCx ready)
				</span>
			{/if}
		</p>
		<button
			type="button"
			onclick={() => void refreshBalance()}
			disabled={refreshing}
			class="text-[10px] text-neutral-400 underline hover:text-neutral-600 disabled:cursor-wait dark:hover:text-neutral-200"
		>
			{refreshing ? '…' : 'refresh'}
		</button>
	</div>

	<!-- Mapped address -->
	{#if mappedAddress}
		<p class="break-all font-mono text-[10px] text-neutral-400 dark:text-neutral-500">
			<a
				href={stacks.explorerAddressUrl(
					appConfig.VITE_NETWORK,
					appConfig.VITE_STACKS_EXPLORER,
					mappedAddress
				)}
				target="_blank"
				rel="noreferrer"
				class="underline hover:text-neutral-600 dark:hover:text-neutral-300"
			>
				{mappedAddress}
			</a>
		</p>
	{/if}

	{#if loadError}
		<p class="text-[11px] text-red-600 dark:text-red-400">{loadError}</p>
	{/if}

	{#if sweepError}
		<p class="text-xs text-red-700 dark:text-red-300">{sweepError}</p>
	{/if}

	{#if sweepTxid}
		<p class="text-xs text-emerald-700 dark:text-emerald-300">
			Sweep submitted.
			{#if sweepExplorerUrl}
				<a
					class="font-mono break-all underline"
					href={sweepExplorerUrl}
					target="_blank"
					rel="noreferrer">{sweepTxid}</a
				>
			{:else}
				<span class="font-mono break-all">{sweepTxid}</span>
			{/if}
		</p>
	{/if}

	<p class="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
		Moves all USDCx from the mapped address into the vault, crediting your
		{sourceChain === 'evm' ? 'Ethereum' : 'Stacks'} identity.
	</p>

	<Button
		type="button"
		onclick={sweepToVault}
		disabled={!canSweep}
		class="w-full cursor-pointer"
	>
		{sweepBusy
			? 'Sweeping…'
			: mappedBalance > 0n
				? `Sweep ${balanceDisplay} to vault`
				: 'Sweep mapped balance to vault'}
	</Button>
</div>
