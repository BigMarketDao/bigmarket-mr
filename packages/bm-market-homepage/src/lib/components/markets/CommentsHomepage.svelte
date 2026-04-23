<script lang="ts">
  import type { PredictionMarketCreateEvent } from "@bigmarket/bm-types";
  import { onMount } from "svelte";
  import { loadThread } from '@bigmarket/sip18-forum';
  import type { AuthenticatedForumContent } from "@bigmarket/sip18-forum-types";


  const { market, forumApi } = $props<{
		market: PredictionMarketCreateEvent;
    forumApi: string
	}>();

  let thread: AuthenticatedForumContent | undefined = $state(undefined);
  let inited = false;
  let expanded = false;
  const stripHtml = (html: string) =>
    html
      ?.replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() ?? '';

  onMount(async () => {
    const forumId = market?.unhashedData?.forumMessageId;
    if (forumId) thread = await loadThread(forumApi, forumId);
    inited = true;
  });
</script>

<section class="w-full text-[12px] font-bold">
  <div class="flex gap-2 font-medium">
    {#if thread}
      <div
        class=" max:h-3 relative overflow-hidden font-mono text-[10px] font-medium text-purple-600 tabular-nums dark:text-gray-400"
      >
        <div class="ticker whitespace-nowrap overflow-hidden">
          <a
            href={`/market/${market.marketId}/${market.marketType}#comments`}
            class="min-w-0 flex-1 truncate"
            title={thread.forumContent.content}
          >
            {stripHtml(thread.forumContent.content)}
          </a>
        </div>
      </div>
    {:else}
      <div
        class="flex h-full items-center justify-between font-mono text-[10px] font-medium text-gray-600 tabular-nums dark:text-gray-400"
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
