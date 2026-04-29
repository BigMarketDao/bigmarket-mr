<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		type LeaderBoard,
		type PredictionMarketAccounting,
		type PredictionMarketCreateEvent,
		type PredictionMarketStakeEvent,
		type UserLPShares,
		type UserStake,
		type UserTokens
	} from '@bigmarket/bm-types';
	import { bitcoinMode, getStxAddress, isLoggedIn } from '@bigmarket/bm-common';
	import { requireAppConfig, requireDaoConfig } from '@bigmarket/bm-common';
	import { appConfigStore, daoConfigStore } from '@bigmarket/bm-common';
	import type { AuthenticatedForumContent } from '@bigmarket/sip18-forum-types';
	import { PageContainer } from '@bigmarket/bm-ui';
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
	let userStake: UserStake | null = $state({stakes: []});
	let userTokens: UserTokens | null = $state({tokens: []});
	let userLPTokensShares: UserLPShares | null = $state({shares: []});
	let marketAccounting: PredictionMarketAccounting | null = $state(null);
	let marketStakes = $derived(data.marketStakes);

	const fetchUserData = async () => {
		userStake = await stacks
			.createMarketsClient(daoConfig)
			.fetchUserStake(
				appConfig.VITE_STACKS_API,
				market.marketId,
				market.extension.split('.')[0],
				market.extension.split('.')[1],
				getStxAddress()
			);
		userTokens = await stacks
			.createMarketsClient(daoConfig)
			.fetchUserTokens(
				appConfig.VITE_STACKS_API,
				market.marketId,
				market.extension.split('.')[0],
				market.extension.split('.')[1],
				getStxAddress()
			);
		userLPTokensShares = await stacks
			.createMarketsClient(daoConfig)
			.fetchUserLpBalances(
				appConfig.VITE_STACKS_API,
				market.marketId,
				getStxAddress(),
				market.extension.split('.')[0],
				market.extension.split('.')[1]
			);
	};

	const fetchAccountingData = async () => {
		marketAccounting = await stacks
		.createMarketsClient(daoConfig)
		.fetchMarketAccounting(
			appConfig.VITE_STACKS_API,
			market.marketId,
			market?.extension.split('.')[0],
			market?.extension.split('.')[1]
		);

	};

	// let markets = data.leaderAndMarketsData.markets;
	// let leaderBoard = data.leaderAndMarketsData.leaderBoard;
	let cleanupFunctions: (() => void)[] = [];

	onMount(async () => {
		if (isLoggedIn()) await fetchUserData();
		await fetchAccountingData();
		console.log('MarketStaking: onMount: market.extension: ', market.extension);
		console.log('MarketStaking: onMount: market.marketData: ', market.marketData);
		console.log('MarketStaking: onMount: userStake: ', userStake);
		console.log('MarketStaking: onMount: userTokens: ', userTokens);
		console.log('MarketStaking: onMount: userLPTokensShares: ', userLPTokensShares);
		console.log('MarketStaking: onMount: marketAccounting: ', marketAccounting);
		console.log('MarketStaking: onMount: marketStakes: ', marketStakes);
		console.log('MarketStaking: onMount: thread: ', thread);
		bitcoinMode.set(data.marketType === 3);
		console.log('userStake: ', userStake);
	});

	onDestroy(() => {
		// Clean up any event listeners or subscriptions
		cleanupFunctions.forEach((cleanup) => cleanup());
		cleanupFunctions = [];
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
		{#if market && thread && userStake && marketAccounting}
			<MarketContainer
				{market}
				marketStakes={data.marketStakes}
				{marketAccounting}
				{userStake}
				{userLPTokensShares}
				{thread}
				onRefreshUserData={fetchUserData}
			/>
			<!-- <MarketHeader
        description={market.unhashedData.description}
        logo={market.unhashedData.logo}
        name={market.unhashedData.name}
      /> -->
		{/if}
	</PageContainer>
</div>
