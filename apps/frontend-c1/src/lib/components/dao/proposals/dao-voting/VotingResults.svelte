<script lang="ts">
	import type { VoteSummary } from '$lib/core/types';
	import VoteTransactions from '$lib/components/dao/proposals/dao-voting/VoteTransactions.svelte';
	import { fmtMicroToStxNumber, fmtNumber } from '@bigmarket/bm-utilities';
	import type { VotingEventProposeProposal, VotingEventVoteOnProposal } from '@bigmarket/bm-types';
	import { getProposalStatus } from '../../../../core/app/loaders/governance/proposals';
	import cross from '$lib/assets/cross.png';
	import tick from '$lib/assets/tick.png';
	import { base } from '$app/paths';

	let {
		proposal,
		summary,
		votes = []
	}: {
		proposal: VotingEventProposeProposal;
		summary: VoteSummary;
		votes?: Array<VotingEventVoteOnProposal>;
	} = $props();

	let proposalTitle = $derived(proposal.proposalMeta.title);
	let proposalLink = $derived(`/dao/proposals/${proposal.proposal}`);
	let votingStatus = $derived(getProposalStatus(proposal));
	let closingBlock = $derived(proposal.proposalData.burnEndHeight);
	let totalVotes = $derived(proposal.proposalData.votesFor + proposal.proposalData.votesAgainst);
	let voteResult = $derived(proposal.proposalData.passed);
	let yesVotes = $derived(summary.accountsFor);
	let noVotes = $derived(summary.accountsAgainst);

	let showVotes = $state(false);
	let componentKey = 0;
</script>

<div class="space-y-6 rounded-lg bg-[#0F1225] p-6 text-white shadow-lg">
	<!-- Voting Status -->
	<div class="flex items-center justify-between rounded-xl border border-white/50 px-4 py-2">
		<div class="flex items-center gap-2">
			<span class="h-3 w-3 rounded-full bg-red-500"></span>
			<p class="font-mono text-sm tracking-wide text-red-400 uppercase">{votingStatus}</p>
		</div>
	</div>

	<!-- Proposal Title -->
	<div class="text-center">
		<h1 class="text-3xl font-bold">
			Proposal:
			<a class="text-blue-400 hover:underline" href={`${base}${proposalLink}`}>{proposalTitle}</a>
		</h1>
	</div>

	<!-- Voting Summary -->
	<div class="flex flex-col gap-y-5 rounded-lg bg-gray-900 p-6">
		<h2 class="text-2xl capitalize">{votingStatus}</h2>
		<p>Voting closed at block <span class="font-bold">{fmtNumber(closingBlock)}</span></p>
		<p>{summary.accountsFor + summary.accountsAgainst} accounts participated</p>
	</div>

	<!-- Vote Results -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<div
			class={`flex flex-col items-center rounded-lg p-6 text-white ${voteResult ? 'bg-green-700' : 'bg-red-700'}`}
		>
			<img
				alt={voteResult ? 'approved' : 'rejected'}
				src={voteResult ? tick : cross}
				class="mb-2 w-10"
			/>
			<p class="text-3xl font-bold">{voteResult ? 'Passed' : 'Failed'}</p>
			<p class="text-lg">
				Proposal {voteResult ? 'passed' : 'did not pass'}
			</p>
		</div>

		<div class="rounded-lg bg-gray-100 p-6 text-gray-900">
			<h3 class="text-xl font-semibold">Voting Power</h3>
			<p class="text-2xl font-bold">{fmtMicroToStxNumber(totalVotes).toFixed(6)} Stacks</p>
			<div class="mt-4 flex justify-between">
				<div>
					<p class="font-bold text-green-600">Yes</p>
					<p>{yesVotes} accounts</p>
				</div>
				<div>
					<p class="font-bold text-red-600">No</p>
					<p>{noVotes} accounts</p>
				</div>
			</div>
		</div>
	</div>
	<div class="relative rounded-lg bg-gray-900 p-6">
		<div class="">
			<button class="z-50 text-gray-400 hover:underline" onclick={() => (showVotes = !showVotes)}
				>Show transaction details</button
			>
		</div>
		{#if showVotes}
			<div class="mt-6 w-full">
				<p>
					<span class="text-sm">
						Vote stacks transactions sent to the stx.eco DAO contract are counted - any stacks
						holder is able to vote with a voting power up to the liquid balance of their account(s)
						at the stacks block height when voting began.
					</span>
				</p>
			</div>

			{#key componentKey}
				<VoteTransactions {votes} />
			{/key}
		{/if}
	</div>

	<!-- Transaction Details -->
</div>
