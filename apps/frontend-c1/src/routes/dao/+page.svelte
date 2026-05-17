<script lang="ts">
	import { page } from '$app/state';
	import DaoLanding from '$lib/components/dao/landing/DaoLanding.svelte';
	import DaoControlPanel from '$lib/components/dao/panel/DaoControlPanel.svelte';
	import ConstructDao from '$lib/components/dao/construction/ConstructDao.svelte';
	import MakeProposal from '$lib/components/dao/proposals/MakeProposal.svelte';
	import {
		constructed,
		daoOverviewStore,
		walletState
	} from '@bigmarket/bm-common';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { getDaoOverview } from '$lib/core/app/loaders/governance/dao_api';
	import { daoConfigStore, requireDaoConfig } from '@bigmarket/bm-common';
	import {
		getContractDeploymentTxId,
		isDaoConstructed
	} from '$lib/core/app/loaders/dao_manager_helper';
	import { fetchProposals } from '$lib/core/app/loaders/governance/proposals';
	import { AlertTriangle } from 'lucide-svelte';

	const daoConfig = $derived(requireDaoConfig($daoConfigStore));

	let error: string | null = $state(null);
	let proposalCount = $state<number | null>(null);
	let activeMarkets = $state<number | null>(null);

	const subPage = $derived(page.url.searchParams.get('page'));
	const previewMode = $derived(page.url.searchParams.get('preview') === '1');

	const loggedIn = $derived(
		($walletState.status === 'connected' && ($walletState.accounts?.length ?? 0) > 0) ||
			previewMode
	);

	function scrollToPanel() {
		document.getElementById('control-panel')?.scrollIntoView({ behavior: 'smooth' });
	}

	onMount(() => {
		activeMarkets = get(daoOverviewStore)?.contractData?.marketCounter ?? null;

		(async () => {
			try {
				const cId = `${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO}`;
				const txId = await getContractDeploymentTxId(cId);
				const construction = txId ? await isDaoConstructed(cId) : false;
				constructed.set(construction ?? false);
			} catch (err) {
				console.error('DAO construction check failed:', err);
			}
		})();

		(async () => {
			try {
				if (!get(daoOverviewStore)) {
					const daoOverview = await getDaoOverview();
					daoOverviewStore.set(daoOverview);
				}
				activeMarkets = get(daoOverviewStore)?.contractData?.marketCounter ?? null;
			} catch (err) {
				console.error('DAO overview load failed:', err);
			}
		})();

		(async () => {
			try {
				const proposals = await fetchProposals();
				proposalCount = proposals?.length ?? 0;
			} catch {
				proposalCount = null;
			}
		})();
	});
</script>

<svelte:head>
	<title>BigMarket DAO — Community governance</title>
	<meta
		name="description"
		content="BigMarket is governed by BIG token holders. Learn how the DAO works and participate in votes, disputes, and reputation rewards."
	/>
</svelte:head>

<div class="relative min-h-screen bg-background">
	{#if error}
		<div class="flex min-h-[400px] items-center justify-center">
			<div class="max-w-md text-center">
				<AlertTriangle class="mx-auto mb-4 h-12 w-12 text-destructive" aria-hidden="true" />
				<h2 class="mb-2 text-xl font-semibold text-foreground">Failed to load</h2>
				<p class="mb-4 text-muted-foreground">{error}</p>
				<button
					type="button"
					onclick={() => window.location.reload()}
					class="h-11 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:h-10"
				>
					Try again
				</button>
			</div>
		</div>
	{:else if subPage === 'propose'}
		<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
			<MakeProposal />
		</div>
	{:else if subPage === 'bootup'}
		<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
			<ConstructDao />
		</div>
	{:else if loggedIn}
		<DaoControlPanel />
	{:else}
		<DaoLanding {activeMarkets} {proposalCount} onScrollToPanel={scrollToPanel} />
		<DaoControlPanel />
	{/if}
</div>
