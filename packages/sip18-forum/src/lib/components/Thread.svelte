<script lang="ts">
  import type { AuthenticatedForumContent } from '@bigmarket/sip18-forum-types';
  import MessageCard from './MessageCard.svelte';
  import { onMount } from 'svelte';
  import { loadThread } from '../stores/threads';
  import type { Classes, Config } from '../utils/forum_helper';

  export let threadId: string; //page.params.threadId
  export let config: Config;
  export let thread: AuthenticatedForumContent;
  export let classes: Classes = {};
  const defaultRoot = 'p-4 bg-white rounded shadow';

  const handleReload = async (data: any) => {
    thread = await loadThread(config.VITE_FORUM_API, thread.forumContent.messageId);
  };

  onMount(async () => {
    if (!thread) thread = await loadThread(config.VITE_FORUM_API, threadId);
  });
</script>

<div class={classes.root || defaultRoot}>
  {#if thread}
    <MessageCard {config} message={thread} {thread} onReload={handleReload} {classes} />
  {/if}
</div>
