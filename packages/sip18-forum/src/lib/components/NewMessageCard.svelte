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
  const defaultTitleInput =
    'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white';
  const defaultContentEditor = 'textarea w-full min-h-[120px] border-gray-300';
  const defaultContentPreview = 'prose max-w-none bg-gray-100 p-4 rounded';
  const defaultError = 'text-sm text-red-600 mt-2';
  const defaultButtonCancel =
    'rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900';
  const defaultButtonPost =
    'rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600';
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
          class="rounded-md px-2 py-1 text-xs font-semibold text-zinc-600 underline-offset-4 hover:bg-zinc-100 hover:underline dark:text-zinc-400 dark:hover:bg-zinc-800"
          onclick={(e) => {e.preventDefault(); (showPreview = !showPreview)}}
        >
          {showPreview ? 'Edit Markdown' : 'Preview Markdown'}
        </button>
      </div>
    {:else}
      <p class="text-sm text-zinc-500 dark:text-zinc-400">Loading form…</p>
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
