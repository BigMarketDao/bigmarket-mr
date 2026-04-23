<script lang="ts">
  import type { AuthenticatedForumContent } from '@bigmarket/sip18-forum-types';
  import MessageCard from './MessageCard.svelte';
  import { onMount } from 'svelte';
  import { loadBoardMessages } from '../stores/threads';
  import NewMessageCard from './NewMessageCard.svelte';
  import type { Config } from '../utils/forum_helper';

  export let config: Config;
  export let messageBoardId;
  export let messages: Array<AuthenticatedForumContent>;
  export let level;
  export let isConnected;

  const handleReload = async (data: any) => {
    messages = await loadBoardMessages(config.VITE_FORUM_API, messageBoardId);
  };

  onMount(async () => {});
</script>

{#if level === 1}
  <!-- 
		Optional reply form: messageBoardId is a container/board for messages. 
	 	Threads are top level messsages (level=1 and parentId=maessageBoardId).
	 	Messages and replies are identical - they are displayed recursively using level and parentId.
	-->
  <NewMessageCard
    {config}
    {messageBoardId}
    threadId={messages[0].forumContent.messageId}
    parentId={messageBoardId}
    onReload={handleReload}
    level={1}
    {isConnected}
  />
{/if}

<ul class="space-y-4">
  {#each messages as message}
    <MessageCard {isConnected} {config} thread={messages[0]} {message} onReload={handleReload} />
  {/each}
</ul>
