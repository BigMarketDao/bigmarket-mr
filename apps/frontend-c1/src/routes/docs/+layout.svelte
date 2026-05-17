<script lang="ts">
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import { buildDocHref } from '$lib/content/docs-nav';
	import { DocsSidebar } from '@bigmarket/bm-ui';
	import { Menu, X } from 'lucide-svelte';
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const isLegalPage = $derived(
		page.url.pathname === '/docs/terms' || page.url.pathname === '/docs/privacy'
	);

	const sidebarSections = $derived(
		data.docsNav.map((section) => ({
			slug: section.slug,
			title: section.title,
			pages: section.pages.map((p) => ({
				slug: p.slug,
				title: p.title,
				href: buildDocHref(section.slug, p.slug)
			}))
		}))
	);

	const pathMatch = $derived(page.url.pathname.match(/^\/docs\/([^/]+)(?:\/([^/]+))?/));
	const currentSection = $derived(pathMatch?.[1] ?? null);
	const currentPage = $derived(pathMatch?.[2] ?? null);

	let mobileOpen = $state(false);

	afterNavigate(() => {
		mobileOpen = false;
	});
</script>

{#if isLegalPage}
	{@render children()}
{:else}
	<div class="bg-background">
		<a
			href="#docs-main"
			class="sr-only focus:not-sr-only focus:absolute focus:top-20 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
		>
			Skip to content
		</a>

		<div class="mx-auto flex max-w-7xl">
			<aside
				class="hidden w-60 shrink-0 border-r border-border lg:block"
				aria-label="Documentation sidebar"
			>
				<div class="sticky top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto px-3 py-8">
					<a
						href="/docs"
						class="mb-6 block px-3 text-sm font-semibold text-foreground transition-colors hover:text-primary"
					>
						Documentation
					</a>
					<DocsSidebar
						sections={sidebarSections}
						{currentSection}
						{currentPage}
					/>
				</div>
			</aside>

			{#if mobileOpen}
				<button
					type="button"
					class="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
					aria-label="Close documentation menu"
					onclick={() => (mobileOpen = false)}
				></button>
				<aside
					class="fixed top-16 left-0 z-50 h-[calc(100dvh-4rem)] w-72 overflow-y-auto border-r border-border bg-background px-3 py-6 shadow-lg lg:hidden"
				>
					<DocsSidebar
						sections={sidebarSections}
						{currentSection}
						{currentPage}
						onNavigate={() => (mobileOpen = false)}
					/>
				</aside>
			{/if}

			<div class="min-w-0 flex-1">
				<div
					class="sticky top-16 z-30 flex items-center gap-3 bg-background/95 px-4 py-3 backdrop-blur-sm lg:hidden"
				>
					<button
						type="button"
						class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
						aria-expanded={mobileOpen}
						onclick={() => (mobileOpen = !mobileOpen)}
					>
						{#if mobileOpen}
							<X class="h-4 w-4" />
						{:else}
							<Menu class="h-4 w-4" />
						{/if}
					</button>
					<span class="text-sm font-medium text-foreground">Documentation</span>
				</div>

				<div id="docs-main" class="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
					{@render children()}
				</div>
			</div>
		</div>
	</div>
{/if}
