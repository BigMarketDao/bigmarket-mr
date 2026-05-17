<script lang="ts">
	import type { MarketDisputeRecord } from '@bigmarket/bm-types';
	import { onMount } from 'svelte';
	import { getDisputes } from '$lib/core/app/loaders/governance/voting';
	import DaoDisputeCard from './DaoDisputeCard.svelte';

	let disputes = $state<MarketDisputeRecord[]>([]);
	let loaded = $state(false);

	const openDisputes = $derived(
		disputes.filter((d) => !d.resolveVote || d.resolutionState?.includes('DISPUTED'))
	);

	onMount(async () => {
		disputes = (await getDisputes()) ?? [];
		loaded = true;
	});
</script>

<div>
	<h2 class="text-xl font-semibold text-foreground">Open Disputes</h2>
	<p class="mt-1 text-sm text-muted-foreground">
		Any market participant can challenge an outcome. BIG holders vote to resolve it.
	</p>

	<div class="mt-6">
		{#if !loaded}
			<p class="text-muted-foreground">Loading disputes…</p>
		{:else if openDisputes.length === 0}
			<div class="rounded-lg border border-border bg-card p-8 text-center">
				<p class="font-medium text-foreground">No open disputes</p>
				<p class="mt-2 text-sm text-muted-foreground">
					When someone challenges a market result, it appears here for the community to vote on.
				</p>
			</div>
		{:else}
			{#each openDisputes as dispute (dispute.txId)}
				<DaoDisputeCard {dispute} />
			{/each}
		{/if}
	</div>
</div>
