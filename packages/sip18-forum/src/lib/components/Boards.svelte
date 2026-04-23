<script lang="ts">
  import NewMessageBoardModal from './NewMessageBoardModal.svelte';
  import { storedBoards } from '../stores/threads';
  import type { Config } from '../utils/forum_helper';
  export let config: Config;
  export let isConnected;
</script>

<div class="space-y-6 p-6">
  {#each $storedBoards as board}
    <div
      class="text-surface-contrast-500 bg-primary-50-950 rounded-2xl border-1 border-dashed p-3 py-4 shadow"
    >
      <div class=" mb-5 justify-between">
        <h2 class="text-xl font-semibold">
          <a href={`/forums/${board.forumMessageBoard.messageBoardId}`}
            >{board.forumMessageBoard.title}</a
          >
        </h2>
        <!-- <pre class="text-secondary-200-800">{board.forumMessageBoard.content}</pre> -->
      </div>
      <!-- <ForumMessages messageBoardId={board.forumMessageBoard.messageBoardId} level={1} /> -->
    </div>
  {/each}
  <NewMessageBoardModal {isConnected} {config} />
</div>
