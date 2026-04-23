<script lang="ts">
  import type { AuthenticatedForumContent } from '@bigmarket/sip18-forum-types';
  import MessageCard from './MessageCard.svelte';
  import { onMount } from 'svelte';
  import { loadBoardMessages } from '../stores/threads';
  import NewMessageCard from './NewMessageCard.svelte';
  import type { Classes, Config } from '../utils/forum_helper';

  // export let config: Config;
  // export let messageBoardId;
  // export let messages: Array<AuthenticatedForumContent>;
  // export let level;
  // export let isConnected;

  const { forumId, config, messageBoardId, level, messages, isConnected, classes = {} } = $props<{
		forumId: string;
    config: Config;
		messageBoardId: string;
		level: number;
    messages: Array<AuthenticatedForumContent>;
    isConnected: boolean;
    classes: Classes;
	}>();

  let loadedMessage:Array<AuthenticatedForumContent> = $derived(messages);

  const handleReload = async (data: any) => {
    loadedMessage = await loadBoardMessages(forumId, messageBoardId);
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
    {classes}
    {config}
    {messageBoardId}
    threadId={loadedMessage[0].forumContent.messageId}
    parentId={messageBoardId}
    onReload={handleReload}
    level={1}
    {isConnected}
  />
{/if}

<ul class="space-y-4">
  {#each loadedMessage as message}
    <MessageCard {isConnected} {config} thread={loadedMessage[0]} {message} onReload={handleReload} {classes} />
  {/each}
</ul>
