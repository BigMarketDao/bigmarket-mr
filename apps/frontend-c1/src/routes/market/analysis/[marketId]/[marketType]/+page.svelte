<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		type PredictionMarketClaimEvent,
		type PredictionMarketCreateEvent,
		type PredictionMarketEventChain,
		type PredictionMarketStakeEvent
	} from '@bigmarket/bm-types';
	import { fmtMicroToStx, mapToMinMaxStrings } from '@bigmarket/bm-utilities';
	import { PageContainer } from '@bigmarket/bm-ui';

	type LiquidityEvents = PredictionMarketEventChain['liquidity'];

	type LpTableRow = {
		key: string;
		kind: 'Add' | 'Remove' | 'Claim fees';
		sender: string;
		requested: string;
		amount: string;
		lpShares: string;
		txId: string;
	};

	const { data } = $props<{
		market: PredictionMarketCreateEvent;
		stakes: Array<PredictionMarketStakeEvent>;
		claims: Array<PredictionMarketClaimEvent>;
		lpEvents: LiquidityEvents;
		children: Snippet;
	}>();

	function normalizeLiquidityEvents(raw: unknown): LiquidityEvents {
		if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'addLiquidityEvents' in raw) {
			return raw as LiquidityEvents;
		}
		return { addLiquidityEvents: [], removeLiquidityEvents: [], claimLpFeeEvents: [] };
	}

	function buildLpRows(liquidity: LiquidityEvents): LpTableRow[] {
		const rows: Array<LpTableRow & { eventIndex: number }> = [];

		for (const e of liquidity.addLiquidityEvents) {
			rows.push({
				key: e._id ?? `${e.txId}-add-${e.event_index}`,
				kind: 'Add',
				sender: e.sender,
				requested: fmtMicroToStx(e.requested),
				amount: fmtMicroToStx(e.amount),
				lpShares: `${fmtMicroToStx(e.lpSharesMinted)} (pool ${fmtMicroToStx(e.lpTotalShares)})`,
				txId: e.txId,
				eventIndex: e.event_index ?? 0
			});
		}

		for (const e of liquidity.removeLiquidityEvents) {
			rows.push({
				key: e._id ?? `${e.txId}-remove-${e.event_index}`,
				kind: 'Remove',
				sender: e.sender,
				requested: fmtMicroToStx(e.lpRequested),
				amount: fmtMicroToStx(e.lpActualRefund),
				lpShares: '—',
				txId: e.txId,
				eventIndex: e.event_index ?? 0
			});
		}

		for (const e of liquidity.claimLpFeeEvents) {
			rows.push({
				key: e._id ?? `${e.txId}-claim-${e.event_index}`,
				kind: 'Claim fees',
				sender: e.sender,
				requested: '—',
				amount: fmtMicroToStx(e.feePaid),
				lpShares: fmtMicroToStx(e.lpSharesBurned),
				txId: e.txId,
				eventIndex: e.event_index ?? 0
			});
		}

		return rows
			.sort((a, b) => a.eventIndex - b.eventIndex)
			.map(({ key, kind, sender, requested, amount, lpShares, txId }) => ({
				key,
				kind,
				sender,
				requested,
				amount,
				lpShares,
				txId
			}));
	}

	let market = $derived(data.market);
	let stakes = $derived(data.stakes);
	let claims = $derived(data.claims);
	let liquidity = $derived(normalizeLiquidityEvents(data.lpEvents));
	let lpRows = $derived(buildLpRows(liquidity));

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
						{#each stakes as { voter, index, amount, cost, _id } (_id)}
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

			<h1 class="mb-0 border-b-2 border-gray-200 pb-2 text-2xl font-bold text-gray-300">
				Liquidity
			</h1>
			<div class="mb-8 flex flex-col gap-y-5 overflow-x-auto text-[11px]">
				<table class="min-w-full table-auto border-collapse border border-gray-300 shadow-lg">
					<thead>
						<tr class="bg-gray-200 text-left">
							<th class="border border-gray-300 px-4 py-2 text-gray-800">Event</th>
							<th class="border border-gray-300 px-4 py-2 text-gray-800">Sender</th>
							<th class="border border-gray-300 px-4 py-2 text-gray-800">Requested</th>
							<th class="border border-gray-300 px-4 py-2 text-gray-800">Amount / Refund / Fee</th>
							<th class="border border-gray-300 px-4 py-2 text-gray-800">LP shares</th>
							<th class="border border-gray-300 px-4 py-2 text-gray-800">Tx</th>
						</tr>
					</thead>
					<tbody>
						{#each lpRows as row (row.key)}
							<tr class="border-b transition hover:bg-gray-700">
								<td class="border border-gray-300 px-4 py-2">{row.kind}</td>
								<td class="border border-gray-300 px-4 py-2">{row.sender}</td>
								<td class="border border-gray-300 px-4 py-2">{row.requested}</td>
								<td class="border border-gray-300 px-4 py-2">{row.amount}</td>
								<td class="border border-gray-300 px-4 py-2">{row.lpShares}</td>
								<td class="border border-gray-300 px-4 py-2 font-mono text-[10px]">{row.txId}</td>
							</tr>
						{:else}
							<tr>
								<td class="border border-gray-300 px-4 py-2 text-gray-500" colspan="6">
									No liquidity events recorded for this market.
								</td>
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
				{#each claims as { claimer, userTokensInOutcome, userSharesInOutcome, daoFee, marketFee, indexWon, _id } (_id)}
					<tr class="border-b transition hover:bg-gray-700">
						<td class="border border-gray-300 px-4 py-2">{claimer + '/' + indexWon}</td>
						<td class="border border-gray-300 px-4 py-2">{fmtMicroToStx(userTokensInOutcome)}</td>
						<td class="border border-gray-300 px-4 py-2">{fmtMicroToStx(userSharesInOutcome)}</td>
						<td class="border border-gray-300 px-4 py-2">{fmtMicroToStx(daoFee)} </td>
						<td class="border border-gray-300 px-4 py-2">{fmtMicroToStx(marketFee)} </td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</PageContainer>
