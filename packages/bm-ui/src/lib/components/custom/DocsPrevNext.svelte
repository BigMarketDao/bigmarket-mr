<script lang="ts">
	export type DocsNavLink = {
		title: string;
		href: string;
		direction: 'prev' | 'next';
	};

	let { prev, next }: { prev: DocsNavLink | null; next: DocsNavLink | null } = $props();
</script>

{#if prev || next}
	<nav
		aria-label="Documentation pagination"
		class="mt-12 grid gap-4 border-t border-border pt-8 sm:grid-cols-2"
	>
		{#if prev}
			<a
				href={prev.href}
				class="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
			>
				<span class="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
					>Previous</span
				>
				<p class="mt-1 text-sm font-medium text-foreground group-hover:text-primary">
					← {prev.title}
				</p>
			</a>
		{:else}
			<div></div>
		{/if}
		{#if next}
			<a
				href={next.href}
				class="group rounded-lg border border-border bg-card p-4 text-right transition-colors hover:border-primary/40 hover:bg-muted/30 sm:col-start-2"
			>
				<span class="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
					>Next</span
				>
				<p class="mt-1 text-sm font-medium text-foreground group-hover:text-primary">
					{next.title} →
				</p>
			</a>
		{/if}
	</nav>
{/if}
