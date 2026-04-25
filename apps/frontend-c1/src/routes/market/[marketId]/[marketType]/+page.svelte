<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		type LeaderBoard,
		type PredictionMarketCreateEvent,
		type PredictionMarketStakeEvent,
		type UserStake
	} from '@bigmarket/bm-types';
	import { bitcoinMode } from '@bigmarket/bm-common';

	import type { AuthenticatedForumContent } from '@bigmarket/sip18-forum-types';
	import { PageContainer } from '@bigmarket/bm-ui';
	import {
		getStxAddress,
		requireAppConfig,
		requireDaoConfig,
		appConfigStore,
		daoConfigStore
	} from '@bigmarket/bm-common';
	import { MarketContainer } from '@bigmarket/bm-market';
	import { stacks } from '@bigmarket/sdk';

	const appConfig = $derived(requireAppConfig($appConfigStore));
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));
	const { data } = $props<{
		leaderAndMarketsData: { markets: Array<PredictionMarketCreateEvent>; leaderBoard: LeaderBoard };
		market: PredictionMarketCreateEvent;
		marketStakes: PredictionMarketStakeEvent[];
		thread: AuthenticatedForumContent | undefined;
	}>();

	let market = $derived(data.market);
	let thread = $derived(data.thread);

	// let markets = data.leaderAndMarketsData.markets;
	// let leaderBoard = data.leaderAndMarketsData.leaderBoard;
	let userStake: UserStake = { stakes: [] } as UserStake;
	let cleanupFunctions: (() => void)[] = [];

	onMount(async () => {
		bitcoinMode.set(data.marketType === 3);
		userStake = await stacks
			.createMarketsClient(daoConfig)
			.fetchUserStake(
				appConfig.VITE_STACKS_API,
				market.marketId,
				market.extension.split('.')[0],
				market.extension.split('.')[1],
				getStxAddress()
			);
		console.log('userStake: ', userStake);
	});

	onDestroy(() => {
		// Clean up any event listeners or subscriptions
		cleanupFunctions.forEach((cleanup) => cleanup());
		cleanupFunctions = [];

		// Clear any cached data to prevent memory leaks
		userStake = { stakes: [] } as UserStake;
	});
</script>

<svelte:head>
	<title>Market Volumes</title>
	<meta name="description" content="View prediction market details and participate" />
</svelte:head>

<div
	class="min-h-screen bg-gray-50 dark:bg-gray-900"
	data-market-page
	data-market-id={market?.marketId}
	data-market-type={market?.marketType}
>
	<PageContainer>
		{#if market && thread}
			<MarketContainer {thread} {market} marketStakes={data.marketStakes} />
			<!-- <MarketHeader
        description={market.unhashedData.description}
        logo={market.unhashedData.logo}
        name={market.unhashedData.name}
      /> -->
		{/if}
	</PageContainer>
</div>
