<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';
	import { daoConfigStore } from '$lib/stores/config/daoConfigStore';
	import type { AppConfig, DaoConfig } from '@bigmarket/bm-config';
	import { onMount, type Snippet } from 'svelte';
	import Header from '$lib/components/template/Header.svelte';
	import Footer from '$lib/components/template/Footer.svelte';
	import { browser } from '$app/environment';
	import AlphaBanner from '$lib/components/template/AlphaBanner.svelte';
	import { closeTxModal, fetchWalletData, initWallet, isLoggedIn, txModal } from '@bigmarket/bm-common';
	import TxModal from '$lib/components/template/TxModal.svelte';

	let networkWarning = $state(false);
	let ready = $state(false);
	let modal: { open: boolean; txId?: string } = $state({ open: false });
	const { data, children } = $props<{
		data: {
			network: string;
			appConfig: AppConfig;
			daoConfig: DaoConfig;
		};
		children: Snippet; // or Snippet if you want to be precise
	}>();
	$effect(() => {
		appConfigStore.set(data.appConfig);
		daoConfigStore.set(data.daoConfig);
		networkWarning = false;
		modal = $txModal;
	});
	onMount(async () => {
		await initWallet();
		if (isLoggedIn()) {
			await fetchWalletData(data.appConfig.VITE_STACKS_API);
		}
		ready = true;
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{#if !ready || !$daoConfigStore || !$appConfigStore}
	<!-- Splash screen -->
	<div
		id="splash-screen"
		class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gray-900"
	>
		<img src="/splash.png" alt="BigMarket loading..." class="h-full w-full opacity-80" />
		<p class="mt-4 font-sans text-sm text-gray-500">Loading BigMarket...</p>
	</div>
{:else}
	<!-- App: column fills viewport; main grows between chrome and footer -->
	<div
		class="flex min-h-dvh flex-col bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100"
	>
		{#if browser}
			<div class="shrink-0">
				<AlphaBanner />
				<Header />
			</div>
		{/if}

		<main class="flex min-h-0 w-full flex-1 flex-col">
			{#if networkWarning}
				<div class="flex flex-1 flex-col p-8 sm:p-12 lg:p-20">
					<div class="max-w-3xl grow">
						Incorrect network detected — this is
						<span class="text-orange-800 dark:text-orange-300">
							{requireAppConfig($appConfigStore).VITE_NETWORK}
						</span>
						. Please switch wallet to this network.
					</div>
				</div>
			{:else}
				<div class="flex w-full flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
					{@render children()}
				</div>
			{/if}
		</main>

		<div class="shrink-0 border-t border-purple-600/20 dark:border-purple-500/25">
			<Footer />
		</div>
	</div>
{/if}
{#if modal.open && modal.txId}
	<TxModal {modal} {closeTxModal} />
{/if}
