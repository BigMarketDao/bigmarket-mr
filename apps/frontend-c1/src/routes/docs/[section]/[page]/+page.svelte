<script lang="ts">
	import { onMount } from 'svelte';
	import {
		DocsBreadcrumb,
		DocsOnThisPage,
		DocsPrevNext,
		DocsProse
	} from '@bigmarket/bm-ui';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let activeId = $state<string | null>(null);

	const sectionIds = $derived(data.doc.sections.map((s) => s.id));

	$effect.pre(() => {
		activeId = sectionIds[0] ?? null;
	});

	onMount(() => {
		const scrollOffset = 96;

		const updateActive = () => {
			if (sectionIds.length === 0) return;

			let current = sectionIds[0]!;
			for (const id of sectionIds) {
				const el = document.getElementById(id);
				if (el && el.getBoundingClientRect().top <= scrollOffset) {
					current = id;
				}
			}
			if (activeId !== current) {
				activeId = current;
			}
		};

		const onHashChange = () => {
			const hash = window.location.hash.slice(1);
			if (hash && sectionIds.includes(hash)) {
				activeId = hash;
			}
		};

		updateActive();
		window.addEventListener('scroll', updateActive, { passive: true });
		window.addEventListener('resize', updateActive, { passive: true });
		window.addEventListener('hashchange', onHashChange);

		return () => {
			window.removeEventListener('scroll', updateActive);
			window.removeEventListener('resize', updateActive);
			window.removeEventListener('hashchange', onHashChange);
		};
	});
</script>

<svelte:head>
	<title>{data.doc.title} | BigMarket Docs</title>
	<meta name="description" content={data.doc.lede} />
</svelte:head>

<div class="mx-auto flex max-w-6xl gap-10">
	<article class="min-w-0 flex-1 max-w-3xl">
		<DocsBreadcrumb
			items={[
				{ label: 'Docs', href: '/docs' },
				{ label: data.section.title, href: `/docs/${data.section.slug}` },
				{ label: data.page.title }
			]}
		/>

		<header class="mb-8 border-b border-border pb-8">
			<h1 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
				{data.doc.title}
			</h1>
			{#if data.doc.subtitle}
				<p class="mt-3 text-lg text-muted-foreground">{data.doc.subtitle}</p>
			{/if}
			{#if data.doc.lede && data.doc.lede !== data.doc.subtitle}
				<p class="mt-4 text-base leading-relaxed text-foreground/85">{data.doc.lede}</p>
			{/if}
		</header>

		<DocsProse html={data.doc.html} />

		<DocsPrevNext prev={data.prev} next={data.next} />
	</article>

	<aside class="hidden w-52 shrink-0 xl:block">
		<div class="sticky top-24">
			<DocsOnThisPage items={data.doc.sections} {activeId} />
		</div>
	</aside>
</div>
