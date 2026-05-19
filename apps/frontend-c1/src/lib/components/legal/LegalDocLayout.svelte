<script lang="ts">
	import { resolve } from '$app/paths';
	import { DocsProse } from '@bigmarket/bm-ui';
	import { ArrowLeft } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		lastUpdated = 'May 2026',
		children
	}: {
		title: string;
		description?: string;
		lastUpdated?: string;
		children: Snippet;
	} = $props();
</script>

<svelte:head>
	<title>{title} | BigMarket</title>
	{#if description}
		<meta name="description" content={description} />
	{/if}
</svelte:head>

<div class="min-h-[calc(100dvh-8rem)] bg-background">
	<div class="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
		<a
			href={resolve('/')}
			class="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
		>
			<ArrowLeft class="h-4 w-4" aria-hidden="true" />
			Back to BigMarket
		</a>

		<header class="mb-10 border-b border-border pb-8">
			<p class="text-xs font-semibold tracking-widest text-primary uppercase">Legal</p>
			<h1 class="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
			{#if description}
				<p class="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>
			{/if}
			<p class="mt-4 text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
		</header>

		<DocsProse>
			{@render children()}
		</DocsProse>
	</div>
</div>
