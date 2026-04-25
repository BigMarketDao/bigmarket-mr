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
  <button class="btn variant-filled bg-primary-500" onclick={() => (modalOpen = true)}>
    New Board
  </button>
</div>

<!-- Modal -->
{#if modalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/100">
    <div class="bg-base-100 w-full max-w-lg space-y-4 rounded-lg p-6 shadow-lg">
      <h2 class="text-xl font-bold">Create a New Message Board</h2>

      {#if template}
        <input
          type="text"
          class="input input-bordered w-full"
          bind:value={template.title}
          placeholder="This message board title"
        />

        <!-- Markdown Input -->
        <div class="space-y-2">
          <label for="content-entry" class="label font-semibold">Board Content</label>
          {#if !showPreview}
            <textarea
              id="content-entry"
              class="textarea textarea-bordered min-h-[120px] w-full"
              bind:value={template.content}
              placeholder="About this message board in Markdown…"
            ></textarea>
          {:else}
            <div class="prose bg-base-100 border-base-300 max-w-none rounded border p-4">
              {@html marked(template.content)}
            </div>
          {/if}
          <button
            type="button"
            class="btn btn-sm btn-ghost mt-1"
            onclick={() => (showPreview = !showPreview)}
          >
            {showPreview ? 'Edit Markdown' : 'Preview Markdown'}
          </button>
        </div>
      {:else}
        <p class="text-sm text-base-content/70">Loading form…</p>
      {/if}

      {#if error}
        <p class="text-sm text-red-500">{error}</p>
      {/if}

      <div class="flex justify-end gap-2">
        <button class="btn" onclick={() => (modalOpen = false)} disabled={loading}>
          Cancel
        </button>

        {#key componentKey}
          {#if isConnected}
            <button class="btn btn-primary" onclick={handleSubmit} disabled={loading}>
              {loading ? 'Posting…' : 'Create'}
            </button>
          {:else}
            <button class="btn btn-primary" onclick={handleConnect} disabled={loading}>
              Connect Wallet
            </button>
          {/if}
        {/key}
      </div>
    </div>
  </div>
{/if}
