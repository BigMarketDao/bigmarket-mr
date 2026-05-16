<script lang="ts">
	import { resolve } from '$app/paths';
	import CurrencyDropdown from '$lib/components/template/CurrencyDropdown.svelte';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
	import { daoLink, footerNavSections } from '$lib/core/tools/site';

	const currentYear = new Date().getFullYear();
	const appConfig = $derived(requireAppConfig($appConfigStore));

	// Derive footer sections from shared config and inject the DAO link to Quick Links
	const footerSections = $derived(
		footerNavSections.map((section) => {
			if (section.title === 'Quick Links') {
				return {
					...section,
					links: [{ href: daoLink, label: 'BigMarket DAO' }, ...section.links]
				};
			}
			return section;
		})
	);
</script>

<footer class="border-t border-border bg-background">
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 gap-8 md:grid-cols-4">
			<!-- Brand + Copyright -->
			<div class="space-y-4">
				<a href={resolve('/')} class="group flex items-center gap-3">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-sm transition-colors group-hover:bg-accent/90"
					>
						<span class="text-sm font-bold">BM</span>
					</div>
					<span class="text-xl font-bold text-foreground"
						>{appConfig.VITE_PUBLIC_APP_NAME}</span
					>
				</a>
				<p class="text-sm text-muted-foreground">
					&copy; {currentYear}
					{appConfig.VITE_PUBLIC_APP_NAME}. All rights reserved.
				</p>
			</div>

			<!-- Link groups -->
			{#each footerSections as section (section.title)}
				<div class="space-y-4">
					<h3 class="text-sm font-semibold text-foreground">{section.title}</h3>
					<div class="flex flex-col gap-2">
						{#each section.links as link (link.href + link.label)}
							{#if link.external}
								<a
									href={link.href}
									target="_blank"
									rel="noopener noreferrer"
									class="text-sm text-muted-foreground transition-colors hover:text-accent"
								>
									{link.label}
								</a>
							{:else}
								<a
									href={resolve(link.href as '/')}
									class="text-sm text-muted-foreground transition-colors hover:text-accent"
								>
									{link.label}
								</a>
							{/if}
						{/each}
					</div>
				</div>
			{/each}

			<!-- Currency -->
			<div class="space-y-4">
				<h3 class="text-sm font-semibold text-foreground">Local Currency</h3>
				<CurrencyDropdown position="up" />
			</div>
		</div>
	</div>
</footer>
