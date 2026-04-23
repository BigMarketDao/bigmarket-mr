<script lang="ts">
  import type {
    AuthenticatedForumContent,
    AuthenticatedForumMessageBoard,
  } from '@bigmarket/sip18-forum-types';
  import BoardMessages from './BoardMessages.svelte';
  import { onMount } from 'svelte';
  import type { Classes, Config } from '../utils/forum_helper';


  const { classes = {}, forumId, config, boards, messages, isConnected } = $props<{
    classes: Classes;
		forumId: string;
		config: Config;
		boards: Array<AuthenticatedForumMessageBoard>;
      messages: Array<AuthenticatedForumContent>;
    isConnected: boolean;
	}>();


  let board: AuthenticatedForumMessageBoard | undefined = $state(undefined);

  onMount(() => {
    const boardId = forumId;
    board = boards.find((o: AuthenticatedForumMessageBoard) => o.forumMessageBoard.messageBoardId === boardId);
  });
</script>

{#if board}
  <div class="space-y-6 p-6">
    <h1 class="text-2xl font-bold">📣 {board.forumMessageBoard.title}</h1>

    {#if board}
      <div
        class="text-surface-contrast-500 bg-primary-50-950 rounded-2xl border-1 border-dashed p-3 py-4 shadow"
      >
        <BoardMessages
          {classes}
          {config}
          {forumId}
          {messages}
          messageBoardId={board.forumMessageBoard.messageBoardId}
          level={1}
          {isConnected}
        />
      </div>
    {/if}
    <!-- <NewMessageBoardModal /> -->
  </div>
{:else}
  <div>loading...</div>
{/if}
