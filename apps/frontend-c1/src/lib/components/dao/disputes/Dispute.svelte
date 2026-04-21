<script lang="ts">
	import { ParaContainer } from '@bigmarket/bm-ui';
	import DaoHeading from '$lib/components/dao/DaoHeading.svelte';
	import type {
		MarketVotingVoteEvent,
		PredictionMarketCreateEvent,
		ResolutionVote
	} from '@bigmarket/bm-types';
	import { onMount } from 'svelte';
	import { Bulletin } from '@bigmarket/bm-ui';
	import { BadgeCheck, ExternalLink, Recycle } from 'lucide-svelte';
	import { TypoHeader } from '@bigmarket/bm-ui';
	import { base } from '$app/paths';
	import { stacks } from '@bigmarket/sdk';
	import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';

	let {
		dispute
	}: {
		dispute: {
			market: PredictionMarketCreateEvent;
			resolutionVote: ResolutionVote;
			marketVotes: Array<MarketVotingVoteEvent>;
			txId?: string;
		};
	} = $props();
	const appConfig = $derived(requireAppConfig($appConfigStore));
	const market = $derived(dispute.market);
	const marketVotes = $derived(dispute.marketVotes);

	const getCurrentLocked = () => {};

	onMount(async () => {});
</script>

<div class="max-w-4xl text-gray-900 dark:text-gray-100">
	<!-- Main Hero -->
	<DaoHeading
		headingPart1="Market"
		headingPart2="Dispute"
		message="Voting information and breakdowns"
	/>
	<div class="my-1 w-full">
		<div
			class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900"
		>
			<!-- header -->
			<div class="flex items-center justify-between">
				<TypoHeader>
					<a
						class="text-primary-600 text-lg font-semibold hover:underline"
						href={`${base}/dispute/${market.marketId}/${market.marketType}`}
					>
						{#if market.unhashedData?.name}
							<BadgeCheck class="inline h-5 w-5 text-green-600" />
						{/if}
						{#if dispute}
							<Bulletin message="Click to check for locked governance tokens for this dispute">
								<span slot="title" class="text-sm font-medium hover:underline">
									<!-- <Icon src={AlertCircle} mini class="ml-2 inline-flex " /> -->
									<button
										class="flex cursor-pointer items-center gap-1 rounded-md px-3 py-1 text-orange-600 hover:bg-orange-50 dark:hover:bg-gray-800"
										onclick={(e) => { e.preventDefault(); getCurrentLocked(); }}
									>
										<Recycle class="h-4 w-4" /> Reclaim ?
									</button>
								</span>
							</Bulletin>
						{/if}
					</a>
				</TypoHeader>
			</div>

			<!-- actions -->
			<div class="mt-4 flex flex-wrap gap-4 text-sm">
				<a
					class="flex items-center gap-1 rounded-md px-3 py-1 text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-800"
					href={stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, dispute.txId ?? '')}
					target="_blank"
				>
					<ExternalLink class="h-4 w-4" /> Explorer
				</a>
			</div>
		</div>
	</div>

	<!-- Modern Sale Timeline -->
	<div class="my-10">
		{#if dispute}
			{#each marketVotes as vote (vote.voter)}
				<div class="w-full justify-stretch">
					{vote.voter}
					{vote.amount}
				</div>
			{/each}
		{:else}
			<ParaContainer>No votes</ParaContainer>
		{/if}
	</div>
</div>
