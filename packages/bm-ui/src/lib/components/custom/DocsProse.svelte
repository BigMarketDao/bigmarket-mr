<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, html }: { children?: Snippet; html?: string } = $props();
</script>

<div
	class="docs-prose prose prose-neutral max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-lg prose-p:leading-relaxed prose-p:text-foreground/90 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-li:text-foreground/90 prose-hr:border-border prose-table:border prose-th:border prose-th:bg-muted/50 prose-th:p-2 prose-td:border prose-td:p-2 prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:before:content-none prose-code:after:content-none"
>
	{#if html}
		{@html html}
	{:else if children}
		{@render children()}
	{/if}
</div>
