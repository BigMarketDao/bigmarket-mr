<script lang="ts">
	import { csvMaker } from '$lib/core/tools/utils';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
	import { getStxAddress } from '@bigmarket/bm-common';
	import { fmtMicroToStx } from '@bigmarket/bm-utilities';
	import { stacks } from '@bigmarket/sdk';
	import type { VotingEventVoteOnProposal } from '@bigmarket/bm-types';
	import { ArrowUpRight } from 'lucide-svelte';

	type VoteEvent = VotingEventVoteOnProposal & {
		stackerData?: Array<{ data: { amountUstx: number } }>;
	};

	const appConfig = $derived(requireAppConfig($appConfigStore));

	let { votes = [] }: { votes?: Array<VoteEvent> } = $props();
	let sortDir = $state('');

	const download = () => {
		const csvVotes: Array<{ voter: string; txid: string; for: boolean; power: number }> = [];
		for (const vote of votes) {
			csvVotes.push({
				voter: vote.voter,
				txid: vote.txId,
				for: vote.for,
				power: vote.amount
			});
		}
		csvMaker(
			csvVotes.map((vote) => vote.power),
			'nakamoto-dao-votes.csv'
		);
	};

	const getAmount = (vote: VoteEvent): number => {
		if (vote.event === 'pool-event') {
			if (vote.stackerData && vote.stackerData.length > 0) {
				return vote.stackerData[0].data.amountUstx;
			} else return 0;
		} else {
			return vote.amount;
		}
	};

	const reorder = () => {
		sortDir = sortDir === '-' ? '' : '-';
	};

	const sortedEvents = $derived([...votes].sort((a, b) => b.amount - a.amount));
</script>

<div>
	<button class="text-lg text-gray-400" onclick={download}>to csv</button>
</div>

<div class="mt-5 mb-3 grid w-full grid-cols-4 justify-evenly border-b border-gray-300 pb-3">
	<div class="col-span-2">
		<button class="pointer w-1/2" onclick={reorder}>Voter</button>
	</div>
	<div>
		<button class="pointer" onclick={reorder}>Power</button>
	</div>
	<div>
		<button class="pointer" onclick={reorder}>For/Against</button>
	</div>
</div>
{#each sortedEvents as item (item.event_index)}
	{#if getAmount(item) > 0}
		<div class="grid w-full grid-cols-4 justify-evenly text-sm">
			<div
				class={item.voter === getStxAddress()
					? 'text-success col-span-2 w-full break-words'
					: 'col-span-2 break-words'}
				title={item.voter === getStxAddress() ? 'I voted!' : ''}
			>
				{#if item.txId}
					<span class="">
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a
							title="Show in Explorer"
							href={stacks.explorerTxUrl(
								appConfig.VITE_NETWORK,
								appConfig.VITE_STACKS_EXPLORER,
								item.txId
							)}
							target="_blank"
							class="focus-visible:outline-primary-500/50 relative top-1 inline-flex h-4 w-4 items-center justify-center rounded-md border border-transparent bg-black transition duration-200 hover:border-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
						>
							<ArrowUpRight class=" inline-block h-5 w-5 text-white" aria-hidden="true" />
						</a>
					</span>
				{/if}
				<span class="pe-5">{item.voter}</span>
			</div>
			<div class="break-words">{fmtMicroToStx(getAmount(item))}</div>
			<div class="py-2">
				{#if item.for}
					<span class="bg-success-300 text-success-800 border-success-500 rounded-2xl px-3 py-2"
						>Yes</span
					>
				{:else}
					<span class="bg-danger-300 text-danger-100 border-danger-500 rounded-2xl px-3 py-2"
						>No</span
					>
				{/if}
			</div>
		</div>
	{/if}
{/each}
