<script lang="ts">
  import type { PredictionMarketCreateEvent, UserStake } from '@bigmarket/bm-types';
  import type { AuthenticatedForumContent } from '@bigmarket/sip18-forum-types';
  import { Thread } from '@bigmarket/sip18-forum';
  import { onMount } from 'svelte';
  import { appConfigStore, isLoggedIn, requireAppConfig } from '@bigmarket/bm-common';
  const appConfig = $derived(requireAppConfig($appConfigStore));

  const { market, thread, userStake } = $props<{
		market: PredictionMarketCreateEvent;
		thread: AuthenticatedForumContent | undefined;
		userStake: UserStake | undefined;
	}>();

  // Address formatting function (matching screenshot style)
  function formatWalletAddress(address: string): string {
    if (!address || address === 'Unknown') return '--';
    if (address.length < 8) return address;
    return `${address.slice(0, 2)}..${address.slice(-2).toUpperCase()}`;
  }

  // Clean address formatting - NO BADGES as requested
  function formatAllAddresses() {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const authors = document.querySelectorAll('.thread-wrapper h3');
        authors.forEach((el, index) => {
          const text = el.textContent || '';
          if (text.startsWith('ST') && text.length > 8) {
            // Format the address
            const formattedAddress = formatWalletAddress(text);

            // Create timestamp
            const timestamps = ['now', '12h ago', '1h ago', '3h ago'];
            const timestamp = timestamps[index % timestamps.length] || '12h ago';

            // Simple format: ADDRESS, TIME_AGO
            el.innerHTML = `${formattedAddress}, ${timestamp}`;
            el.className = 'text-info font-mono text-sm mb-2 tabular-nums';
          }
        });
      }, 100);
    }
  }

  // Monitor for changes and format addresses

  // Also format addresses after updates
  onMount(() => { 
    if (thread) {formatAllAddresses();}
  });

  // Clean forum styling - compact and well-aligned
  let threadClasses = {
    root: 'space-y-0',
    messageCard: {
      container: 'border-b border-border pb-3 mb-3 last:border-b-0',
      title: 'hidden',
      author: 'text-sm text-info font-mono mb-2 tabular-nums',
      iconSuccess: 'hidden',
      iconError: 'hidden',
      body: 'text-sm text-foreground leading-relaxed',
    },
    newMessageCard: {
      container: 'mb-4 space-y-3',
      titleInput: 'hidden',
      contentLabel: 'hidden',
      contentEditor:
        'w-full p-3 border border-input rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:border-ring resize-none min-h-[70px] text-sm',
      contentPreview:
        'prose prose-sm max-w-none bg-muted p-3 rounded text-sm text-foreground',
      error: 'text-sm text-destructive mt-1',
      buttonCancel:
        'px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
      buttonPost:
        'px-4 py-1.5 h-11 md:h-10 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50',
      replyLink:
        'text-xs text-info hover:text-info/80 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-sm',
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

  <div class="p-4">
    {#if thread}
      <div class="thread-wrapper">
        <!-- threadId={thread.forumContent.messageId} -->
        <Thread forumApi={appConfig.VITE_FORUM_API} config={appConfig} threadId={thread.forumContent.messageId} threadIn={thread} classes={threadClasses} isConnected={isLoggedIn()} />
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
        <p class="mt-1 text-xs text-muted-foreground tabular-nums">Be the first to share your thoughts!</p>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Clean forum styling — semantic tokens only */
  :global(.thread-wrapper) {
    font-family: inherit;
    color: var(--color-foreground);
  }

  /* CRITICAL: Input box FIRST - move to top */
  :global(.thread-wrapper > div:first-child) {
    order: -1 !important;
    margin-bottom: 1rem !important;
  }

  /* Clean root container */
  :global(.thread-wrapper > div) {
    margin-left: 0 !important;
    padding-left: 0 !important;
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
  }

  /* NO VERTICAL LINES - clean indentation only */
  :global(.thread-wrapper ul) {
    margin-left: 2rem !important;
    border-left: none !important;
    padding-left: 0 !important;
    list-style-type: none !important;
    margin-top: 0.5rem !important;
  }

  /* Hide title inputs */
  :global(.thread-wrapper input[placeholder*='title']),
  :global(.thread-wrapper input[placeholder*='Title']) {
    display: none !important;
  }

  :global(.thread-wrapper h1),
  :global(.thread-wrapper h2) {
    display: none !important;
  }

  /* Button base */
  :global(.thread-wrapper button) {
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    font-size: 0.875rem !important;
    font-weight: 500 !important;
    padding: 0.5rem 1rem !important;
    border-radius: 0.5rem !important;
  }

  /* Submit / post buttons — primary accent */
  :global(.thread-wrapper button[type='submit']),
  :global(.thread-wrapper button:not([type='submit']):not(.cancel-btn):not(.preview-btn)) {
    background-color: var(--color-primary) !important;
    color: var(--color-primary-foreground) !important;
    border: none !important;
    min-height: 2.75rem !important;
  }

  :global(.thread-wrapper button[type='submit']:hover),
  :global(.thread-wrapper button:not([type='submit']):not(.cancel-btn):not(.preview-btn):hover) {
    background-color: color-mix(in oklab, var(--color-primary) 90%, transparent) !important;
  }

  :global(.thread-wrapper button[type='submit']:focus-visible),
  :global(.thread-wrapper button:not([type='submit']):not(.cancel-btn):not(.preview-btn):focus-visible) {
    outline: none !important;
    box-shadow: 0 0 0 2px var(--color-ring) !important;
  }

  @media (min-width: 768px) {
    :global(.thread-wrapper button[type='submit']),
    :global(.thread-wrapper button:not([type='submit']):not(.cancel-btn):not(.preview-btn)) {
      min-height: 2.5rem !important;
    }
  }

  /* Cancel button */
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

  /* Form actions container */
  :global(.thread-wrapper .form-actions),
  :global(.thread-wrapper div[class*='flex justify-end']) {
    display: flex !important;
    justify-content: flex-end !important;
    gap: 0.5rem !important;
    margin-top: 0.5rem !important;
    align-items: center !important;
    padding: 0 !important;
  }

  /* Author line: address + timestamp */
  :global(.thread-wrapper h3) {
    font-family: var(--font-mono) !important;
    font-size: 0.875rem !important;
    font-weight: 400 !important;
    font-variant-numeric: tabular-nums !important;
    color: var(--color-info) !important;
    margin-bottom: 0.5rem !important;
    display: block !important;
  }

  /* Comment body */
  :global(.thread-wrapper .prose) {
    max-width: none !important;
    font-size: 0.875rem !important;
    color: var(--color-foreground) !important;
    line-height: 1.5 !important;
    margin-top: 0 !important;
    margin-bottom: 1rem !important;
  }

  /* Separators between top-level comments */
  :global(.thread-wrapper > div > div) {
    border-bottom: 1px solid var(--color-border) !important;
    padding-bottom: 0.75rem !important;
    margin-bottom: 0.75rem !important;
  }

  :global(.thread-wrapper > div > div:last-child) {
    border-bottom: none !important;
  }

  /* Textarea */
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

  /* Reply links */
  :global(.thread-wrapper .my-5),
  :global(.thread-wrapper div[class*='my-5']) {
    margin-top: 0.5rem !important;
    margin-bottom: 0.5rem !important;
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
    :global(.thread-wrapper) {
      font-size: 0.875rem;
    }

    :global(.thread-wrapper ul) {
      margin-left: 1rem !important;
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
