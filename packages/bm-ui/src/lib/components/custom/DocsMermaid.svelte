<script lang="ts">
	import { onMount } from 'svelte';

	let {
		chart,
		caption
	}: {
		chart: string;
		caption?: string;
	} = $props();

	let container = $state<HTMLDivElement | null>(null);
	let renderError = $state<string | null>(null);

	function getMermaidTheme(): 'dark' | 'neutral' {
		if (typeof document === 'undefined') return 'neutral';
		return document.documentElement.classList.contains('dark') ? 'dark' : 'neutral';
	}

	onMount(() => {
		let cancelled = false;

		(async () => {
			try {
				const { default: mermaid } = await import('mermaid');
				if (cancelled || !container) return;

				const id = `docs-mermaid-${crypto.randomUUID().replace(/-/g, '')}`;
				mermaid.initialize({
					startOnLoad: false,
					theme: getMermaidTheme(),
					securityLevel: 'strict',
					fontFamily: 'inherit'
				});

				const { svg } = await mermaid.render(id, chart);
				if (!cancelled && container) {
					container.innerHTML = svg;
				}
			} catch (err) {
				if (!cancelled) {
					renderError = err instanceof Error ? err.message : 'Could not render diagram';
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	});
</script>

<figure
	class="docs-diagram not-prose my-8 overflow-hidden rounded-xl border border-border bg-muted/30"
	aria-label={caption ?? 'Documentation diagram'}
>
	<div
		bind:this={container}
		class="flex min-h-[4rem] justify-center overflow-x-auto p-4 [&_svg]:max-w-none"
		role="img"
	></div>
	{#if renderError}
		<p class="border-t border-border px-4 py-3 text-sm text-destructive">{renderError}</p>
	{/if}
	{#if caption}
		<figcaption class="border-t border-border/60 px-4 py-3 text-center text-sm text-muted-foreground italic">
			{caption}
		</figcaption>
	{/if}
</figure>
