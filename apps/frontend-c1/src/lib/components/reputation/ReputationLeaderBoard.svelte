<script lang="ts">
	import { onMount } from 'svelte';
	import { Trophy, Medal, Award } from 'lucide-svelte';
	import { isLoggedIn } from '@bigmarket/bm-common';
	import { getReputationLeaderBoard } from '$lib/core/app/loaders/reputationLoaders';
	import type { ReputationLeaderboardItem } from '@bigmarket/bm-types';
	import { fmtNumber, truncate } from '@bigmarket/bm-utilities';

	let reputationLeaderBoard: Array<ReputationLeaderboardItem> = $state([]);
	let isLoading = $state(true);
	let error: string | null = $state(null);

	onMount(async () => {
		try {
			reputationLeaderBoard = await getReputationLeaderBoard();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load leaderboard';
		} finally {
			isLoading = false;
		}
	});

	function getRankIcon(index: number) {
		switch (index) {
			case 0:
				return Trophy;
			case 1:
				return Medal;
			case 2:
				return Award;
			default:
				return null;
		}
	}

	function getRankColor(index: number) {
		switch (index) {
			case 0:
				return 'text-yellow-500';
			case 1:
				return 'text-muted-foreground';
			case 2:
				return 'text-primary';
			default:
				return 'text-muted-foreground';
		}
	}
</script>

{#if error}
	<div
		class="rounded-lg border border-destructive-border bg-destructive-soft p-4 text-center"
	>
		<p class="text-sm text-destructive">Error: {error}</p>
	</div>
{:else if isLoading}
	<div class="flex items-center justify-center py-8">
		<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
		<span class="ml-2 text-muted-foreground">Loading leaderboard...</span>
	</div>
{:else if reputationLeaderBoard?.length}
	<div class="mb-6 grid grid-cols-2 gap-4">
		<div class="rounded-md border border-border bg-muted/30 p-3">
			<div class="text-[11px] text-muted-foreground">Total Participants</div>
			<div class="mt-1 text-lg font-semibold tabular-nums text-foreground">
				{reputationLeaderBoard.length}
			</div>
		</div>
		<div class="rounded-md border border-border bg-muted/30 p-3">
			<div class="text-[11px] text-muted-foreground">Top Score</div>
			<div class="mt-1 text-lg font-semibold tabular-nums text-primary">
				{fmtNumber(reputationLeaderBoard[0]?.reputationScore || 0)}
			</div>
		</div>
	</div>

	<div class="overflow-x-auto">
		<table class="w-full text-xs md:table-fixed">
			<thead class="border-b border-border text-left">
				<tr>
					<th
						class="px-4 py-2 text-[11px] font-medium tracking-wider text-muted-foreground"
						>Rank</th
					>
					<th
						class="px-4 py-2 text-[11px] font-medium tracking-wider text-muted-foreground"
						>Address</th
					>
					<th
						class="px-4 py-2 text-right text-[11px] font-medium tracking-wider text-muted-foreground"
						>Score</th
					>
					<th
						class="px-4 py-2 text-right text-[11px] font-medium tracking-wider text-muted-foreground"
						>Tier</th
					>
				</tr>
			</thead>
			<tbody>
				{#each reputationLeaderBoard as item, index (item.recipient)}
					<tr class="border-b border-border transition-colors hover:bg-muted/50">
						<td class="px-4 py-3 align-middle">
							<div class="flex items-center gap-2">
								{#if index < 3}
									{@const Icon = getRankIcon(index)}
									<Icon class={`h-4 w-4 ${getRankColor(index)}`} />
								{/if}
								<span class="text-[13px] font-semibold text-foreground">
									#{index + 1}
								</span>
							</div>
						</td>
						<td class="px-4 py-3 align-middle">
							<span class="font-mono text-[11px] text-foreground">
								{truncate(item.recipient, 8)}
							</span>
						</td>
						<td class="px-4 py-3 text-right align-middle">
							<span class="font-mono text-[11px] tabular-nums text-foreground">
								{fmtNumber(item.reputationScore)}
							</span>
						</td>
						<td class="px-4 py-3 text-right align-middle">
							{#if item.reputationScore >= 10000}
								<span
									class="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
								>
									<Trophy class="mr-1 h-3 w-3" />
									Gold
								</span>
							{:else if item.reputationScore >= 5000}
								<span
									class="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
								>
									<Medal class="mr-1 h-3 w-3" />
									Silver
								</span>
							{:else}
								<span
									class="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
								>
									<Award class="mr-1 h-3 w-3" />
									Bronze
								</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if reputationLeaderBoard.length > 10}
		<div class="mt-4 text-center">
			<p class="text-xs text-muted-foreground">
				Showing top {reputationLeaderBoard.length} of {reputationLeaderBoard.length} total
				participants
			</p>
		</div>
	{/if}
{:else}
	<div
		class="rounded-lg border border-border bg-muted/30 p-8 text-center shadow-sm"
	>
		<div class="mx-auto max-w-sm">
			<h3 class="text-base font-medium text-foreground">No rankings yet</h3>
			<p class="mt-2 text-xs text-muted-foreground">
				Start participating in markets to earn reputation and appear on the leaderboard.
			</p>
		</div>
	</div>
{/if}
