<script lang="ts">
	import { resolve } from '$app/paths';
	import CurrencyDropdown from '$lib/components/template/CurrencyDropdown.svelte';
	import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';
	import { daoLink, footerNavSections } from '$lib/tools/site';

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

<footer class="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 gap-8 md:grid-cols-4">
			<!-- Brand + Copyright -->
			<div class="space-y-4">
				<a href={resolve('/')} class="group flex items-center gap-3">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white shadow-sm transition-colors group-hover:bg-orange-600"
					>
						<span class="text-sm font-bold">BM</span>
					</div>
					<span class="text-xl font-bold text-gray-900 dark:text-white"
						>{appConfig.VITE_PUBLIC_APP_NAME}</span
					>
				</a>
				<p class="text-sm text-gray-500 dark:text-gray-400">
					&copy; {currentYear}
					{appConfig.VITE_PUBLIC_APP_NAME}. All rights reserved.
				</p>
			</div>

			<!-- Link groups -->
			{#each footerSections as section (section.title)}
				<div class="space-y-4">
					<h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">{section.title}</h3>
					<div class="flex flex-col gap-2">
						{#each section.links as link (link.href + link.label)}
							{#if link.external}
								<a
									href={link.href}
									target="_blank"
									rel="noopener noreferrer"
									class="text-sm text-gray-600 transition-colors hover:text-orange-500 dark:text-gray-400 dark:hover:text-orange-400"
								>
									{link.label}
								</a>
							{:else}
								<a
									href={resolve(link.href as '/')}
									class="text-sm text-gray-600 transition-colors hover:text-orange-500 dark:text-gray-400 dark:hover:text-orange-400"
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
				<h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Local Currency</h3>
				<CurrencyDropdown position="up" />
			</div>
		</div>
	</div>
</footer>
