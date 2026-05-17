<script lang="ts">
	export type DocsBreadcrumbItem = {
		label: string;
		href?: string;
	};

	let { items }: { items: DocsBreadcrumbItem[] } = $props();
</script>

<nav aria-label="Breadcrumb" class="mb-6">
	<ol class="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
		{#each items as item, i (item.label + (item.href ?? ''))}
			{#if i > 0}
				<li aria-hidden="true" class="text-border">/</li>
			{/if}
			<li>
				{#if item.href}
					<a href={item.href} class="transition-colors hover:text-foreground">{item.label}</a>
				{:else}
					<span class="text-foreground" aria-current="page">{item.label}</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
