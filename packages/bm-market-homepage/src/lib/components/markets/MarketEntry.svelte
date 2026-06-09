<script lang="ts">
	import type {
		Currency,
		ExchangeRate,
		PredictionMarketCreateEvent,
		TokenPermissionEvent
	} from '@bigmarket/bm-types';
	import { Card, Countdown, LogoContainer } from '@bigmarket/bm-ui';
	import {
		fmtProbability,
		getCategoryLabel,
		getMarketToken,
		getOutcomeMessageOneWord,
		isDisputeRunning,
		isResolving,
		isRunning,
		isRunningAtBlock
	} from '@bigmarket/bm-utilities';
	import { TrendingUp } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import Gauge from './Gauge.svelte';
	import LatestTradesHomepage from './LatestTradesHomepage.svelte';
	import MarketResolutionData from './MarketResolutionData.svelte';

	const {
		market,
		selectedCurrency,
		currentBurnHeight,
		disputeWindowLength,
		marketVotingDuration,
		bmApi,
		tokens = [],
		exchangeRates = [],
		isCoordinator
	} = $props<{
		market: PredictionMarketCreateEvent;
		selectedCurrency: Currency;
		currentBurnHeight: number;
		disputeWindowLength: number;
		marketVotingDuration: number;
		bmApi: string;
		tokens?: TokenPermissionEvent[];
		exchangeRates?: ExchangeRate[];
		isCoordinator: boolean;
	}>();

	const marketTokenSymbol = $derived(getMarketToken(market.marketData?.token ?? '', tokens).symbol);

	let inited = $state(false);
	let predictionCount = $state(0);
	let yesPercentage = $state(0);
	const isTrending = $derived(predictionCount > 5);
	let totalStakesAll = $state(
		(market?.marketData?.stakes || []).reduce((acc: number, v: number) => acc + v, 0) || 0
	);

	const optionChance = (i: number) => {
		if (!totalStakesAll) return '0% chance';
		const v = ((market.marketData.stakes[i] || 0) / totalStakesAll) * 100;
		return fmtProbability(v);
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

{#if inited && market.marketData}
	<Card
		class="flex h-full min-h-[13.5rem] flex-col gap-0 p-3 hover:shadow-md"
		data-testId="market-card"
	>
		<!-- Header -->
		<div class="flex min-h-[3.25rem] shrink-0 items-start justify-between gap-2 pb-2">
			<div class="flex min-w-0 flex-1 items-start gap-2.5">
				<div class="border-border bg-muted h-11 w-11 shrink-0 overflow-hidden rounded-[8px] border">
					<LogoContainer logo={market.unhashedData.logo} />
				</div>
				<div class="min-w-0 flex-1">
					<h3 class="text-card-foreground line-clamp-2 text-sm leading-snug font-semibold">
						<a
							href={`/market/${market.marketId}/${market.marketType}`}
							data-sveltekit-preload
							data-sveltekit-preload-data="hover"
							data-sveltekit-preload-code="hover"
							class="hover:text-primary focus-visible:ring-ring block transition-colors focus-visible:ring-2 focus-visible:outline-none"
						>
							{@html market.unhashedData.name}
						</a>
					</h3>
				</div>
			</div>

			{#if isBinaryMarket}
				<div class="shrink-0 pl-1">
					<Gauge percent={yesPercentage} radius={20} />
				</div>
			{/if}
		</div>

		<!-- Trading body — vertically centered in remaining card space -->
		<div
			class="flex min-h-[4.5rem] flex-1 flex-col items-center justify-center py-1"
			data-testid="trading-row"
		>
			{#if isRunning(currentBurnHeight, market)}
				{#if isBinaryMarket}
					<section class="flex w-full items-stretch gap-2">
						<a
							href={`/market/${market.marketId}/${market.marketType}?option=1`}
							class="border-success-border bg-price-up-soft text-price-up hover:bg-price-up-soft/80 focus-visible:ring-ring flex min-h-[2.2rem] flex-1 items-center justify-center rounded-[8px] border px-2.5 py-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
						>
							Yes
						</a>
						<a
							href={`/market/${market.marketId}/${market.marketType}?option=0`}
							class="border-destructive-border bg-price-down-soft text-price-down hover:bg-price-down-soft/80 focus-visible:ring-ring flex min-h-[2.2rem] flex-1 items-center justify-center rounded-[8px] border px-2.5 py-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
						>
							No
						</a>
					</section>
				{:else}
					<section class="flex w-full flex-col gap-1">
						{#each market.marketData.categories.slice(0, 2) as category, i (category.label + '-' + i)}
							<div
								class="hover:bg-muted/60 flex min-h-8 w-full items-center justify-between gap-2 rounded-md px-1.5 py-1 transition-colors"
							>
								<div class="text-card-foreground min-w-0 flex-1 truncate text-xs font-medium">
									{@html getCategoryLabel(selectedCurrency, i, market.marketData)}
								</div>

								<div class="flex shrink-0 items-center gap-1.5">
									<span
										class="text-muted-foreground min-w-18 text-right text-xs font-semibold tabular-nums"
									>
										{optionChance(i)}
									</span>

									<div class="flex items-center gap-1">
										<a
											href={`/market/${market.marketId}/${market.marketType}?option=${i}`}
											class="border-success-border bg-price-up-soft text-price-up hover:bg-price-up-soft/80 focus-visible:ring-ring rounded-[8px] border px-1.5 py-0.5 text-[10px] font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
										>
											Yes
										</a>
										<a
											href={`/market/${market.marketId}/${market.marketType}?option=${i}`}
											class="border-destructive-border bg-price-down-soft text-price-down hover:bg-price-down-soft/80 focus-visible:ring-ring rounded-[8px] border px-1.5 py-0.5 text-[10px] font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
										>
											No
										</a>
									</div>
								</div>
							</div>
						{/each}
					</section>
				{/if}
			{:else}
				<section class="bg-muted/40 flex min-h-11 items-center justify-center rounded-md px-2">
					<p class="text-card-foreground text-center text-sm font-semibold tabular-nums">
						{@html getOutcomeMessageOneWord(
							currentBurnHeight,
							disputeWindowLength,
							marketVotingDuration,
							market
						)}
					</p>
				</section>
			{/if}
		</div>

		<div class="mt-auto w-full shrink-0">
			{#if market && bmApi}
				<div class="pt-1.5 pb-2.5">
					<LatestTradesHomepage
						{market}
						{bmApi}
						{tokens}
						{selectedCurrency}
						{exchangeRates}
						onTradesLoaded={(info) => (predictionCount = info.count)}
					/>
				</div>
			{/if}

			<div class="border-border border-t" aria-hidden="true"></div>

			<div
				class="text-muted-foreground flex min-h-4 items-center justify-between gap-2 pt-2 font-mono text-[13px] leading-none"
			>
				<div class="flex min-w-0 items-center gap-1.5 tracking-tight tabular-nums">
					{#if running}
						<Countdown
							compact
							endBlock={market.marketData?.marketStart +
								market.marketData?.marketDuration -
								currentBurnHeight}
							valueClass="text-[13px] leading-none"
						/>
					{:else if resolving}
						<Countdown
							compact
							endBlock={market.marketData?.marketStart +
								market.marketData?.marketDuration +
								market.marketData?.coolDownPeriod +
								disputeWindowLength -
								currentBurnHeight}
							valueClass="text-[13px] leading-none"
						/>
					{:else if disputeRunning}
						<Countdown
							compact
							endBlock={market.marketData?.resolutionBurnHeight +
								marketVotingDuration -
								currentBurnHeight}
							valueClass="text-[13px] leading-none"
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
				<div class="flex shrink-0 items-center gap-3">
					{#if isTrending}
						<span
							class="market-card-trending text-warning inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide"
						>
							<TrendingUp class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
							Trending
						</span>
					{/if}
					<span
						class="text-muted-foreground font-mono text-[13px] leading-none font-medium tabular-nums"
					>
						{marketTokenSymbol}
					</span>
					<MarketResolutionData
						{market}
						{bmApi}
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

<style>
	.market-card-trending {
		animation: market-trending-pulse 1.4s ease-in-out infinite;
	}

	@keyframes market-trending-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.55;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.market-card-trending {
			animation: none;
		}
	}
</style>
