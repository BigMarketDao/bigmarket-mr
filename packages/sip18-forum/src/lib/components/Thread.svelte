<script lang="ts">
  import type { AuthenticatedForumContent } from '@bigmarket/sip18-forum-types';
  import MessageCard from './MessageCard.svelte';
  import { onMount } from 'svelte';
  import { loadThread } from '../stores/threads';
  import type { Classes, Config } from '../utils/forum_helper';

  const { forumApi, threadId, config, threadIn, classes = {}, isConnected } = $props<{
    forumApi: string;
    threadId: string;
		config: Config;
		threadIn: AuthenticatedForumContent;
    classes: Classes;
    isConnected: boolean;
	}>();

  const defaultRoot = 'p-4 bg-white rounded shadow';

  let thread: AuthenticatedForumContent = $derived(threadIn);
  const handleReload = async (data: any) => {
    thread = await loadThread(forumApi, thread.forumContent.messageId);
  };

  onMount(async () => {
    if (!thread) thread = await loadThread(config.VITE_FORUM_API, threadId);
  });
</script>

<div class={classes.root || defaultRoot}>
  {#if thread}
    <MessageCard {config} {isConnected} message={thread} {thread} onReload={handleReload} {classes} />
  {/if}
</div>
