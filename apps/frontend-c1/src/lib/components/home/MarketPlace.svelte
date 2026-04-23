<script lang="ts">
	import type { LeaderBoard, PredictionMarketCreateEvent } from '@bigmarket/bm-types';
	import { onMount } from 'svelte';
	import {
		chainStore,
		daoOverviewStore,
		marketSystemCategoriesStore,
		selectedCurrency
	} from '@bigmarket/bm-common';
	import { FilteredMarketView } from '@bigmarket/bm-market-homepage';
	import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';

	const appConfig = $derived(requireAppConfig($appConfigStore));
	const { markets, leaderBoard } = $props<{
		markets: Array<PredictionMarketCreateEvent>;
		leaderBoard: LeaderBoard;
	}>();

	onMount(async () => {
		console.log('markets: ', markets);
		console.log('leaderBoard: ', leaderBoard);
	});
</script>

<div class="mx-auto w-full max-w-7xl space-y-10">
	<!-- All Markets -->
	<section>
		<FilteredMarketView
			{markets}
			marketCategories={$marketSystemCategoriesStore}
			selectedCurrency={$selectedCurrency}
			currentBurnHeight={$chainStore.stacks.burn_block_height}
			disputeWindowLength={$daoOverviewStore.contractData.disputeWindowLength}
			marketVotingDuration={$daoOverviewStore.contractData.marketVotingDuration}
			forumApi={appConfig.VITE_FORUM_API}
		/>
	</section>	

	<!-- Info Panels -->
	<!-- <section>
		<InfoPanelContainer />
	</section> -->

	<!-- Ending Soon section removed - cards now show time info and are sorted by expiration -->

	<!-- Leaderboard -->
	<!-- <section>
		<LeaderBoardDisplay layout={2} {leaderBoard} {markets} filterTo={undefined} />
	</section> -->
</div>
