<script lang="ts">
	import type { PredictionMarketCreateEvent } from '@bigmarket/bm-types';
	import { onMount } from 'svelte';
	import { loadThread } from '@bigmarket/sip18-forum';
	import type { AuthenticatedForumContent } from '@bigmarket/sip18-forum-types';

	const { market, forumApi } = $props<{
		market: PredictionMarketCreateEvent;
		forumApi: string;
	}>();

	let thread: AuthenticatedForumContent | undefined = $state(undefined);
	const stripHtml = (html: string) =>
		html
			?.replace(/<[^>]*>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim() ?? '';

	onMount(async () => {
		const forumId = market?.unhashedData?.forumMessageId;
		if (forumId) thread = await loadThread(forumApi, forumId);
		console.log('thread: ', thread);
	});
</script>

<section class="w-full text-xs font-bold">
	<div class="flex gap-2 font-medium">
		{#if thread}
			<div class="relative max-h-3 overflow-hidden font-mono text-xs font-medium text-community tabular-nums">
				<div class="ticker overflow-hidden whitespace-nowrap">
					<a
						href={`/market/${market.marketId}/${market.marketType}#comments`}
						class="min-w-0 flex-1 truncate text-community hover:text-community/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
						title={thread.forumContent.content}
					>
						{stripHtml(thread.forumContent.content)}
					</a>
				</div>
			</div>
		{:else}
			<div
				class="flex h-full items-center justify-between font-mono text-xs font-medium text-muted-foreground tabular-nums"
			>
				breaking news on predicitons
			</div>
		{/if}
	</div>
</section>

<style>
	.ticker {
		display: inline-block;
		padding-left: 100%;
		animation: ticker 50s linear infinite;
	}

	.ticker:hover {
		animation-play-state: paused;
	}

	@keyframes ticker {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-100%);
		}
	}
</style>
