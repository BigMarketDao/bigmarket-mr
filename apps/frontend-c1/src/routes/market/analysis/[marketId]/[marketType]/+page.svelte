<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		type PredictionMarketClaimEvent,
		type PredictionMarketCreateEvent,
		type PredictionMarketStakeEvent
	} from '@bigmarket/bm-types';
	import { fmtMicroToStx, mapToMinMaxStrings } from '@bigmarket/bm-utilities';
	import { PageContainer } from '@bigmarket/bm-ui';

	const { data } = $props<{
		market: PredictionMarketCreateEvent;
		stakes: Array<PredictionMarketStakeEvent>;
		claims: Array<PredictionMarketClaimEvent>;
		children: Snippet; // or Snippet if you want to be precise
	}>();

	let market = $derived(data.market);
	let stakes = $derived(data.stakes);
	let claims = $derived(data.claims);

	let categories: Array<string> = $state([]);

	onMount(async () => {
		const marketId = data.market.marketId;
		if (marketId >= 0) {
			categories = mapToMinMaxStrings(market.marketData.categories);
		} else {
			goto('/market-mgt');
		}
	});
</script>

<svelte:head>
	<title>Market Volumes</title>
	<meta name="description" content="Create an opinion poll" />
</svelte:head>

<PageContainer>
	<div class="mb-8 flex flex-col gap-y-5 overflow-x-auto text-[11px]">
		{#if categories}
			<h1 class="mt-6 border-gray-200 text-3xl font-bold text-gray-300">
				Market Information: {market.unhashedData.name}
			</h1>

			<h1 class="mb-0 border-b-2 border-gray-200 pb-2 text-2xl font-bold text-gray-300">Stakes</h1>
			<div class="mb-8 flex flex-col gap-y-5 overflow-x-auto text-[11px]">
				<table class="min-w-full table-auto border-collapse border border-gray-300 shadow-lg">
					<thead>
						<tr class="bg-gray-200 text-left">
							<th class="border border-gray-300 px-4 py-2 text-gray-800">Staker</th>
							<th class="border border-gray-300 px-4 py-2 text-gray-800">Shares</th>
							<th class="border border-gray-300 px-4 py-2 text-gray-800">Costs</th>
							<th class="border border-gray-300 px-4 py-2 text-gray-800">Category</th>
						</tr>
					</thead>
					<tbody>
						{#each stakes as { voter, index, amount, cost } (index)}
							<tr class="border-b transition hover:bg-gray-700">
								<td class="border border-gray-300 px-4 py-2">{voter}</td>
								<td class="border border-gray-300 px-4 py-2">{fmtMicroToStx(amount)}</td>
								<td class="border border-gray-300 px-4 py-2">{fmtMicroToStx(cost)}</td>
								<td class="border border-gray-300 px-4 py-2">{categories[index]} </td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		<h1 class="mb-0 border-b-2 border-gray-200 pb-2 text-2xl font-bold text-gray-300">Claims</h1>
		<table class="min-w-full table-auto border-collapse border border-gray-300 shadow-lg">
			<thead>
				<tr class="bg-gray-200 text-left">
					<th class="border border-gray-300 px-4 py-2 text-gray-800">claimer</th>
					<th class="border border-gray-300 px-4 py-2 text-gray-800">Staked</th>
					<th class="border border-gray-300 px-4 py-2 text-gray-800">Share</th>
					<th class="border border-gray-300 px-4 py-2 text-gray-800">Dao Fee</th>
					<th class="border border-gray-300 px-4 py-2 text-gray-800">Market Fee</th>
				</tr>
			</thead>
			<tbody>
				{#each claims as { claimer, userTokensInOutcome, userSharesInOutcome, daoFee, marketFee, indexWon } (claimer)}
					<tr class="border-b transition hover:bg-gray-700">
						<td class="border border-gray-300 px-4 py-2">{claimer + '/' + indexWon}</td>
						<td class="border border-gray-300 px-4 py-2">{userTokensInOutcome}</td>
						<td class="border border-gray-300 px-4 py-2">{userSharesInOutcome}</td>
						<td class="border border-gray-300 px-4 py-2">{daoFee} </td>
						<td class="border border-gray-300 px-4 py-2">{marketFee} </td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</PageContainer>
