<script lang="ts">
	/**
	 * Page-level balance summary — always visible when any wallet is connected.
	 *
	 * Vault balance is fetched on-demand via SDK.
	 * Mapped address and its USDCx balance come from the persisted stores
	 * populated by initWallet + loadWalletData in layout.svelte.
	 */
	import { onMount } from 'svelte';
	import { stacks } from '@bigmarket/sdk';
	import {
		appConfigStore,
		daoConfigStore,
		initWallet,
		requireAppConfig,
		requireDaoConfig,
		userWalletStore,
		walletState
	} from '@bigmarket/bm-common';
	import { fmtMicroToStx, truncate } from '@bigmarket/bm-utilities';
	import type { WalletAccount } from '@bigmarket/bm-types';
	import { ExternalLink } from 'lucide-svelte';

	const appConfig = $derived(requireAppConfig($appConfigStore));
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));

	// ── connected wallet identity ─────────────────────────────────────────────
	const isStacksConnected = $derived(
		$walletState.status === 'connected' && $walletState.chain === 'stacks'
	);
	const isEvmConnected = $derived(
		$walletState.status === 'connected' && $walletState.chain === 'ethereum'
	);
	const anyConnected = $derived(isStacksConnected || isEvmConnected);

	const stxAddress = $derived(
		$walletState.accounts.find((a: WalletAccount) => a.type === 'stx')?.address ?? ''
	);
	const ethAddress = $derived(
		$walletState.accounts.find((a: WalletAccount) => a.type === 'eth')?.address ?? ''
	);
	const controllerLabel = $derived(isStacksConnected ? stxAddress : ethAddress);

	// Mapped address — populated in walletState by initWallet for all chains
	const mappedAddress = $derived($walletState.activeAccount?.mappedAddress ?? '');

	const usdcxKey = $derived(`${daoConfig.VITE_DAO_DEPLOYER}.usdcx::usdcx-token`);

	// Wallet USDCx (Stacks wallet address, from tokenBalances)
	const walletUsdcx = $derived(
		isStacksConnected
			? BigInt($userWalletStore.tokenBalances?.fungible_tokens[usdcxKey]?.balance || 0)
			: null
	);

	// ── balances (vault via contract, mapped via token API) ──────────────────
	let loading = $state(false);
	let vaultBalance = $state<bigint | null>(null);
	let mappedUsdcxLive = $state<bigint | null>(null);

	// Fall back to store value until a live fetch completes
	const mappedUsdcx = $derived(
		mappedUsdcxLive ??
			BigInt($userWalletStore.mappedTokenBalances?.fungible_tokens[usdcxKey]?.balance || 0)
	);

	const fmt = (v: bigint | null) => (v === null ? '—' : fmtMicroToStx(Number(v), 6));

	onMount(() => void initWallet(appConfig.VITE_BIGMARKET_API));

	$effect(() => {
		if (anyConnected) void loadAll();
	});

	async function loadAll() {
		loading = true;
		try {
			const vault = stacks.createVaultClient(daoConfig);
			if (isStacksConnected && stxAddress) {
				[vaultBalance, mappedUsdcxLive] = await Promise.all([
					vault.getVaultUsdcxBalance(appConfig.VITE_STACKS_API, 'stacks', stxAddress, stxAddress),
					mappedAddress
						? vault.getUsdcxBalance(appConfig.VITE_STACKS_API, mappedAddress)
						: Promise.resolve(0n)
				]);
			} else if (isEvmConnected && ethAddress && mappedAddress) {
				[vaultBalance, mappedUsdcxLive] = await Promise.all([
					vault.getVaultUsdcxBalance(appConfig.VITE_STACKS_API, 'evm', ethAddress, mappedAddress),
					vault.getUsdcxBalance(appConfig.VITE_STACKS_API, mappedAddress)
				]);
			}
		} catch {
			// silently ignore — user can click refresh
		} finally {
			loading = false;
		}
	}
</script>

{#if anyConnected}
	<div
		class="rounded-lg border border-neutral-200 bg-white/70 px-4 py-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/50"
	>
		<!-- header row -->
		<div class="mb-2.5 flex items-center justify-between">
			<div class="flex items-center gap-1.5">
				<span class="h-2 w-2 rounded-full bg-green-500"></span>
				<span class="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
					{isStacksConnected ? 'Stacks' : 'Ethereum'} wallet
				</span>
				{#if controllerLabel}
					<span class="font-mono text-[10px] text-neutral-400 dark:text-neutral-500">
						·&nbsp;{controllerLabel.slice(0, 10)}…
					</span>
				{/if}
			</div>
		<button
			type="button"
			onclick={() => void loadAll()}
			disabled={loading}
				class="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-neutral-600 disabled:cursor-wait dark:hover:text-neutral-200"
				title="Refresh balances"
			>
				<!-- refresh icon -->
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 16 16"
					fill="currentColor"
					class="h-3 w-3 {loading ? 'animate-spin' : ''}"
				>
					<path
						fill-rule="evenodd"
						d="M13.836 2.477a.75.75 0 0 1 .75.75v3.182a.75.75 0 0 1-.75.75h-3.182a.75.75 0 0 1 0-1.5h1.37l-.84-.841a4.5 4.5 0 0 0-7.08.932.75.75 0 0 1-1.3-.75 6 6 0 0 1 9.44-1.242l.842.84V3.227a.75.75 0 0 1 .75-.75Zm-.911 7.5A.75.75 0 0 1 13.199 11a6 6 0 0 1-9.44 1.241l-.84-.84v1.371a.75.75 0 0 1-1.5 0V9.591a.75.75 0 0 1 .75-.75H5.35a.75.75 0 0 1 0 1.5H3.98l.841.841a4.5 4.5 0 0 0 7.08-.932.75.75 0 0 1 1.024-.273Z"
						clip-rule="evenodd"
					/>
				</svg>
				{loading ? 'Loading…' : 'Refresh'}
			</button>
		</div>

		<!-- balance tiles -->
		<div class="grid grid-cols-1 gap-2 md:grid-cols-3">
			<!-- Vault (primary) -->
			<div
				class="col-span-1 rounded-md border border-green-200 bg-green-50/60 p-2.5 dark:border-green-700/60 dark:bg-green-900/10"
			>
				<p class="text-[10px] text-neutral-500 dark:text-neutral-400">Vault USDCx</p>
				<p class="mt-0.5 text-base font-semibold text-neutral-900 dark:text-neutral-100">
					{loading ? '…' : fmt(vaultBalance)}
				</p>
				<p class="mt-0.5 font-mono text-[9px] text-neutral-400">
					<a
						class="flex items-center gap-1 rounded-md px-3 py-1 text-community hover:bg-community-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
						href={stacks.explorerAddressUrl(
							appConfig.VITE_NETWORK,
							appConfig.VITE_STACKS_EXPLORER,
							`${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO_VAULT}`
						)}
						target="_blank"
					>
						<ExternalLink class="h-4 w-4" />
						{daoConfig.VITE_DAO_VAULT}
					</a>
				</p>
			</div>

			<!-- Wallet USDCx (Stacks only; show N/A for EVM) -->
			<div
				class="col-span-1 rounded-md border border-neutral-200 bg-neutral-50/80 p-2.5 dark:border-neutral-600 dark:bg-neutral-900/40"
			>
				<p class="text-[10px] text-neutral-500 dark:text-neutral-400">
					{isStacksConnected ? 'Wallet USDCx' : 'Wallet USDC'}
				</p>
				<p class="mt-0.5 text-base font-semibold text-neutral-900 dark:text-neutral-100">
					{loading ? '…' : isStacksConnected ? fmt(walletUsdcx) : '—'}
				</p>
				{#if $walletState.chain === 'ethereum'}
					<p class="mt-0.5 text-[9px] text-neutral-400">
						{$walletState.accounts.find((a) => a.type === 'eth')?.address ?? ''}
					</p>
				{:else}
					<p class="mt-0.5 font-mono text-[9px] text-neutral-400">
						<a
							class="flex items-center gap-1 rounded-md px-3 py-1 text-community hover:bg-community-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
							href={stacks.explorerAddressUrl(
								appConfig.VITE_NETWORK,
								appConfig.VITE_STACKS_EXPLORER,
								`${stxAddress}`
							)}
							target="_blank"
						>
							<ExternalLink class="h-4 w-4" />
							{truncate(stxAddress, 10)}
						</a>
					</p>
				{/if}
			</div>

		<!-- Mapped address USDCx -->
		<div
			class="col-span-1 rounded-md border border-neutral-200 bg-neutral-50/80 p-2.5 dark:border-neutral-600 dark:bg-neutral-900/40"
		>
			<p class="text-[10px] text-neutral-500 dark:text-neutral-400">Mapped USDCx</p>
			<p class="mt-0.5 text-base font-semibold text-neutral-900 dark:text-neutral-100">
				{loading ? '…' : fmt(mappedUsdcx)}
			</p>
			{#if mappedAddress}
				<p class="mt-0.5 font-mono text-[9px] text-neutral-400">
					<a
						class="flex items-center gap-1 rounded-md px-3 py-1 text-community hover:bg-community-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
						href={stacks.explorerAddressUrl(
							appConfig.VITE_NETWORK,
							appConfig.VITE_STACKS_EXPLORER,
							mappedAddress
						)}
						target="_blank"
					>
						<ExternalLink class="h-4 w-4" />
						{truncate(mappedAddress, 10)}
					</a>
				</p>
			{/if}
		</div>
		</div>
	</div>
{/if}
