<script lang="ts">
	import { base } from '$app/paths';
	import { Button } from '@bigmarket/bm-ui';
	import type { MarketDisputeRecord } from '@bigmarket/bm-types';
	import SplitVoteBar from '../shared/SplitVoteBar.svelte';

	let { dispute }: { dispute: MarketDisputeRecord } = $props();

	const href = $derived(`${base}/dispute/${dispute.marketId}/${dispute.marketType ?? 0}`);
	const outcome = $derived(dispute.resolveVote?.outcome?.toString() ?? 'Pending');

	const votes = $derived(dispute.marketVotes ?? []);
	const forVotes = $derived(votes.filter((v) => v.categoryFor === dispute.resolveVote?.outcome).length);
	const againstVotes = $derived(Math.max(0, votes.length - forVotes));
	const total = $derived(votes.length || 1);
	const forPct = $derived((forVotes / total) * 100);
	const againstPct = $derived(100 - forPct);
</script>

<article class="mb-4 rounded-lg border border-border bg-card p-5 text-card-foreground">
	<div class="flex flex-wrap items-center gap-2">
		<span class="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">
			DISPUTED
		</span>
		<h3 class="font-semibold">
			<a
				class="hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
				{href}>{dispute.marketName}</a
			>
		</h3>
	</div>
	<p class="mt-2 text-sm text-muted-foreground">Original outcome: {outcome}</p>
	<p class="text-sm text-muted-foreground">Challenged by: {dispute.disputer?.slice(0, 8)}…</p>

	{#if votes.length > 0}
		<div class="mt-4">
			<SplitVoteBar {forPct} {againstPct} />
		</div>
	{/if}

	<div class="mt-4 flex flex-wrap justify-end gap-2">
		<Button {href} size="sm" variant="outline">View dispute</Button>
	</div>
</article>
