<script lang="ts">
	import type { Currency, PredictionMarketCreateEvent } from '@bigmarket/bm-types';
	import { Card, Countdown, LogoContainer } from '@bigmarket/bm-ui';
	import {
		getCategoryLabel,
		getOutcomeMessageOneWord,
		isDisputeRunning,
		isResolving,
		isRunning,
		isRunningAtBlock
	} from '@bigmarket/bm-utilities';
	import { onMount } from 'svelte';
	import Gauge from './Gauge.svelte';
	import CommentsHomepage from './CommentsHomepage.svelte';
	import MarketResolutionData from './MarketResolutionData.svelte';

	const {
		market,
		selectedCurrency,
		currentBurnHeight,
		disputeWindowLength,
		marketVotingDuration,
		forumApi,
		isCoordinator
	} = $props<{
		market: PredictionMarketCreateEvent;
		selectedCurrency: Currency;
		currentBurnHeight: number;
		disputeWindowLength: number;
		marketVotingDuration: number;
		forumApi: string;
		isCoordinator: boolean;
	}>();

	let inited = $state(false);
	let yesPercentage = $state(0);
	let totalStakesAll = $state(
		(market?.marketData?.stakes || []).reduce((acc: number, v: number) => acc + v, 0) || 0
	);

	const optionChance = (i: number) => {
		if (!totalStakesAll) return '0%';
		const v = ((market.marketData.stakes[i] || 0) / totalStakesAll) * 100;
		if (v > 0 && v < 1) return '<1%';
		return `${v.toFixed(0)}%`;
	};

	// pull the fields you need into reactive values
	const running = $derived(!!market && isRunningAtBlock(currentBurnHeight, market));
	const resolving = $derived(!!market && isResolving(market));
	const disputeRunning = $derived(!!market && isDisputeRunning(market));

	$effect(() => {
		const catsLen = market?.marketData?.categories?.length ?? 0;
		const stakes = market?.marketData?.stakes ?? [];

		if (market?.marketType === 1 && catsLen === 2 && Array.isArray(stakes) && stakes.length >= 2) {
			const totalStakes = stakes.reduce(
				(sum: number, stake: number) => sum + (Number(stake) || 0),
				0
			);
			const yesStakes = Number(stakes[1]) || 0;
			yesPercentage = totalStakes > 0 ? (yesStakes / totalStakes) * 100 : 50;
		} else {
			yesPercentage = 50;
		}
	});

	const isBinaryMarket = $derived(
		market?.marketType === 1 && (market?.marketData?.categories?.length ?? 0) === 2
	);

	onMount(() => {
		inited = true;
	});
</script>

<!-- Unified Polymarket-style Card (Tailwind utilities only) -->

{#if inited && market.marketData}
	<Card data-testId="market-card">
		<div>
			<!-- Header with market info and gauge aligned opposite -->
			<div class="flex min-w-0 items-center justify-between gap-2.5">
				<div class="flex min-w-0 items-center gap-2.5">
					<div class="flex-shrink-0 overflow-hidden rounded bg-gray-100 dark:bg-gray-800">
						<LogoContainer logo={market.unhashedData.logo} />
					</div>
					<div class="min-w-0 space-y-0.5">
						<h3
							class="line-clamp-2 text-[13px] leading-4 font-semibold text-gray-900 dark:text-gray-100"
						>
							<a
								href={`/market/${market.marketId}/${market.marketType}`}
								data-sveltekit-preload
								data-sveltekit-preload-data="hover"
								data-sveltekit-preload-code="hover"
								class="hover:text-orange-600 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 focus-visible:outline-none dark:hover:text-orange-400"
							>
								{@html market.unhashedData.name}
							</a>
						</h3>
					</div>
				</div>
				{#if isBinaryMarket}
					<div class="flex items-center">
						<Gauge percent={yesPercentage} radius={20} />
					</div>
				{/if}
			</div>
		</div>

		<div class="my-3 flex w-full items-center justify-center">
			<!-- <div class="w-1/12"><Gauge percent={Math.random() * 100} /></div> -->
			<div
				class="flex h-[50px] w-11/12 flex-col justify-center overflow-hidden px-1"
				data-testid="trading-row"
			>
				{#if isRunning(currentBurnHeight, market)}
					{#if isBinaryMarket}
						<!-- Binary Market CTAs -->
						<section class="flex h-full w-full items-center">
							<div class="flex w-full justify-between gap-2">
								<a
									href={`/market/${market.marketId}/${market.marketType}?option=1`}
									class="w-full items-center justify-center rounded-md border border-green-200 bg-green-50 px-2 py-1.5 text-[12px] font-medium text-green-700 hover:bg-green-100 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1 focus-visible:outline-none dark:border-green-900/50 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/40"
								>
									<span class="mr-1">↑</span> Buy Yes
								</a>

								<a
									href={`/market/${market.marketId}/${market.marketType}?option=0`}
									class="w-full items-center justify-center rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-[12px] font-medium text-red-700 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 focus-visible:outline-none dark:border-red-900/50 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/40"
								>
									<span class="mr-1">↓</span> Buy No
								</a>
							</div>
						</section>
					{:else}
						<!-- Categorical Market -->
						<section class="flex h-[50px] w-full flex-col overflow-hidden">
							{#each market.marketData.categories.slice(0, 2) as category, i (category.label + '-' + i)}
								<div
									class="flex w-full items-center justify-between overflow-hidden rounded px-2 py-0.5 text-[11px] hover:bg-gray-50 dark:hover:bg-gray-800"
								>
									<div class="truncate text-[10px] text-gray-900 dark:text-gray-100">
										{@html getCategoryLabel(selectedCurrency, i, market.marketData)}
									</div>

									<div class="flex items-center gap-2">
										<span
											class="text-right font-medium text-gray-600 tabular-nums dark:text-gray-400"
										>
											{optionChance(i)}
										</span>

										<a
											href={`/market/${market.marketId}/${market.marketType}?option=${i}`}
											class="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
										>
											Trade
										</a>
									</div>
								</div>
							{/each}
						</section>
					{/if}
				{:else}
					<section class="flex items-center justify-center">
						<div class="flex w-full gap-2">
							<div class="text-sm font-bold">
								{@html getOutcomeMessageOneWord(
									currentBurnHeight,
									disputeWindowLength,
									marketVotingDuration,
									market
								)}
							</div>
						</div>
					</section>
				{/if}
			</div>
		</div>

		<div>
			{#if market}
				<CommentsHomepage {market} {forumApi} />
			{/if}
		</div>
		<div>
			<div class="mt-3 flex justify-between text-[10px]">
				<div>
					{#if running}
						<Countdown
							endBlock={market.marketData?.marketStart +
								market.marketData?.marketDuration -
								currentBurnHeight}
						/>
					{:else if resolving}
						<Countdown
							endBlock={market.marketData?.marketStart +
								market.marketData?.marketDuration +
								market.marketData?.coolDownPeriod +
								disputeWindowLength -
								currentBurnHeight}
						/>
					{:else if disputeRunning}
						<Countdown
							endBlock={market.marketData?.resolutionBurnHeight +
								marketVotingDuration -
								currentBurnHeight}
						/>
					{:else}
						{getOutcomeMessageOneWord(
							currentBurnHeight,
							disputeWindowLength,
							marketVotingDuration,
							market
						)}
					{/if}
				</div>
				<div class="">
					<MarketResolutionData
						{market}
						{selectedCurrency}
						{currentBurnHeight}
						{disputeWindowLength}
						{marketVotingDuration}
						{isCoordinator}
					/>
				</div>
			</div>
		</div>
	</Card>
{/if}
