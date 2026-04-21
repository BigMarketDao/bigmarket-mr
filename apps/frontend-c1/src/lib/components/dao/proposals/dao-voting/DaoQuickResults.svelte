<script lang="ts">
	import { onMount } from 'svelte';
	import VoteResultsRow from './VoteResultsRow.svelte';
	import type {
		ResultsSummary,
		VotingEventProposeProposal,
		VotingEventVoteOnProposal
	} from '@bigmarket/bm-types';
	import { findDaoVotes } from '$lib/core/app/loaders/governance/dao_api';

	let {
		daoSummary,
		proposal
	}: {
		daoSummary: ResultsSummary;
		proposal: VotingEventProposeProposal;
	} = $props();

	let showVotes = $state(false);
	let votes: Array<VotingEventVoteOnProposal> = $state([]);
	let accountsFor = $state(0);
	let accountsAgainst = $state(0);
	let stxFor = $state(0);
	let stxAgainst = $state(0);

	const fetchTransactions = async () => {
		if (showVotes) {
			showVotes = false;
			return;
		}
		if (votes.length === 0) {
			votes = await findDaoVotes(appConfig.VITE_BIGMARKET_API, proposal.proposal);
			//if (newV) votes = newV.daoVotes || []
		}
		showVotes = true;
	};

	let inFavour = 0;
	onMount(async () => {
		const votesFor = daoSummary.summary.find((o) => o._id.event === 'vote' && o._id.for);
		const votesAgn = daoSummary.summary.find((o) => o._id.event === 'vote' && !o._id.for);
		stxFor = daoSummary.proposalData.votesFor;
		stxAgainst = daoSummary.proposalData.votesAgainst;
		accountsFor = votesFor?.count || 0;
		accountsAgainst = votesAgn?.count || 0;

		stxFor = daoSummary.proposalData.votesFor;
		stxAgainst = daoSummary.proposalData.votesAgainst;

		inFavour =
			proposal?.proposalData &&
			proposal.proposalData.votesFor + proposal.proposalData.votesAgainst > 0
				? Number(
						(
							(proposal.proposalData.votesFor /
								(proposal.proposalData.votesFor + proposal.proposalData.votesAgainst)) *
							100
						).toFixed(2)
					)
				: 0;
		// if (inFavour > (proposal?.proposalData?.customMajority || 0) / 100) {
		// 	winning = 'success';
		// }
	});
</script>

<VoteResultsRow {stxFor} {stxAgainst} {accountsFor} {accountsAgainst} />

<div class="flex justify-between">
	<a
		href="/"
		class="text-lg text-gray-400"
		onclick={(e) => {
			e.preventDefault();
			fetchTransactions();
		}}
		>{#if !showVotes}Show{:else}Hide{/if} transaction details</a
	>
</div>

{#if showVotes}
	<div class="mt-6 w-1/2">
		<p>
			<span class="text-sm">
				Vote stacks transactions sent to the stx.eco DAO contract are counted - any stacks holder is
				able to vote with a voting power up to the liquid balance of their account(s) at the stacks
				block height when voting began.
			</span>
		</p>
	</div>
{/if}
