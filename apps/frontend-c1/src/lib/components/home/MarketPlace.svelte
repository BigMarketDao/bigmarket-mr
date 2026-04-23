<script lang="ts">
	import type { LeaderBoard, PredictionMarketCreateEvent } from '@bigmarket/bm-types';
	import { onMount } from 'svelte';
	import FilteredMarketView from './filter/FilteredMarketView.svelte';
	import { marketSystemCategoriesStore } from '@bigmarket/bm-common';

	const { markets, leaderBoard } = $props<{
		markets: Array<PredictionMarketCreateEvent>;
		leaderBoard: LeaderBoard;
	}>();

	onMount(async () => {});
</script>

<div class="mx-auto w-full max-w-7xl space-y-10">
	<!-- All Markets -->
	<section>
		<FilteredMarketView {markets} marketCategories={$marketSystemCategoriesStore} />
	</section>

	<!-- Info Panels -->
	<section>
		<InfoPanelContainer />
	</section>

	<!-- Ending Soon section removed - cards now show time info and are sorted by expiration -->

	<!-- Leaderboard -->
	<section>
		<LeaderBoardDisplay layout={2} {leaderBoard} {markets} filterTo={undefined} />
	</section>
</div>
