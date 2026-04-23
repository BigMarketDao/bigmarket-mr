<script lang="ts">
  import { marked } from 'marked';
  import type { AuthenticatedForumContent } from '@bigmarket/sip18-forum-types';
  import NewMessageCard from './NewMessageCard.svelte';
  import MessageCard from './MessageCard.svelte'; // self-import for recursion
  import { getPreferredLinkedAccount, verifyPost } from '../utils/forum_helper';
  import { onMount } from 'svelte';
  import { getBnsNameFromAddress, getStxAddress } from '../utils/forum_helper';
  import type { Classes, Config } from '../utils/forum_helper';
  import { ShieldCheck, StopCircle } from '@lucide/svelte';

  export let config: Config;
  // the first message IS the thread - this gets replaces by replies so we keep the main thread
  // for refreshing the tree.
  export let thread: AuthenticatedForumContent;
  export let message: AuthenticatedForumContent;
  export let onReload: (data: string) => void;
  export let classes: Classes = {};
  export let isConnected: boolean;
  const defaultTitle = 'text-primary-500 text-sm font-semibold';
  const defaultContainer = 'ml-4 border-l border-gray-200 pl-4';
  const defaultAuthor = 'text-xs text-gray-700 font-medium';
  const defaultIconSuccess = 'text-green-500';
  const defaultIconError = 'text-red-500';
  const defaultBody = 'prose prose-sm text-gray-200';

  let verified = false;
  let identifier: string;
  let displayName: string | undefined;
  const handleReload = async (data: any) => {
    onReload(data);
  };

  onMount(async () => {
    verified = verifyPost(config, message);
    const preferedAccount = getPreferredLinkedAccount(message.forumContent.linkedAccounts);
    identifier = preferedAccount?.identifier || (await getStxAddress());
    displayName = await getBnsNameFromAddress(config.VITE_FORUM_API, await getStxAddress());
  });
</script>

<div
  class={`${classes.messageCard?.container || defaultContainer} ml-${(message.forumContent.level - 1) * 1.5}`}
>
  {#if message.forumContent.level === 1}
    <h2 class={classes.messageCard?.title || defaultTitle}>
      {@html message.forumContent.title}
    </h2>
  {/if}
  <h3 class={classes.messageCard?.author || defaultAuthor}>
    {#if verified}<ShieldCheck
        class={`${classes.messageCard?.iconSuccess || defaultIconSuccess} inline-block`}
        width={15}
        height={15}
      />{:else}<StopCircle
        class={`${classes.messageCard?.iconError || defaultIconError} inline-block`}
        width={15}
        height={15}
      />{/if}
    {displayName || identifier}
  </h3>
  <div class={classes.messageCard?.body || defaultBody}>
    {#if message.forumContent.title?.length}<div>{message.forumContent.title}</div>{/if}
    <div>{@html marked(message.forumContent.content)}</div>
  </div>

  <!-- 
		Optional reply form: messageBoardId is a container/board for messages. 
	 	Threads are top level messsages (level=1 and parentId=maessageBoardId).
	 	Messages and replies are identical - they are displayed recursively using level and parentId.
	-->
  <NewMessageCard
    {config}
    {isConnected}
    messageBoardId={message.forumContent.messageBoardId}
    parentId={message.forumContent.messageId}
    threadId={thread.forumContent.messageId}
    level={message.forumContent.level + 1}
    onReload={handleReload}
  />

  <!-- Recursively render replies -->
  {#if message?.forumContent.replies?.length}
    <ul class="mt-4 space-y-4">
      {#each message.forumContent.replies as reply}
        <MessageCard {config} {isConnected} {thread} message={reply} onReload={handleReload} />
      {/each}
    </ul>
  {/if}
</div>
