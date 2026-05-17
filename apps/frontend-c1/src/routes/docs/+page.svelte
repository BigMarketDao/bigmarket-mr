<script lang="ts">
	import { buildDocHref, startHerePath } from '$lib/content/docs-nav';
	import { BookOpen, Layers, TrendingUp, Droplets } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const sectionIcons: Record<string, typeof BookOpen> = {
		'getting-started': BookOpen,
		'core-concepts': Layers,
		trading: TrendingUp,
		liquidity: Droplets
	};
</script>

<svelte:head>
	<title>Documentation | BigMarket</title>
	<meta
		name="description"
		content="Learn how BigMarket works — prediction markets, trading, liquidity, and governance."
	/>
</svelte:head>

<div class="mx-auto max-w-4xl">
	<header class="mb-12">
		<p class="text-xs font-semibold tracking-wide text-primary uppercase">BigMarket Docs</p>
		<h1 class="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
			Documentation
		</h1>
		<p class="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
			Everything you need to trade, provide liquidity, and participate in DAO-governed prediction
			markets on Bitcoin-settled Stacks.
		</p>
	</header>

	<section class="mb-14">
		<h2 class="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
			Start here
		</h2>
		<ol class="grid gap-3 sm:grid-cols-3">
			{#each startHerePath as step, i (step.href)}
				<li>
					<a
						href={step.href}
						class="flex h-full flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
					>
						<span class="text-xs font-semibold text-primary">Step {i + 1}</span>
						<span class="mt-1 font-medium text-foreground">{step.title}</span>
					</a>
				</li>
			{/each}
		</ol>
	</section>

	<section>
		<h2 class="mb-6 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
			Browse by topic
		</h2>
		<div class="grid gap-6 sm:grid-cols-2">
			{#each data.docsNav as section (section.slug)}
				{@const Icon = sectionIcons[section.slug] ?? BookOpen}
				<a
					href="/docs/{section.slug}"
					class="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
				>
					<div
						class="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary"
					>
						<Icon class="h-5 w-5" />
					</div>
					<h3 class="text-lg font-semibold text-foreground group-hover:text-primary">
						{section.title}
					</h3>
					<p class="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
						{section.description}
					</p>
					<p class="mt-4 text-xs text-muted-foreground">
						{section.pages.length} articles
					</p>
					<span class="mt-2 text-xs font-semibold tracking-wide text-primary uppercase">
						Explore section →
					</span>
				</a>
			{/each}
		</div>
	</section>

	<section class="mt-14 rounded-xl border border-border bg-muted/30 p-6">
		<h2 class="text-sm font-semibold text-foreground">Looking for a specific topic?</h2>
		<ul class="mt-3 grid gap-2 sm:grid-cols-2">
			{#each data.docsNav as section (section.slug + '-links')}
				{#each section.pages as page (page.slug)}
					<li>
						<a
							href={buildDocHref(section.slug, page.slug)}
							class="text-sm text-muted-foreground transition-colors hover:text-primary"
						>
							{page.title}
						</a>
					</li>
				{/each}
			{/each}
		</ul>
	</section>
</div>
