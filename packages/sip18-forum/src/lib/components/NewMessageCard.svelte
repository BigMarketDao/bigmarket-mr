<script lang="ts">
  import { onMount } from 'svelte';
  import { marked } from 'marked';
  import { Profanity } from '@2toad/profanity';

  import { storedBnsData } from '../stores/threads';
  import { createThread } from '../stores/threads';

  // your browser-safe wrappers (each uses dynamic import inside)
  import {
    openWalletForSignature,
    getNewMessageTemplate,
    type Config,
    getStxAddress,
    authenticate,
    type Classes,
  } from '../utils/forum_helper';

  const { config, messageBoardId, parentId, threadId, level, onReload, classes = {}, isConnected } = $props<{
    config: Config;
		messageBoardId: string;
    parentId: string;
    threadId: string;
    level: number;
    onReload: (data: string) => void;
    classes: Classes;
    isConnected: boolean;
	}>();


  const defaultContainer = 'p-5 m-5 border rounded-xl p-4 shadow-sm';
  const defaultTitleInput = 'input w-full border-gray-300';
  const defaultContentEditor = 'textarea w-full min-h-[120px] border-gray-300';
  const defaultContentPreview = 'prose max-w-none bg-gray-100 p-4 rounded';
  const defaultError = 'text-sm text-red-600 mt-2';
  const defaultButtonCancel = 'btn btn-outline';
  const defaultButtonPost = 'btn btn-primary';
  const defaultReplyLink = 'text-tertiary text-sm underline';

  type MessageTemplate = ReturnType<typeof getNewMessageTemplate>;

  let showPreview = $state(false);
  let error: string | null = $state(null);
  let loading = $state(false);
  let composerOpen = $state(false);
  let componentKey = $state(0);

  let address: string = '';
  let template: MessageTemplate|undefined = $state<MessageTemplate|undefined>(undefined);

  // hydrate browser-only state
  onMount(async () => {
    address = (await getStxAddress()) ?? ''; // safe in browser
    template = getNewMessageTemplate(
      // build initial template
      messageBoardId,
      parentId,
      address,
      level ?? 1,
      $storedBnsData,
    );
  });

  async function handleConnect() {
    await authenticate(); // opens wallet flow
    componentKey++; // force button block to re-render
  }

  async function handleSubmit() {
    error = null;

    if (!template?.content?.trim()) {
      error = 'Content are required';
      return;
    }
    if (!template?.title?.trim() && level === 1) {
      error = 'Title required on top level message';
      return;
    }

    const profanity = new Profanity();
    template.title = profanity.censor(template.title);
    template.content = profanity.censor(template.content);

    try {
      loading = true;

      const { signature, publicKey } = await openWalletForSignature(config, template);

      const thread = await createThread(config.VITE_FORUM_API, threadId, {
        forumContent: template,
        auth: { signature, publicKey },
      });

      // reset composer
      template = getNewMessageTemplate(messageBoardId, parentId, address, level, $storedBnsData);
      composerOpen = false;
      onReload(thread);
    } catch (e: any) {
      error = e?.message ?? String(e);
    } finally {
      loading = false;
    }
  }
</script>

<!-- Reply Toggle -->
{#if !composerOpen}
  <div class="my-5 flex justify-end">
    <a
      class={classes.newMessageCard?.replyLink ?? defaultReplyLink}
      href="/"
      onclick={(e) => {e.preventDefault(); (composerOpen = !composerOpen)}}
    >
      {#if level === 1}new thread{:else}reply{/if}
    </a>
  </div>
{/if}

<!-- Composer Card -->
{#if composerOpen}
  <div class={classes.newMessageCard?.container ?? defaultContainer}>
    {#if template}
      {#if level === 1}
        <input
          type="text"
          placeholder="Thread title"
          class={classes.newMessageCard?.titleInput ?? defaultTitleInput}
          bind:value={template.title}
        />
      {/if}

      <div class="space-y-2">
        {#if !showPreview}
          <textarea
            id="content"
            class={classes.newMessageCard?.contentEditor ?? defaultContentEditor}
            bind:value={template.content}
            placeholder="Write your post in Markdown…"
          ></textarea>
        {:else}
          <div class={classes.newMessageCard?.contentPreview ?? defaultContentPreview}>
            {@html marked(template.content)}
          </div>
        {/if}
        <button
          type="button"
          class="btn btn-sm btn-ghost"
          onclick={(e) => {e.preventDefault(); (showPreview = !showPreview)}}
        >
          {showPreview ? 'Edit Markdown' : 'Preview Markdown'}
        </button>
      </div>
    {:else}
      <p class="text-sm text-base-content/70">Loading form…</p>
    {/if}

    {#if error}
      <p class={classes.newMessageCard?.error ?? defaultError}>{error}</p>
    {/if}

    <div class="flex justify-end gap-2">
      {#key componentKey}
        {#if isConnected}
          <div class="flex gap-x-3">
            <button
              class={classes.newMessageCard?.buttonCancel ?? defaultButtonCancel}
              onclick={() => (composerOpen = !composerOpen)}
            >
              {composerOpen ? 'Cancel' : 'New Message'}
            </button>
            <button
              class={classes.newMessageCard?.buttonPost ?? defaultButtonPost}
              onclick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Posting…' : 'Post'}
            </button>
          </div>
        {:else}
          <button
            type="button"
            class={classes.newMessageCard?.buttonPost ?? defaultButtonPost}
            onclick={handleConnect}
            disabled={loading}
          >
            Connect Wallet
          </button>
        {/if}
      {/key}
    </div>
  </div>
{/if}
