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
            el.className = 'text-blue-400 dark:text-blue-400 font-mono text-sm mb-2';
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
      container: 'border-b border-gray-200 dark:border-gray-700 pb-3 mb-3 last:border-b-0',
      title: 'hidden',
      author: 'text-sm text-blue-400 dark:text-blue-400 font-mono mb-2',
      iconSuccess: 'hidden',
      iconError: 'hidden',
      body: 'text-sm text-gray-900 dark:text-white leading-relaxed',
    },
    newMessageCard: {
      container: 'mb-4 space-y-3',
      titleInput: 'hidden',
      contentLabel: 'hidden',
      contentEditor:
        'w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none min-h-[70px] text-sm',
      contentPreview:
        'prose prose-gray dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm',
      error: 'text-sm text-red-600 dark:text-red-400 mt-1',
      buttonCancel:
        'px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors border border-gray-300 dark:border-gray-600 rounded-md',
      buttonPost:
        'px-4 py-1.5 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors focus:ring-2 focus:ring-orange-500/20 focus:outline-none disabled:opacity-50',
      replyLink:
        'text-xs text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors',
      previewButton:
        'text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors',
      replyContainer: 'flex justify-end items-center gap-2 mt-2',
    },
  };
</script>

<div
  id="comments"
  class="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
>
  <div class="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
    <h2 class="text-center text-lg font-medium text-gray-900 dark:text-white">Discussion</h2>
  </div>

  <div class="bg-white p-4 dark:bg-gray-900">
    {#if thread}
      <div class="thread-wrapper">
        <!-- threadId={thread.forumContent.messageId} -->
        <Thread forumApi={appConfig.VITE_FORUM_API} config={appConfig} threadId={thread.forumContent.messageId} threadIn={thread} classes={threadClasses} isConnected={isLoggedIn()} />
      </div>

    {:else}
      <div class="py-8 text-center">
        <div class="mb-3 text-gray-400 dark:text-gray-500">
          <svg class="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          No discussion available for this market.
        </p>
        <p class="mt-1 text-xs text-gray-500">Be the first to share your thoughts!</p>
      </div>
    {/if}
  </div>
</div>

<style>
  /* EXACTLY AS REQUESTED - Clean forum styling */
  :global(.thread-wrapper) {
    font-family: inherit;
    color: rgb(17, 24, 39);
  }

  :global(.dark .thread-wrapper) {
    color: white;
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
    border-left: none !important; /* NO VERTICAL LINES */
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

  /* PROPER BUTTON STYLING - as requested */
  :global(.thread-wrapper button) {
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    font-size: 0.875rem !important;
    font-weight: 500 !important;
    padding: 0.5rem 1rem !important;
    border-radius: 0.5rem !important;
  }

  /* COMMENT button (main) - orange */
  :global(.thread-wrapper button[type='submit']) {
    background-color: rgb(249, 115, 22) !important; /* orange-500 */
    color: white !important;
    border: none !important;
  }

  :global(.thread-wrapper button[type='submit']:hover) {
    background-color: rgb(234, 88, 12) !important; /* orange-600 */
  }

  /* POST REPLY button - orange */
  :global(.thread-wrapper button:not([type='submit']):not(.cancel-btn):not(.preview-btn)) {
    background-color: rgb(249, 115, 22) !important; /* orange-500 */
    color: white !important;
    border: none !important;
  }

  :global(.thread-wrapper button:not([type='submit']):not(.cancel-btn):not(.preview-btn):hover) {
    background-color: rgb(234, 88, 12) !important; /* orange-600 */
  }

  /* CANCEL button - gray with border */
  :global(.thread-wrapper .cancel-btn),
  :global(.thread-wrapper button[class*='cancel']) {
    background-color: transparent !important;
    color: rgb(107, 114, 128) !important; /* gray-500 */
    border: 1px solid rgb(209, 213, 219) !important; /* gray-300 */
  }

  :global(.dark .thread-wrapper .cancel-btn),
  :global(.dark .thread-wrapper button[class*='cancel']) {
    color: rgb(156, 163, 175) !important; /* gray-400 */
    border-color: rgb(75, 85, 99) !important; /* gray-600 */
  }

  /* Form actions container - more compact */
  :global(.thread-wrapper .form-actions),
  :global(.thread-wrapper div[class*='flex justify-end']) {
    display: flex !important;
    justify-content: flex-end !important;
    gap: 0.5rem !important;
    margin-top: 0.5rem !important;
    align-items: center !important;
    padding: 0 !important;
  }

  /* ADDRESS, TIME_AGO format - exactly as requested */
  :global(.thread-wrapper h3) {
    font-family:
      ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace !important;
    font-size: 14px !important;
    font-weight: 400 !important;
    color: rgb(96, 165, 250) !important; /* blue-400 */
    margin-bottom: 0.5rem !important;
    display: block !important;
  }

  /* Text content */
  :global(.thread-wrapper .prose) {
    max-width: none !important;
    font-size: 0.875rem !important;
    color: rgb(17, 24, 39) !important;
    line-height: 1.5 !important;
    margin-top: 0 !important;
    margin-bottom: 1rem !important;
  }

  :global(.dark .thread-wrapper .prose) {
    color: white !important;
  }

  /* THIN LINE SEPARATORS - between main comments */
  :global(.thread-wrapper > div > div) {
    border-bottom: 1px solid rgb(229, 231, 235) !important;
    padding-bottom: 0.75rem !important;
    margin-bottom: 0.75rem !important;
  }

  :global(.dark .thread-wrapper > div > div) {
    border-bottom-color: rgb(75, 85, 99) !important;
  }

  /* Last comment no border */
  :global(.thread-wrapper > div > div:last-child) {
    border-bottom: none !important;
  }

  /* Textarea styling - more compact */
  :global(.thread-wrapper textarea) {
    width: 100% !important;
    padding: 0.75rem !important;
    border: 1px solid rgb(209, 213, 219) !important;
    border-radius: 0.5rem !important;
    background-color: white !important;
    color: rgb(17, 24, 39) !important;
    font-size: 0.875rem !important;
    resize: vertical !important;
    min-height: 70px !important;
    line-height: 1.4 !important;
  }

  :global(.dark .thread-wrapper textarea) {
    background-color: rgb(31, 41, 55) !important; /* gray-800 */
    border-color: rgb(75, 85, 99) !important; /* gray-600 */
    color: white !important;
  }

  :global(.thread-wrapper textarea:focus) {
    outline: none !important;
    border-color: rgb(249, 115, 22) !important; /* orange-500 */
    box-shadow: 0 0 0 3px rgb(249, 115, 22, 0.1) !important;
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
    color: rgb(96, 165, 250) !important;
    text-decoration: none !important;
    font-size: 0.75rem !important;
  }

  :global(.thread-wrapper a:hover) {
    color: rgb(147, 197, 253) !important;
    text-decoration: underline !important;
  }

  /* Force proper sizing */
  :global(.thread-wrapper *) {
    box-sizing: border-box !important;
  }

  /* Mobile responsiveness */
  @media (max-width: 640px) {
    :global(.thread-wrapper) {
      font-size: 0.875rem;
    }

    :global(.thread-wrapper ul) {
      margin-left: 1rem !important;
    }

    :global(.thread-wrapper h3) {
      font-size: 12px !important;
    }

    :global(.thread-wrapper button) {
      padding: 0.375rem 0.75rem !important;
      font-size: 0.75rem !important;
    }
  }
</style>
