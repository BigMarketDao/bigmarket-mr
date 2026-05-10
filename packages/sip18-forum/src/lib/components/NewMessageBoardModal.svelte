<script lang="ts">
  import { onMount } from 'svelte';
  import { marked } from 'marked';
  import { Profanity } from '@2toad/profanity';

  import { getConfig } from '../stores/stores_config';
  import { createBoard, storedBnsData } from '../stores/threads';

  // browser-safe wrappers: each one does a dynamic import internally
  import {
    authenticate,
    getNewBoardTemplate,
    getStxAddress,
    openWalletForSignature,
    type Config,
  } from '../utils/forum_helper';

  const { config, isConnected } = $props<{
    config: Config;
    isConnected: boolean;
	}>();

  let address = $state('');
  type BoardTemplate = ReturnType<typeof getNewBoardTemplate>;
  let template: BoardTemplate|undefined = $state<BoardTemplate|undefined>(undefined);

  let showPreview = $state(false);
  let error: string | null = $state(null);
  let loading = $state(false);
  let modalOpen = $state(false);
  let componentKey = $state(0);

  // hydrate browser-only state
  onMount(async () => {
    address = (await getStxAddress()) ?? '';
    template = getNewBoardTemplate(address, $storedBnsData);
  });

  const handleConnect = async () => {
    await authenticate();
    componentKey++; // force the keyed block to re-render
  };

  async function handleSubmit() {
    error = null;

    if (!template?.title?.trim() || !template?.content?.trim()) {
      error = 'Title and content are required';
      return;
    }

    const profanity = new Profanity();
    template.title = profanity.censor(template.title);
    template.content = profanity.censor(template.content);

    try {
      loading = true;
      const response = await openWalletForSignature(getConfig(), template);
      if (!response) {
        throw new Error("Failed to request forum signature");
      }
      const { signature, publicKey } = response;
      await createBoard(config.VITE_FORUM_API, {
        forumContent: template,
        auth: { signature, publicKey },
      });

      // reset
      template = getNewBoardTemplate(address, $storedBnsData);
      modalOpen = false;

      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (e: any) {
      error = e?.message ?? String(e);
    } finally {
      loading = false;
    }
  }
</script>

<!-- Button to open modal -->
<div class="flex justify-center">
  <button
    type="button"
    class="rounded-md bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
    onclick={() => (modalOpen = true)}
  >
    New Board
  </button>
</div>

<!-- Modal -->
{#if modalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/100">
    <div class="w-full max-w-lg space-y-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-950">
      <h2 class="text-xl font-bold">Create a New Message Board</h2>

      {#if template}
        <input
          type="text"
          class="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          bind:value={template.title}
          placeholder="This message board title"
        />

        <!-- Markdown Input -->
        <div class="space-y-2">
          <label for="content-entry" class="block text-sm font-semibold text-zinc-800 dark:text-zinc-200">Board Content</label>
          {#if !showPreview}
            <textarea
              id="content-entry"
              class="min-h-[120px] w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              bind:value={template.content}
              placeholder="About this message board in Markdown…"
            ></textarea>
          {:else}
            <div class="prose max-w-none rounded border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
              {@html marked(template.content)}
            </div>
          {/if}
          <button
            type="button"
            class="mt-1 rounded-md px-2 py-1 text-xs font-semibold text-zinc-600 underline-offset-4 hover:bg-zinc-100 hover:underline dark:text-zinc-400 dark:hover:bg-zinc-800"
            onclick={() => (showPreview = !showPreview)}
          >
            {showPreview ? 'Edit Markdown' : 'Preview Markdown'}
          </button>
        </div>
      {:else}
        <p class="text-sm text-zinc-500 dark:text-zinc-400">Loading form…</p>
      {/if}

      {#if error}
        <p class="text-sm text-red-500">{error}</p>
      {/if}

      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          onclick={() => (modalOpen = false)}
          disabled={loading}
        >
          Cancel
        </button>

        {#key componentKey}
          {#if isConnected}
            <button
              type="button"
              class="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50 dark:bg-orange-500 dark:hover:bg-orange-600"
              onclick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Posting…' : 'Create'}
            </button>
          {:else}
            <button
              type="button"
              class="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50 dark:bg-orange-500 dark:hover:bg-orange-600"
              onclick={handleConnect}
              disabled={loading}
            >
              Connect Wallet
            </button>
          {/if}
        {/key}
      </div>
    </div>
  </div>
{/if}
