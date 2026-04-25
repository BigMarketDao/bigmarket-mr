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
			if (isLoggedIn()) {
				reputationLeaderBoard = await getReputationLeaderBoard();
			}
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
				return 'text-gray-400';
			case 2:
				return 'text-orange-500';
			default:
				return 'text-gray-600 dark:text-gray-400';
		}
	}
</script>

{#if error}
	<div
		class="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20"
	>
		<p class="text-sm text-red-600 dark:text-red-400">Error: {error}</p>
	</div>
{:else if isLoading}
	<div class="flex items-center justify-center py-8">
		<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500"></div>
		<span class="ml-2 text-gray-600 dark:text-gray-400">Loading leaderboard...</span>
	</div>
{:else if reputationLeaderBoard?.length}
	<!-- Stats Grid -->
	<div class="mb-6 grid grid-cols-2 gap-4">
		<div
			class="rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="text-[11px] text-gray-500 dark:text-gray-400">Total Participants</div>
			<div class="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
				{reputationLeaderBoard.length}
			</div>
		</div>
		<div
			class="rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="text-[11px] text-gray-500 dark:text-gray-400">Top Score</div>
			<div class="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
				{fmtNumber(reputationLeaderBoard[0]?.reputationScore || 0)}
			</div>
		</div>
	</div>

	<!-- Top 10 Table -->
	<div class="overflow-x-auto">
		<table class="w-full text-xs md:table-fixed">
			<thead class="border-b border-gray-100 text-left dark:border-gray-800">
				<tr>
					<th
						class="px-4 py-2 text-[11px] font-medium tracking-wider text-gray-500 dark:text-gray-400"
						>Rank</th
					>
					<th
						class="px-4 py-2 text-[11px] font-medium tracking-wider text-gray-500 dark:text-gray-400"
						>Address</th
					>
					<th
						class="px-4 py-2 text-right text-[11px] font-medium tracking-wider text-gray-500 dark:text-gray-400"
						>Score</th
					>
					<th
						class="px-4 py-2 text-right text-[11px] font-medium tracking-wider text-gray-500 dark:text-gray-400"
						>Tier</th
					>
				</tr>
			</thead>
			<tbody>
				{#each reputationLeaderBoard as item, index (item.recipient)}
					<tr
						class="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/40"
					>
						<td class="px-4 py-3 align-middle">
							<div class="flex items-center gap-2">
								{#if index < 3}
									{@const Icon = getRankIcon(index)}
									<Icon class={`h-4 w-4 ${getRankColor(index)}`} />
								{/if}
								<span class="text-[13px] font-semibold text-gray-900 dark:text-gray-100">
									#{index + 1}
								</span>
							</div>
						</td>
						<td class="px-4 py-3 align-middle">
							<span class="font-mono text-[11px] text-gray-900 dark:text-gray-100">
								{truncate(item.recipient, 8)}
							</span>
						</td>
						<td class="px-4 py-3 text-right align-middle">
							<span class="font-mono text-[11px] text-gray-900 tabular-nums dark:text-gray-100">
								{fmtNumber(item.reputationScore)}
							</span>
						</td>
						<td class="px-4 py-3 text-right align-middle">
							{#if item.reputationScore >= 10000}
								<span
									class="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500"
								>
									<Trophy class="mr-1 h-3 w-3" />
									Gold
								</span>
							{:else if item.reputationScore >= 5000}
								<span
									class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300"
								>
									<Medal class="mr-1 h-3 w-3" />
									Silver
								</span>
							{:else}
								<span
									class="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-500"
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

	<!-- Total Participants -->
	{#if reputationLeaderBoard.length > 10}
		<div class="mt-4 text-center">
			<p class="text-xs text-gray-500 dark:text-gray-400">
				Showing top {reputationLeaderBoard.length} of {reputationLeaderBoard.length} total participants
			</p>
		</div>
	{/if}
{:else}
	<div
		class="rounded border border-gray-200 bg-gray-50 p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800"
	>
		<div class="mx-auto max-w-sm">
			<h3 class="text-base font-medium text-gray-900 dark:text-gray-100">No rankings yet</h3>
			<p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
				Start participating in markets to earn reputation and appear on the leaderboard.
			</p>
		</div>
	</div>
{/if}
