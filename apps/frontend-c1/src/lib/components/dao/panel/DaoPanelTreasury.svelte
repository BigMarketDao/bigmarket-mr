<script lang="ts">
	import { daoOverviewStore } from '@bigmarket/bm-common';
	import { fmtMicroToStxNumber, fmtNumber } from '@bigmarket/bm-utilities';
	import FeeFlowDiagram from '../shared/FeeFlowDiagram.svelte';
	import type { VotingEventProposeProposal } from '@bigmarket/bm-types';
	import { onMount } from 'svelte';
	import { fetchProposals } from '$lib/core/app/loaders/governance/proposals';
	import DaoProposalCard from './DaoProposalCard.svelte';

	let proposals = $state<VotingEventProposeProposal[]>([]);

	const treasuryStx = $derived(
		$daoOverviewStore?.treasuryBalances?.stx?.balance
			? fmtMicroToStxNumber(Number($daoOverviewStore.treasuryBalances.stx.balance))
			: null
	);

	const feePct = $derived(
		$daoOverviewStore?.contractData?.devFeeBips
			? ($daoOverviewStore.contractData.devFeeBips / 100).toFixed(1)
			: '1'
	);

	const treasuryProposals = $derived(
		proposals.filter((p) => {
			const t = (p.proposalMeta?.title ?? '').toLowerCase();
			return t.includes('treasury') || t.includes('fund') || t.includes('transfer');
		})
	);

	onMount(async () => {
		proposals = await fetchProposals();
	});
</script>

<div class="space-y-8">
	<div>
		<h2 class="text-xl font-semibold text-foreground">Community Treasury</h2>
		<p class="mt-1 text-sm text-muted-foreground">
			Every STX in here was earned by the protocol. Every spending decision requires a community vote.
		</p>
	</div>

	<div class="grid gap-4 md:grid-cols-3">
		<div class="rounded-md border border-border bg-card p-4">
			<p class="text-xs text-muted-foreground">Total treasury value</p>
			<p class="mt-1 text-2xl font-bold tabular-nums text-foreground">
				{treasuryStx != null ? `${treasuryStx.toFixed(4)} STX` : '—'}
			</p>
		</div>
		<div class="rounded-md border border-border bg-card p-4">
			<p class="text-xs text-muted-foreground">Protocol fee rate</p>
			<p class="mt-1 text-2xl font-bold tabular-nums text-foreground">{feePct}%</p>
		</div>
		<div class="rounded-md border border-border bg-card p-4">
			<p class="text-xs text-muted-foreground">Markets created</p>
			<p class="mt-1 text-2xl font-bold tabular-nums text-foreground">
				{$daoOverviewStore?.contractData?.marketCounter != null
					? fmtNumber($daoOverviewStore.contractData.marketCounter)
					: '—'}
			</p>
		</div>
	</div>

	<div>
		<h3 class="mb-4 font-semibold text-foreground">Fee flow</h3>
		<FeeFlowDiagram compact />
	</div>

	{#if treasuryProposals.length > 0}
		<section>
			<h3 class="font-semibold text-foreground">Treasury proposals</h3>
			<p class="mt-1 text-sm text-muted-foreground">Votes that may move treasury funds.</p>
			<div class="mt-4">
				{#each treasuryProposals.slice(0, 5) as proposal (proposal.proposal)}
					<DaoProposalCard {proposal} />
				{/each}
			</div>
		</section>
	{/if}
</div>
