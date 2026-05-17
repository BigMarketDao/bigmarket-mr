<script lang="ts">
	import { base } from '$app/paths';
	import { Button } from '@bigmarket/bm-ui';
	import type { VotingEventProposeProposal } from '@bigmarket/bm-types';
	import { chainStore } from '@bigmarket/bm-common';
	import { fmtNumber } from '@bigmarket/bm-utilities';
	import {
		getProposalStatus,
		isConcluded,
		isPostVoting,
		isVoting
	} from '$lib/core/app/loaders/governance/proposals';
	import SplitVoteBar from '../shared/SplitVoteBar.svelte';

	let { proposal }: { proposal: VotingEventProposeProposal } = $props();

	const title = $derived(proposal.proposalMeta?.title ?? proposal.proposal.split('.')[1]);
	const href = $derived(`${base}/dao/proposals/${proposal.proposal}`);
	const statusLabel = $derived(getProposalStatus(proposal));
	const votingOpen = $derived(isVoting(proposal));
	const votingClosed = $derived(isPostVoting(proposal) || isConcluded(proposal));

	const totalVotes = $derived(
		(proposal.proposalData?.votesFor ?? 0) + (proposal.proposalData?.votesAgainst ?? 0)
	);
	const forPct = $derived(totalVotes > 0 ? ((proposal.proposalData?.votesFor ?? 0) / totalVotes) * 100 : 50);
	const againstPct = $derived(100 - forPct);

	const blocksLeft = $derived(
		Math.max(0, (proposal.proposalData?.burnEndHeight ?? 0) - ($chainStore.stacks.burn_block_height ?? 0))
	);

	const badgeClass = $derived(
		votingOpen
			? 'bg-success-soft text-success'
			: isConcluded(proposal)
				? 'bg-info-soft text-info'
				: 'bg-secondary text-muted-foreground'
	);
</script>

<article class="mb-4 rounded-lg border border-border bg-card p-5 text-card-foreground">
	<div class="flex flex-wrap items-start justify-between gap-2">
		<span class="rounded-full px-2 py-0.5 text-xs font-medium capitalize {badgeClass}">
			{votingOpen ? 'Voting open' : votingClosed ? 'Voting closed' : statusLabel}
		</span>
	</div>
	<h3 class="mt-2 font-semibold">
		<a
			class="hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			{href}>{title}</a
		>
	</h3>
	<p class="mt-1 line-clamp-2 text-sm text-muted-foreground">
		{proposal.proposalMeta?.description ?? 'Community governance proposal on BigMarket.'}
	</p>

	{#if totalVotes > 0}
		<div class="mt-4">
			<SplitVoteBar {forPct} {againstPct} />
		</div>
	{/if}

	<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
		<p class="text-sm text-muted-foreground tabular-nums">
			{#if votingOpen}
				Ends in ~{fmtNumber(blocksLeft)} blocks
			{:else}
				{statusLabel}
			{/if}
		</p>
		<div class="flex gap-2">
			{#if votingOpen}
				<Button href={href} size="sm" class="bg-success text-success-foreground hover:bg-success/90">
					Vote For
				</Button>
				<Button
					href={href}
					size="sm"
					variant="destructive"
					class="bg-destructive text-destructive-foreground"
				>
					Vote Against
				</Button>
			{:else}
				<Button href={href} size="sm" variant="outline">View result</Button>
			{/if}
		</div>
	</div>
</article>
