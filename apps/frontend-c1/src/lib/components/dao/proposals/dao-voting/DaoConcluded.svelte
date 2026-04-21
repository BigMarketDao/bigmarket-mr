<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { chainStore } from '@bigmarket/bm-common';
	import type { VotingEventProposeProposal } from '@bigmarket/bm-types';
	import { fmtNumber } from '@bigmarket/bm-utilities';

	let { proposal }: { proposal: VotingEventProposeProposal } = $props();

	let burnHeight = $chainStore.stacks.burn_block_height;

	onMount(async () => {});
</script>

<svelte:head>
	<title>BigMarket DAO</title>
	<meta
		name="description"
		content="Governance of the Stacks Blockchain, Smart Contracts on Bitcoin"
	/>
</svelte:head>

<div>
	<div class="my-8 flex w-full flex-col rounded-2xl bg-[#F4F3F0] text-black">
		<div
			class="relative overflow-hidden py-10 md:grid md:auto-cols-auto md:grid-flow-col md:gap-12 md:px-12"
		>
			<div class="">
				<div class="mb-4">
					<h2 class="mb-3 text-2xl text-black">Voting ended</h2>
				</div>
				<div class="relative max-w-xl space-y-3 rounded-lg bg-[#E6E4E2] px-6 py-6">
					<p>
						Voting ended <strong
							>{fmtNumber(burnHeight - proposal.proposalData.burnEndHeight)} blocks ago</strong
						>.
					</p>
					<p class="text-lg">
						Vote results can be found <a
							class=" underline"
							href={`${base}/dao/proposals/results/${proposal.proposal}`}>here</a
						>
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
