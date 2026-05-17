<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import {
		allowedTokenStore,
		appConfigStore,
		chainStore,
		daoOverviewStore,
		exchangeRatesStore,
		marketSystemCategoriesStore,
		requireAppConfig
	} from '@bigmarket/bm-common';
	import { daoConfigStore } from '@bigmarket/bm-common';
	import type { AppConfig, DaoConfig } from '@bigmarket/bm-types';
	import { onMount, type Snippet } from 'svelte';
	import Header from '$lib/components/template/Header.svelte';
	import ReputationCommunityBanner from '$lib/components/template/ReputationCommunityBanner.svelte';
	import Footer from '$lib/components/template/Footer.svelte';
	import { browser } from '$app/environment';
	import {
		closeTxModal,
		getStxAddress,
		initWallet,
		isLoggedIn,
		txModal
	} from '@bigmarket/bm-common';
	import TxModal from '$lib/components/template/TxModal.svelte';
	import { initAppShell } from '$lib/core/app/initAppShell';
	import { loadSystemData } from '$lib/core/app/loadSystemData';
	import { loadWalletData } from '$lib/core/app/loadWalletData';
	import type {
		DaoOverview,
		ExchangeRate,
		StacksInfo,
		TokenPermissionEvent,
		MarketCategory
	} from '@bigmarket/bm-types';

	let networkWarning = $state(false);
	let ready = $state(false);
	let modal: { open: boolean; txId?: string } = $state({ open: false });
	const { data, children } = $props<{
		data: {
			exchangeRates: ExchangeRate[];
			stacksInfo: StacksInfo;
			daoOverview: DaoOverview;
			tokens: TokenPermissionEvent[];
			marketCategories: MarketCategory[];
			network: string;
			appConfig: AppConfig;
			daoConfig: DaoConfig;
		};
		children: Snippet; // or Snippet if you want to be precise
	}>();
	$effect(() => {
		exchangeRatesStore.set(data.exchangeRates);
		chainStore.set({ stacks: data.stacksInfo });
		daoOverviewStore.set(data.daoOverview);
		allowedTokenStore.set(data.tokens);
		marketSystemCategoriesStore.set(data.marketCategories);
		appConfigStore.set(data.appConfig);
		daoConfigStore.set(data.daoConfig);
		networkWarning = false;
		modal = $txModal;
	});
	const checkNetwork = () => {
		if (!browser) return false;
		if (isLoggedIn()) {
			const stxAddress = getStxAddress();
			if (data.appConfig.VITE_NETWORK === 'mainnet') {
				if (!stxAddress.startsWith('SP') && !stxAddress.startsWith('SM')) {
					networkWarning = true;
				}
			} else {
				if (stxAddress.startsWith('SP') || stxAddress.startsWith('SM')) {
					networkWarning = true;
				}
			}
		}
	};

	// onMount(async () => {
	// 	await initWallet();
	// 	if (isLoggedIn()) {
	// 		await fetchWalletData(data.appConfig.VITE_STACKS_API);
	// 	}
	// 	ready = true;
	// });
	onMount(async () => {
		if (!browser) return;
		console.log('data', data);
		initAppShell(data?.appConfig?.VITE_STACKS_API);
		await loadSystemData(data)
		await initWallet(data?.appConfig?.VITE_BIGMARKET_API)
		await loadWalletData()

		// await Promise.all([loadSystemData(data), initWallet(data?.appConfig?.VITE_BIGMARKET_API).then(loadWalletData)]);

		ready = true;
		checkNetwork();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{#if !ready || !$daoConfigStore || !$appConfigStore || !$exchangeRatesStore || !$chainStore || !$daoOverviewStore || !$allowedTokenStore || !$marketSystemCategoriesStore}
	<!-- Splash screen -->
	<div
		id="splash-screen"
		class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
	>
		<img src="/splash.png" alt="BigMarket loading..." class="h-full w-full opacity-80" />
		<p class="mt-4 font-sans text-sm text-muted-foreground">Loading BigMarket...</p>
	</div>
{:else}
	<!-- App: column fills viewport; main grows between chrome and footer -->
	<div class="flex min-h-dvh flex-col bg-background text-foreground">
		{#if browser}
			<div class="shrink-0">
				<ReputationCommunityBanner />
				<Header />
			</div>
		{/if}

		<main class="flex min-h-0 w-full flex-1 flex-col">
			{#if networkWarning}
				<div class="flex flex-1 flex-col p-8 sm:p-12 lg:p-20">
					<div class="max-w-3xl grow">
						Incorrect network detected — this is
						<span class="text-warning">
							{requireAppConfig($appConfigStore).VITE_NETWORK}
						</span>
						Please switch wallet to this network.
					</div>
				</div>
			{:else}
				<div class="flex w-full flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
					{@render children()}
				</div>
			{/if}
		</main>

		<div class="shrink-0 border-t border-border">
			<Footer />
		</div>
	</div>
{/if}
{#if modal.open && modal.txId}
	<TxModal {modal} {closeTxModal} />
{/if}
