<script lang="ts">
	import { DocsBreadcrumb, DocsSectionCard } from '@bigmarket/bm-ui';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const recommendedPaths: Record<string, string[]> = {
		'getting-started': ['overview', 'bigmarket-101'],
		trading: ['quickstart', 'participating-in-markets', 'fees-and-payouts']
	};

	const recommended = $derived(
		(recommendedPaths[data.section.slug] ?? [])
			.map((slug) => data.pages.find((p) => p.slug === slug))
			.filter((p): p is (typeof data.pages)[number] => p !== undefined)
	);
</script>

<svelte:head>
	<title>{data.section.title} | BigMarket Docs</title>
</svelte:head>

<div class="mx-auto max-w-4xl">
	<DocsBreadcrumb
		items={[
			{ label: 'Docs', href: '/docs' },
			{ label: data.section.title }
		]}
	/>

	<header class="mb-10">
		<p class="text-xs font-semibold tracking-wide text-primary uppercase">Section</p>
		<h1 class="mt-2 text-3xl font-bold tracking-tight text-foreground">{data.section.title}</h1>
		<p class="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
			{data.section.description}
		</p>
	</header>

	{#if recommended.length > 0}
		<section class="mb-10 rounded-xl border border-border bg-muted/20 p-5">
			<h2 class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
				Recommended path
			</h2>
			<ol class="mt-3 space-y-2">
				{#each recommended as item, i (item.href)}
					<li class="flex items-center gap-2 text-sm">
						<span
							class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
						>
							{i + 1}
						</span>
						<a href={item.href} class="font-medium text-foreground hover:text-primary">
							{item.title}
						</a>
					</li>
				{/each}
			</ol>
		</section>
	{/if}

	<div class="grid gap-6 sm:grid-cols-2">
		{#each data.pages as page (page.slug)}
			<DocsSectionCard
				title={page.title}
				excerpt={page.excerpt}
				topics={page.topics}
				href={page.href}
			/>
		{/each}
	</div>
	</div>
