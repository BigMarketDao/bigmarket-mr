<script lang="ts">
	let {
		title,
		excerpt,
		topics = [],
		href
	}: {
		title: string;
		excerpt: string;
		topics?: string[];
		href: string;
	} = $props();
</script>

<a
	{href}
	class="group flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
>
	<h3
		class="text-lg font-semibold text-foreground transition-colors group-hover:text-primary"
	>
		{title}
	</h3>
	<p class="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{excerpt}</p>
	{#if topics.length > 0}
		<div class="mt-4 border-t border-border pt-4">
			<p class="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
				What you&apos;ll learn
			</p>
			<ul class="space-y-1">
				{#each topics as topic (topic)}
					<li class="text-sm text-foreground/80 before:mr-2 before:text-primary before:content-['•']">
						{topic}
					</li>
				{/each}
			</ul>
		</div>
	{/if}
	<span class="mt-4 text-xs font-semibold tracking-wide text-primary uppercase">
		Read article →
	</span>
</a>
