<script lang="ts">
	import { browser } from '$app/environment';
	import MarketPlace from '$lib/components/home/MarketPlace.svelte';
	import type { LeaderBoard, PredictionMarketCreateEvent } from '@bigmarket/bm-types';
	import { PageContainer } from '@bigmarket/bm-ui';
	import { onMount, type Snippet } from 'svelte';

	const { data } = $props<{
		markets: Array<PredictionMarketCreateEvent>;
		leaderBoard: LeaderBoard;
		network: string;
		children: Snippet; // or Snippet if you want to be precise
	}>();

	const markets = $derived(data.markets);
	const leaderBoard = $derived(data.leaderBoard);
	// console.log('fetching data: ', JSON.stringify(data, null, 2));
	onMount(async () => {
		if (!browser) return;
	});
</script>

<svelte:head>
	<title>Bitcoin Prediction Markets</title>
	<meta
		name="description"
		content="BigMarketDAO and AI powered prediction markets built on Bitcoin"
	/>
</svelte:head>

<PageContainer>
	{#if markets && markets.length > 0}
		<MarketPlace {markets} {leaderBoard} />
	{:else}
		<div
			class="flex flex-col items-center justify-center text-center text-gray-900 dark:text-gray-100"
		>
			<p class="mb-4 text-lg font-medium">No markets available…</p>
			<img
				src="/splash.png"
				alt="BigMarket loading..."
				class="max-w-md rounded-lg border border-purple-600/20 shadow"
			/>
		</div>
	{/if}
</PageContainer>
