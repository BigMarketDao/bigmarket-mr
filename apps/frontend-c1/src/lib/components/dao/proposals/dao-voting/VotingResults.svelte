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

<div class="space-y-6 rounded-lg bg-card p-6 text-card-foreground shadow-lg">
	<!-- Voting Status -->
	<div class="flex items-center justify-between rounded-xl border border-white/50 px-4 py-2">
		<div class="flex items-center gap-2">
			<span class="h-3 w-3 rounded-full bg-destructive"></span>
			<p class="font-mono text-sm tracking-wide text-destructive uppercase">{votingStatus}</p>
		</div>
	</div>

	<!-- Proposal Title -->
	<div class="text-center">
		<h1 class="text-3xl font-bold">
			Proposal:
			<a class="text-info hover:underline" href={`${base}${proposalLink}`}>{proposalTitle}</a>
		</h1>
	</div>

	<!-- Voting Summary -->
	<div class="flex flex-col gap-y-5 rounded-lg bg-muted p-6">
		<h2 class="text-2xl capitalize">{votingStatus}</h2>
		<p>Voting closed at block <span class="font-bold tabular-nums">{fmtNumber(closingBlock)}</span></p>
		<p class="tabular-nums">{summary.accountsFor + summary.accountsAgainst} accounts participated</p>
	</div>

	<!-- Vote Results -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<div
			class={`flex flex-col items-center rounded-lg p-6 text-white ${voteResult ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}`}
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

		<div class="rounded-lg bg-muted p-6 text-foreground">
			<h3 class="text-xl font-semibold">Voting Power</h3>
			<p class="text-2xl font-bold tabular-nums">{fmtMicroToStxNumber(totalVotes).toFixed(6)} Stacks</p>
			<div class="mt-4 flex justify-between">
				<div>
					<p class="font-bold text-success">Yes</p>
					<p class="tabular-nums">{yesVotes} accounts</p>
				</div>
				<div>
					<p class="font-bold text-destructive">No</p>
					<p class="tabular-nums">{noVotes} accounts</p>
				</div>
			</div>
		</div>
	</div>
	<div class="relative rounded-lg bg-muted p-6">
		<div class="">
			<button
				type="button"
				class="z-50 text-muted-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
				onclick={() => (showVotes = !showVotes)}>Show transaction details</button
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
