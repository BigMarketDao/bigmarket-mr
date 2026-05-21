<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Button } from '@bigmarket/bm-ui';
	import type { VotingEventProposeProposal } from '@bigmarket/bm-types';
	import { onMount } from 'svelte';
	import {
		fetchProposals
		// isPostVoting,
		// isVoting
	} from '$lib/core/app/loaders/governance/proposals';
	import DaoProposalCard from './DaoProposalCard.svelte';
	import { Plus } from 'lucide-svelte';

	let proposals = $state<VotingEventProposeProposal[]>([]);
	let loaded = $state(false);

	//const active = $derived(proposals.filter((p) => isVoting(p) || isPostVoting(p)));
	const active = $derived(proposals);

	function openPropose() {
		const url = new URL(page.url);
		url.searchParams.set('page', 'propose');
		goto(url);
	}

	onMount(async () => {
		proposals = await fetchProposals();
		loaded = true;
	});
</script>

<div>
	<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
		<h2 class="text-xl font-semibold text-foreground">Active Votes</h2>
		<Button variant="outline" size="sm" class="gap-2" onclick={openPropose}>
			<Plus class="h-4 w-4" aria-hidden="true" />
			Submit a proposal
		</Button>
	</div>

	{#if !loaded}
		<p class="text-muted-foreground">Loading proposals…</p>
	{/if}
	{#if active.length === 0}
		<div class="rounded-lg border border-border bg-card p-8 text-center">
			<p class="font-medium text-foreground">No active votes right now</p>
			<p class="mt-2 text-sm text-muted-foreground">
				When a proposal is submitted, it shows up here for BIG holders to vote on.
			</p>
			<Button class="mt-4 gap-2" variant="outline" onclick={openPropose}>
				<Plus class="h-4 w-4" aria-hidden="true" />
				Submit a proposal
			</Button>
		</div>
	{/if}
	{#if active.length > 0}
		{#each active as proposal (proposal.proposal)}
			<DaoProposalCard {proposal} />
		{/each}
	{/if}
</div>
