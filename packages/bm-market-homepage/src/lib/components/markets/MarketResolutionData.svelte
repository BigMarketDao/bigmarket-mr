<script lang="ts">
	import { SlotModal } from '@bigmarket/bm-ui';
	import type { MarketCategory, PredictionMarketCreateEvent } from '@bigmarket/bm-types';
	import {
		estimateBitcoinBlockTime,
		fmtNumber,
		getResolutionMessage,
		isCooling,
		isDisputeRunning,
		isFinalisable,
		isPostCooling,
		isResolved,
		isResolving,
		isRunning,
		mapToMinMaxStringsFormatted
	} from '@bigmarket/bm-utilities';
	import { getStxAddress } from '@bigmarket/sip18-forum';
	import { Currency, Eye } from 'lucide-svelte';
	import { onMount } from 'svelte';

	const resolveMarketsScalar = () => {
		console.log('resolveMarketsScalar');
	};
	const {
		market,
		selectedCurrency,
		currentBurnHeight,
		disputeWindowLength,
		marketVotingDuration,
		isCoordinator
	} = $props<{
		market: Array<PredictionMarketCreateEvent>;
		selectedCurrency: Currency;
		currentBurnHeight: number;
		disputeWindowLength: number;
		marketVotingDuration: number;
		isCoordinator: boolean;
	}>();

	let showModal = $state(false);

	let endOfCooling = $derived(
		(market.marketData?.marketStart || 0) +
			(market.marketData?.marketDuration || 0) +
			(market.marketData?.coolDownPeriod || 0)
	);
	let endOfMarket = $derived(
		(market.marketData?.marketStart || 0) + (market.marketData?.marketDuration || 0)
	);
	let endOfDispute = $derived((market.marketData?.resolutionBurnHeight || 0) + disputeWindowLength);
	let current = $derived(currentBurnHeight);
	let votingWindow = $derived(marketVotingDuration);
	let endOfVotingWindow = $derived(votingWindow + (market.marketData?.resolutionBurnHeight || 0));

	const isBinaryMarket = () => {
		return market.marketType === 1;
	};

	const isCategoricalMarket = () => {
		return market.marketType === 1 && market.marketData.categories.length > 2;
	};

	const isScalarMarket = () => {
		return market.marketType === 2;
	};
	const openModal = () => {
		showModal = true;
	};

	const closeModal = () => {
		showModal = false;
	};

	onMount(() => {
		const forumId = market?.unhashedData?.forumMessageId;
	});
</script>

<section class="w-full text-xs text-foreground">
	<div class="">
		<div class="text-nowrap">
			<a
				class="capitalize focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
				href="/"
				onclick={(e) => {
					e.preventDefault();
					openModal();
				}}
			>
				<!-- {market.unhashedData.category}
        {#if isCategoricalMarket()}Category{:else if isBinaryMarket()}Binary{:else if isScalarMarket()}Scalar{/if}
        Market  -->
				<Eye class="inline h-4 w-4 text-muted-foreground" /></a
			>
		</div>
	</div>
</section>
{#if showModal}
	<SlotModal onClose={closeModal}>
		{#snippet modalBody()}
			<div class="mt-5">
				<section class="mt-5 w-full text-sm">
					<div>
						{#if isRunning(current, market)}
							Market is running
						{:else if isPostCooling(current, market)}
							<span class="text-info">Market has cooled</span> —
							<a
								href="/"
								onclick={() => resolveMarketsScalar()}
								class="font-bold underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
							>
								waiting to be resolved
							</a>
						{:else if isCooling(current, market)}
							<span class="text-warning">Market is cooling</span><br />
							<span class="tabular-nums">
								Ends: {estimateBitcoinBlockTime(endOfCooling, current)}
								({endOfCooling - current} blocks)
							</span>
						{:else if isDisputeRunning(market)}
							<span class="text-destructive">Disputed</span><br />
							<span class="tabular-nums">
								Ends: {estimateBitcoinBlockTime(endOfVotingWindow, current)}
								({endOfVotingWindow - current} blocks)
							</span>
						{:else if isResolving(market)}
							<span class="text-community">Dispute window open</span><br />
							<span class="tabular-nums">
								Closes: {estimateBitcoinBlockTime(endOfDispute, current)}
								({endOfDispute - current} blocks)
							</span>
						{:else if isFinalisable(current, votingWindow, market)}
							Dispute window closed
						{:else if isResolved(market)}
							Market resolved — claims are open
						{:else}
							Unknown
						{/if}
					</div>
					<table class="w-full border-collapse text-left">
						<tbody class="divide-y divide-border text-sm font-medium">
							<tr>
								<th class="w-1/3 py-2 font-medium">Start</th>
								<td class="py-2 tabular-nums">
									{estimateBitcoinBlockTime(market.marketData?.marketStart || 0, current)}
									<span class="text-muted-foreground"
										>(at block {fmtNumber(market.marketData.marketStart)})</span
									>
								</td>
							</tr>
							<tr>
								<th class="w-1/3 py-2 font-medium">Close</th>
								<td class="py-2 tabular-nums">
									{estimateBitcoinBlockTime(endOfMarket, current)}
									<span class="text-muted-foreground">(in {fmtNumber(endOfMarket - current)} blocks)</span>
								</td>
							</tr>
							<tr>
								<th class="w-1/3 py-2 font-medium">End of Cooling</th>
								<td class="py-2 tabular-nums">
									{estimateBitcoinBlockTime(endOfCooling, current)}
									<span class="text-muted-foreground">(in {fmtNumber(endOfCooling - current)} blocks)</span>
								</td>
							</tr>
							{#if isCoordinator}
								<tr>
									<th class="py-2 font-medium">Windows</th>
									<td class="py-2">
										Duration: {market.marketData.marketDuration} / Cooldown {market.marketData
											?.coolDownPeriod} / Dispute {disputeWindowLength} blocks
									</td>
								</tr>
								<tr>
									<th class="py-2 font-medium">Market Fee</th>
									<td class="py-2">
										<span class="text-muted-foreground tabular-nums">{market.marketData.marketFeeBips / 100}</span>
									</td>
								</tr>
								<tr>
									<th class="py-2 font-medium">Resolution State</th>
									<td class="py-2">
										{getResolutionMessage(current, votingWindow, market)}
										{#if (market.marketData?.resolutionBurnHeight || 0) > 0}resolved at block {market
												.marketData.resolutionBurnHeight}{/if}
									</td>
								</tr>
								<tr>
									<th class="py-2 font-medium">Concluded</th>
									<td class="py-2">
										<span class="text-muted-foreground tabular-nums">{market.marketData.concluded}</span>
									</td>
								</tr>
								<tr>
									<th class="py-2 font-medium">Creator</th>
									<td class="py-2">
										<span class="text-primary">{market.marketData.creator}</span>
									</td>
								</tr>
								<tr>
									<th class="py-2 font-medium">Treasury</th>
									<td class="py-2">
										<span class="text-primary">{market.marketData.treasury}</span>
									</td>
								</tr>
								<tr>
									<th class="py-2 font-medium">Token:</th>
									<td class="py-2">
										<span class="text-muted-foreground tabular-nums">{market.marketData.token}</span>
									</td>
								</tr>
								{#if market.marketType === 2}
									<tr>
										<th class="py-2 font-medium">Price Outcome</th>
										<td class="py-2">
											<span class="text-muted-foreground tabular-nums">{market.marketData.priceOutcome}</span>
										</td>
									</tr>
									<tr>
										<th class="py-2 font-medium">Price feed id</th>
										<td class="py-2">
											<span class="text-muted-foreground tabular-nums">{market.marketData.priceFeedId}</span>
										</td>
									</tr>
									<tr>
										<th class="py-2 font-medium">Start price</th>
										<td class="py-2">
											<span class="text-muted-foreground tabular-nums">{market.marketData.startPrice}</span>
										</td>
									</tr>
								{/if}
								<tr>
									<th class="py-2 font-medium">Outcome</th>
									<td class="py-2">
										<span class="text-muted-foreground tabular-nums">{market.marketData.outcome || '?'}</span>
									</td>
								</tr>
								<tr>
									<th class="py-2 font-medium">Categories</th>
									<td class="py-2">
										<span class=" font-medium text-muted-foreground tabular-nums"
											>{mapToMinMaxStringsFormatted(
												selectedCurrency,
												market.marketData.categories
											)}</span
										>
									</td>
								</tr>
								<tr>
									<th class="py-2 font-medium">Stakeds</th>
									<td class="py-2">
										<span class="font-medium text-muted-foreground tabular-nums"
											>{market.marketData.stakeTokens.join(', ')}</span
										>
									</td>
								</tr>
								<tr>
									<th class="py-2 font-medium">Shares</th>
									<td class="py-2">
										<span class="font-medium text-muted-foreground tabular-nums"
											>{market.marketData.stakes.join(', ')}</span
										>
									</td>
								</tr>
							{/if}
						</tbody>
					</table>
				</section>
			</div>
		{/snippet}
	</SlotModal>
{/if}
