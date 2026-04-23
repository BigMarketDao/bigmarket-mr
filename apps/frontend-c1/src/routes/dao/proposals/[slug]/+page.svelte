<script lang="ts">
	import { page } from '$app/state';
	import Holding from '$lib/components/common/Holding.svelte';
	import DaoHeading from '$lib/components/dao/DaoHeading.svelte';
	import DaoVotingActiveNew from '$lib/components/dao/proposals/dao-voting/ballot-box/DaoVotingActiveNew.svelte';
	import DaoConcluded from '$lib/components/dao/proposals/dao-voting/DaoConcluded.svelte';
	import VotingResults from '$lib/components/dao/proposals/dao-voting/VotingResults.svelte';
	import {
		concludeVote,
		findDaoVotes,
		summarizeVotes
	} from '$lib/core/app/loaders/governance/dao_api';
	import {
		getExecutedProposal,
		getProposalLatest,
		isConclusionPending,
		isPostVoting,
		isProposedPreVoting,
		isVoting
	} from '$lib/core/app/loaders/governance/proposals';
	import type { VoteSummary } from '$lib/core/types';
	import { chainStore } from '@bigmarket/bm-common';
	import type {
		DaoEventExecuteProposal,
		VotingEventProposeProposal,
		VotingEventVoteOnProposal
	} from '@bigmarket/bm-types';
	import { PageContainer, ParaContainer } from '@bigmarket/bm-ui';
	import { fmtNumber } from '@bigmarket/bm-utilities';
	import { onMount } from 'svelte';

	let proposal: VotingEventProposeProposal | undefined = $state(undefined);
	let executiveOrder: DaoEventExecuteProposal | undefined = $state(undefined);
	let inited = $state(false);
	let votes: Array<VotingEventVoteOnProposal> = $state([]);
	let summary: VoteSummary = $state({
		stxFor: 0,
		stxAgainst: 0,
		accountsFor: 0,
		accountsAgainst: 0,
		inFavour: '',
		passed: false,
		customMajority: 0
	});
	let isVotingNow = $state(false);

	const handleVote = () => {};

	const conclude = async () => {
		if (proposal) {
			await concludeVote(proposal.extension, proposal.proposal);
		}
	};

	onMount(async () => {
		proposal = await getProposalLatest(page.params.slug!);
		if (!proposal) executiveOrder = await getExecutedProposal(page.params.slug!);
		if (proposal) {
			// postVoting = (currentHeight || 0) >= (proposal?.proposalData?.burnStartHeight || 0);
			isVotingNow = isVoting(proposal);
			votes = await findDaoVotes(proposal.proposal);
			summary = summarizeVotes(votes, proposal.proposalData);
		}
		inited = true;
	});
</script>

<svelte:head>
	<title>BigMarket DAO - Voting</title>
	<meta
		name="description"
		content="Stacks Improvement Proposals - governance of the Stacks Blockchain."
	/>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<PageContainer>
		<DaoHeading
			headingPart1="DAO"
			headingPart2="Proposals"
			message="Proposals are smart contracts that change the DAO when passed by the community. Vote on this proposal here"
		/>

		<!-- <div class=" inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-[#0F1225]/10 to-[#0F1225]/5"></div> -->
		{#if inited && proposal}
			{#if isVotingNow}
				<!-- <ProposalHeader {proposal} /> -->
				<DaoVotingActiveNew {proposal} onTxVote={handleVote} />
			{:else if isProposedPreVoting(proposal)}
				<Holding />
				<ParaContainer
					>Starts: {fmtNumber(proposal.proposalData.burnStartHeight)} in {fmtNumber(
						proposal.proposalData.burnStartHeight - $chainStore.stacks.burn_block_height
					)} blocks</ParaContainer
				>
				<ParaContainer>Ends: {fmtNumber(proposal.proposalData.burnEndHeight)}</ParaContainer>
			{:else if isConclusionPending(proposal)}
				<div class="flex justify-around">
					<div class="my-3 text-sm">
						{#if proposal.proposal !== 'ST1CV2YGRJA5X8BWS0GP31J9HF56M06CQK8998TSX.bdp012-new-epoch-duration'}
							<a
								href="/"
								class="text-bloodorange"
								onclick={(e) => {
									e.preventDefault();
									conclude();
								}}>Voting closed - please conclude</a
							>
						{:else}Bad change - let expire
						{/if}
					</div>
				</div>
			{:else if isPostVoting(proposal) || isVoting(proposal)}
				<VotingResults {proposal} {summary} {votes} />
			{:else}
				<DaoConcluded {proposal} />
			{/if}
		{:else if inited && executiveOrder}
			<ParaContainer>Proposal {executiveOrder.proposal}</ParaContainer>
			<ParaContainer>Run via multisig</ParaContainer>
			<!-- {:else}
			<Placeholder message={'Proposal not found'} link={getCurrentProposalLink(page.params.slug!)} /> -->
		{/if}
	</PageContainer>
</div>
