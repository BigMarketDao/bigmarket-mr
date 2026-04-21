<script lang="ts">
	import { ParaContainer } from '@bigmarket/bm-ui';
	import DaoHeading from '$lib/components/dao/DaoHeading.svelte';
	import ProposalGridItem from '$lib/components/dao/proposals/ProposalGridItem.svelte';
	import { onMount } from 'svelte';
	import { fetchProposals } from '../../../core/app/loaders/governance/proposals';
	import type { VotingEventProposeProposal } from '@bigmarket/bm-types';
	let proposals = $state<Array<VotingEventProposeProposal>>([]);

	const sortByMostRecentlyEnded = (
		proposals: Array<VotingEventProposeProposal>
	): Array<VotingEventProposeProposal> => {
		return proposals.sort((a, b) => a.proposalData.endBlockHeight - b.proposalData.endBlockHeight);
	};

	onMount(async () => {
		proposals = sortByMostRecentlyEnded(await fetchProposals());
	});
</script>

<div class="max-w-4xl text-gray-900 dark:text-gray-100">
	<!-- Main Hero -->
	<DaoHeading
		headingPart1="DAO"
		headingPart2="Proposals"
		message="Proposals are smart contracts that change the DAO when passed by the community. See all past and current proposals below"
	/>

	<!-- Modern Sale Timeline -->
	<div class="my-10">
		{#if proposals && proposals.length > 0}
			{#each proposals as proposal (proposal.proposal)}
				<div class="w-full justify-stretch">
					<ProposalGridItem {proposal} admin={false} />
				</div>
			{/each}
		{:else}
			<ParaContainer>No proposals</ParaContainer>
		{/if}
	</div>
</div>
