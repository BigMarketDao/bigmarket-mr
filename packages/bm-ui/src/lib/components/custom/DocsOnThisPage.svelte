<script lang="ts">
	export type DocsTocItem = {
		id: string;
		title: string;
	};

	let {
		items,
		activeId
	}: {
		items: DocsTocItem[];
		activeId: string | null;
	} = $props();
</script>

{#if items.length > 0}
	<nav aria-label="On this page" class="hidden xl:block">
		<p class="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
			On this page
		</p>
		<ul class="relative space-y-0.5 border-l border-border">
			{#each items as item (item.id)}
				<li>
					<a
						href="#{item.id}"
						class={`block border-l-2 -ml-px py-2 pl-4 text-sm leading-snug transition-[color,border-color] duration-200 ${
							activeId === item.id
								? 'border-primary font-medium text-foreground'
								: 'border-transparent text-muted-foreground hover:border-border/80 hover:text-foreground'
						}`}
					>
						{item.title}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}
