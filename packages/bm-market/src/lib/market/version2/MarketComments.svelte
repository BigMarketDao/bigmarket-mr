<script lang="ts">
  import type { PredictionMarketCreateEvent, UserStake } from '@bigmarket/bm-types';
  import type { AuthenticatedForumContent } from '@bigmarket/sip18-forum-types';
  import { Thread } from '@bigmarket/sip18-forum';
  import { onMount } from 'svelte';
  import { appConfigStore, isLoggedIn, requireAppConfig } from '@bigmarket/bm-common';
  import { truncate } from '@bigmarket/bm-utilities';

  const appConfig = $derived(requireAppConfig($appConfigStore));

  const { market, thread, userStake } = $props<{
		market: PredictionMarketCreateEvent;
		thread: AuthenticatedForumContent | undefined;
		userStake: UserStake | undefined;
	}>();

  const STACKS_ADDRESS_RE = /(ST|SP)[A-Z0-9]{8,}/g;

  function truncateAddressesIn(root: ParentNode) {
    root.querySelectorAll('.thread-wrapper h3').forEach((h3) => {
      if (!(h3 instanceof HTMLElement)) return;

      let fullAddress: string | undefined;
      const walker = document.createTreeWalker(h3, NodeFilter.SHOW_TEXT);
      let node: Node | null;

      while ((node = walker.nextNode())) {
        const text = node.textContent ?? '';
        const match = text.match(/(ST|SP)[A-Z0-9]{8,}/);
        if (!match) continue;

        fullAddress ??= match[0];
        node.textContent = text.replace(STACKS_ADDRESS_RE, (addr) => truncate(addr, 4));
      }

      if (fullAddress) {
        h3.title = fullAddress;
      }
    });
  }

  function enhanceThreadLayout(wrapper: HTMLElement) {
    truncateAddressesIn(wrapper);

    const threadRoot = wrapper.querySelector(':scope > div');
    if (!threadRoot) return;

    const rootCard = threadRoot.querySelector(':scope > div');
    if (!rootCard || !(rootCard instanceof HTMLElement)) return;

    rootCard.classList.add('thread-root-message');

    if (!rootCard.querySelector('.thread-root-badge')) {
      const badge = document.createElement('span');
      badge.className = 'thread-root-badge';
      badge.textContent = 'Original post';
      rootCard.insertBefore(badge, rootCard.firstChild);
    }
  }

  onMount(() => {
    if (!thread) return;

    const runEnhancement = () => {
      const wrapper = document.querySelector('.thread-wrapper');
      if (wrapper instanceof HTMLElement) {
        enhanceThreadLayout(wrapper);
      }
    };

    runEnhancement();
    const observer = new MutationObserver(() => runEnhancement());
    const wrapper = document.querySelector('.thread-wrapper');
    if (wrapper) {
      observer.observe(wrapper, { childList: true, subtree: true, characterData: true });
    }

    return () => observer.disconnect();
  });

  let threadClasses = {
    root: 'space-y-0',
    messageCard: {
      container: 'border-b border-border pb-4 mb-4 last:border-b-0 last:mb-0',
      title: 'hidden',
      author:
        'flex items-center gap-1.5 text-xs font-medium text-info font-mono mb-2 tabular-nums',
      iconSuccess: 'inline-block h-3.5 w-3.5 shrink-0 text-info',
      iconError: 'inline-block h-3.5 w-3.5 shrink-0 text-muted-foreground',
      body: 'text-sm text-foreground leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2',
    },
    newMessageCard: {
      container: 'mb-4 space-y-3 rounded-lg border border-border bg-muted/50 p-3',
      titleInput: 'hidden',
      contentLabel: 'hidden',
      contentEditor:
        'w-full p-3 border border-input rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:border-ring resize-none min-h-[70px] text-sm',
      contentPreview:
        'prose prose-sm max-w-none bg-card border border-border p-3 rounded-lg text-sm text-foreground',
      error: 'text-sm text-destructive mt-1',
      buttonCancel:
        'px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
      buttonPost:
        'px-4 py-1.5 h-11 md:h-10 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50',
      replyLink:
        'text-xs font-medium text-info hover:text-info/80 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-sm',
      previewButton:
        'text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-sm',
      replyContainer: 'flex justify-end items-center gap-2 mt-2',
    },
  };
</script>

<div
  id="comments"
  class="rounded-xl border border-border bg-card shadow-sm"
>
  <div class="border-b border-border px-4 py-3">
    <h2 class="text-center text-lg font-medium text-foreground">Discussion</h2>
  </div>

  <div class="p-4 sm:p-5">
    {#if thread}
      <div class="thread-wrapper">
        <Thread
          forumApi={appConfig.VITE_FORUM_API}
          config={appConfig}
          threadId={thread.forumContent.messageId}
          threadIn={thread}
          classes={threadClasses}
          isConnected={isLoggedIn()}
        />
      </div>
    {:else}
      <div class="py-8 text-center">
        <div class="mb-3 text-muted-foreground">
          <svg class="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <p class="text-sm text-muted-foreground">
          No discussion available for this market.
        </p>
        <p class="mt-1 text-xs text-muted-foreground">Be the first to share your thoughts!</p>
      </div>
    {/if}
  </div>
</div>

<style>
  :global(.thread-wrapper) {
    font-family: inherit;
    color: var(--color-foreground);
  }

  /* Original market post — distinct from replies */
  :global(.thread-wrapper .thread-root-message) {
    background: color-mix(in oklab, var(--color-primary) 7%, var(--color-muted));
    border: 1px solid color-mix(in oklab, var(--color-primary) 22%, var(--color-border));
    border-radius: 0.75rem;
    padding: 1rem 1.25rem;
    margin-bottom: 1.25rem;
    border-bottom: none !important;
  }

  :global(.thread-wrapper .thread-root-badge) {
    display: inline-flex;
    align-items: center;
    margin-bottom: 0.625rem;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-primary);
    background: color-mix(in oklab, var(--color-primary) 14%, transparent);
    border: 1px solid color-mix(in oklab, var(--color-primary) 25%, transparent);
  }

  /* Replies block */
  :global(.thread-wrapper ul) {
    margin-left: 0 !important;
    margin-top: 0.25rem !important;
    padding-left: 0.875rem !important;
    border-left: 2px solid var(--color-border) !important;
    list-style-type: none !important;
  }

  :global(.thread-wrapper ul::before) {
    content: 'Replies';
    display: block;
    margin-bottom: 0.75rem;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-muted-foreground);
  }

  :global(.thread-wrapper ul > div) {
    padding-bottom: 0.875rem;
    margin-bottom: 0.875rem;
    border-bottom: 1px solid var(--color-border);
  }

  :global(.thread-wrapper ul > div:last-child) {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  :global(.thread-wrapper > div) {
    margin-left: 0 !important;
    padding-left: 0 !important;
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
  }

  :global(.thread-wrapper input[placeholder*='title']),
  :global(.thread-wrapper input[placeholder*='Title']) {
    display: none !important;
  }

  :global(.thread-wrapper h1),
  :global(.thread-wrapper h2) {
    display: none !important;
  }

  :global(.thread-wrapper button) {
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    font-size: 0.875rem !important;
    font-weight: 500 !important;
    padding: 0.5rem 1rem !important;
    border-radius: 0.5rem !important;
  }

  :global(.thread-wrapper button[type='submit']),
  :global(.thread-wrapper button:not([type='submit']):not(.cancel-btn):not(.preview-btn):not(.btn-ghost):not(.btn)) {
    background-color: var(--color-primary) !important;
    color: var(--color-primary-foreground) !important;
    border: none !important;
    min-height: 2.75rem !important;
  }

  :global(.thread-wrapper button[type='submit']:hover),
  :global(.thread-wrapper button:not([type='submit']):not(.cancel-btn):not(.preview-btn):not(.btn-ghost):not(.btn):hover) {
    background-color: color-mix(in oklab, var(--color-primary) 90%, transparent) !important;
  }

  :global(.thread-wrapper button[type='submit']:focus-visible),
  :global(.thread-wrapper button:not([type='submit']):not(.cancel-btn):not(.preview-btn):not(.btn-ghost):not(.btn):focus-visible) {
    outline: none !important;
    box-shadow: 0 0 0 2px var(--color-ring) !important;
  }

  @media (min-width: 768px) {
    :global(.thread-wrapper button[type='submit']),
    :global(.thread-wrapper button:not([type='submit']):not(.cancel-btn):not(.preview-btn):not(.btn-ghost):not(.btn)) {
      min-height: 2.5rem !important;
    }
  }

  :global(.thread-wrapper .cancel-btn),
  :global(.thread-wrapper button[class*='cancel']) {
    background-color: transparent !important;
    color: var(--color-muted-foreground) !important;
    border: 1px solid var(--color-border) !important;
    min-height: auto !important;
  }

  :global(.thread-wrapper .cancel-btn:hover),
  :global(.thread-wrapper button[class*='cancel']:hover) {
    color: var(--color-foreground) !important;
  }

  :global(.thread-wrapper .cancel-btn:focus-visible),
  :global(.thread-wrapper button[class*='cancel']:focus-visible) {
    outline: none !important;
    box-shadow: 0 0 0 2px var(--color-ring) !important;
  }

  :global(.thread-wrapper .btn-ghost),
  :global(.thread-wrapper button.btn-ghost) {
    background: transparent !important;
    color: var(--color-muted-foreground) !important;
    border: none !important;
    min-height: auto !important;
    padding: 0.25rem 0.5rem !important;
    font-size: 0.75rem !important;
    font-weight: 500 !important;
  }

  :global(.thread-wrapper .btn-ghost:hover),
  :global(.thread-wrapper button.btn-ghost:hover) {
    color: var(--color-foreground) !important;
    background: var(--color-muted) !important;
  }

  :global(.thread-wrapper .form-actions),
  :global(.thread-wrapper div[class*='flex justify-end']) {
    display: flex !important;
    justify-content: flex-end !important;
    gap: 0.5rem !important;
    margin-top: 0.5rem !important;
    align-items: center !important;
    padding: 0 !important;
  }

  :global(.thread-wrapper h3) {
    display: flex !important;
    align-items: center !important;
    gap: 0.375rem !important;
    font-family: var(--font-mono) !important;
    font-size: 0.8125rem !important;
    font-weight: 500 !important;
    font-variant-numeric: tabular-nums !important;
    color: var(--color-info) !important;
    margin-bottom: 0.375rem !important;
  }

  :global(.thread-wrapper .prose) {
    max-width: none !important;
    font-size: 0.875rem !important;
    color: var(--color-foreground) !important;
    line-height: 1.55 !important;
    margin-top: 0 !important;
    margin-bottom: 0.75rem !important;
  }

  :global(.thread-wrapper .thread-root-message .prose) {
    font-size: 0.9375rem !important;
  }

  :global(.thread-wrapper textarea) {
    width: 100% !important;
    padding: 0.75rem !important;
    border: 1px solid var(--color-input) !important;
    border-radius: 0.5rem !important;
    background-color: var(--color-card) !important;
    color: var(--color-foreground) !important;
    font-size: 0.875rem !important;
    resize: vertical !important;
    min-height: 70px !important;
    line-height: 1.4 !important;
  }

  :global(.thread-wrapper textarea::placeholder) {
    color: var(--color-muted-foreground) !important;
  }

  :global(.thread-wrapper textarea:focus-visible) {
    outline: none !important;
    border-color: var(--color-ring) !important;
    box-shadow: 0 0 0 2px color-mix(in oklab, var(--color-ring) 25%, transparent) !important;
  }

  :global(.thread-wrapper .my-5),
  :global(.thread-wrapper div[class*='my-5']) {
    margin-top: 0.375rem !important;
    margin-bottom: 0 !important;
    display: flex !important;
    justify-content: flex-end !important;
    width: 100% !important;
  }

  :global(.thread-wrapper a) {
    color: var(--color-info) !important;
    text-decoration: none !important;
    font-size: 0.75rem !important;
  }

  :global(.thread-wrapper a:hover) {
    color: color-mix(in oklab, var(--color-info) 80%, transparent) !important;
    text-decoration: underline !important;
  }

  :global(.thread-wrapper a:focus-visible) {
    outline: none !important;
    box-shadow: 0 0 0 2px var(--color-ring) !important;
    border-radius: 0.125rem !important;
  }

  :global(.thread-wrapper *) {
    box-sizing: border-box !important;
  }

  @media (max-width: 640px) {
    :global(.thread-wrapper ul) {
      padding-left: 0.625rem !important;
    }

    :global(.thread-wrapper .thread-root-message) {
      padding: 0.875rem 1rem;
    }

    :global(.thread-wrapper h3) {
      font-size: 0.75rem !important;
    }

    :global(.thread-wrapper button) {
      padding: 0.375rem 0.75rem !important;
      font-size: 0.75rem !important;
    }
  }
</style>
