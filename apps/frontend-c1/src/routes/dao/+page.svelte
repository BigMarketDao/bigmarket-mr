<script lang="ts">
	import { PageContainer } from '@bigmarket/bm-ui';
	import DaoIntro from '$lib/components/dao/DaoIntro.svelte';
	import DaoTabs from '$lib/components/dao/DaoTabs.svelte';
	import Disputes from '$lib/components/dao/disputes/Disputes.svelte';
	import MakeProposal from '$lib/components/dao/proposals/MakeProposal.svelte';
	import Proposals from '$lib/components/dao/proposals/Proposals.svelte';
	import {
		constructed,
		daoOverviewStore,
		exchangeRatesStore,
		selectedCurrency
	} from '@bigmarket/bm-common';
	import { onMount } from 'svelte';
	import ConstructDao from '$lib/components/dao/construction/ConstructDao.svelte';
	import ProvideLiquidity from '$lib/components/dao/liquidity/ProvideLiquidity.svelte';
	import { getDaoOverview } from '$lib/core/app/loaders/governance/dao_api';
	import { daoConfigStore, requireDaoConfig } from '@bigmarket/bm-common';
	import {
		getContractDeploymentTxId,
		isDaoConstructed
	} from '$lib/core/app/loaders/dao_manager_helper';
	import { convertFiatToNative } from '@bigmarket/bm-utilities';

	const daoConfig = $derived(requireDaoConfig($daoConfigStore));

	let fiatPerStx = $state(0);
	let isLoading = $state(true);
	let error: string | null = $state(null);
	let inited = $state(false);
	let componentKey = $state(0);
	let currentPage = $state('dao-with-liquidity');

	const handleChange = (tab: string) => {
		currentPage = tab;
		componentKey++;
	};

	onMount(async () => {
		try {
			let construction = false;
			const cId = `${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO}`;
			const txId = await getContractDeploymentTxId(cId);
			if (txId) construction = await isDaoConstructed(cId);
			constructed.set(construction ?? false);

			if (!$daoOverviewStore) {
				const daoOverview = await getDaoOverview();
				daoOverviewStore.set(daoOverview);
			}

			// 0.05 USD per BIG -> 1 USD = 1/0.05 BIG = 20 BIG
			// 1 USD = x STX
			// x SXT = 1 USD = 1/0.05 BIG
			// 1 STX = 1/x USD = 1/(0.05x)
			try {
				fiatPerStx = convertFiatToNative($exchangeRatesStore, 1, $selectedCurrency.code);
			} catch (err) {
				console.error('Failed to get STX token rate:', err);
				fiatPerStx = 0;
			}
		} catch (err) {
			console.error('Failed to load token sale data:', err);
			error = 'Failed to load token sale data. Please check your connection and try again.';
			isLoading = false;
		} finally {
			isLoading = false;
		}
		inited = true;
	});
</script>

<svelte:head>
	<title>BigMarket - IDO Token Sale</title>
	<meta
		name="description"
		content="DAO Governance tokens to participate in BigMarket prediction markets on Bitcoin"
	/>
</svelte:head>

{#if inited}
	<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
		<PageContainer>
			{#key componentKey}
				{#if isLoading}
					<div class="flex min-h-[400px] items-center justify-center">
						<div class="text-center">
							<div
								class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-500"
							></div>
							<p class="text-lg text-gray-600 dark:text-gray-400">Loading token sale data...</p>
						</div>
					</div>
				{:else if error}
					<!-- Error State -->
					<div class="flex min-h-[400px] items-center justify-center">
						<div class="max-w-md text-center">
							<div class="mb-4 text-6xl text-red-500">⚠️</div>
							<h2 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
								Failed to Load
							</h2>
							<p class="mb-4 text-gray-600 dark:text-gray-400">{error}</p>
							<button
								onclick={() => window.location.reload()}
								class="rounded-lg bg-orange-500 px-4 py-2 text-white transition-colors hover:bg-orange-600"
							>
								Try Again
							</button>
						</div>
					</div>
				{:else}
					{#key componentKey}<DaoTabs {currentPage} onReload={handleChange} />{/key}
					<!-- Hero Section: 2-Column Layout -->
					<div class="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
						<div class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
							{#if currentPage === 'dao-with-liquidity'}
								<div class="grid gap-12 lg:grid-cols-5 lg:gap-16">
									<!-- Left Content: 3 columns width -->
									<div class="space-y-16 lg:col-span-5">
										<DaoIntro />
									</div>
									<!-- Right Sidebar: Purchase Widget (2 columns width) -->
									<!-- TODO MJC: REPUTATION <div class="max-w-3xl"> -->
									<div class="lg:col-span-2">
										<div class="">
											<ProvideLiquidity {fiatPerStx} />
										</div>
									</div>
								</div>
							{:else if currentPage === 'bootup'}
								<ConstructDao />
							{:else if currentPage === 'propose'}
								<MakeProposal />
							{:else if currentPage === 'proposals'}
								<Proposals />
							{:else if currentPage === 'disputes'}
								<Disputes />
							{:else}Losts!
							{/if}
						</div>
					</div>
				{/if}
			{/key}
		</PageContainer>
	</div>
{/if}
