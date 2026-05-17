<script lang="ts">
	import { resolve } from '$app/paths';
	import CurrencyDropdown from '$lib/components/template/CurrencyDropdown.svelte';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
	import { footerNavSections } from '$lib/core/tools/site';

	const currentYear = new Date().getFullYear();
	const appConfig = $derived(requireAppConfig($appConfigStore));

	const networkLabel = $derived(
		appConfig.VITE_NETWORK === 'testnet'
			? appConfig.VITE_NETWORK.toUpperCase()
			: appConfig.VITE_NETWORK === 'mainnet'
				? 'MAINNET'
				: 'ALPHA'
	);
</script>

<footer class="bg-muted/40">
	<div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
		<div class="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-10">
			<!-- Brand -->
			<div class="col-span-2 sm:col-span-3 lg:col-span-2">
				<a href={resolve('/')} class="group inline-flex items-center gap-3">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-sm transition-colors group-hover:bg-accent/90"
					>
						<span class="text-sm font-bold">BM</span>
					</div>
					<span class="text-lg font-bold text-foreground">{appConfig.VITE_PUBLIC_APP_NAME}</span>
				</a>
			</div>

			<!-- Link columns -->
			{#each footerNavSections as section (section.title)}
				<div class="space-y-3">
					<h3 class="text-xs font-semibold tracking-wide text-foreground uppercase">
						{section.title}
					</h3>
					<ul class="flex flex-col gap-2">
						{#each section.links as link (link.href + link.label)}
							<li>
								{#if link.external}
									<a
										href={link.href}
										target="_blank"
										rel="noopener noreferrer"
										class="text-sm text-muted-foreground transition-colors hover:text-foreground"
									>
										{link.label}
									</a>
								{:else}
									<a
										href={resolve(link.href as '/')}
										class="text-sm text-muted-foreground transition-colors hover:text-foreground"
									>
										{link.label}
									</a>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>

		<!-- Bottom bar -->
		<div class="mt-10 space-y-3 border-t border-border pt-6">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
					<span>&copy; {currentYear} BigMarket</span>
					<span class="hidden text-border sm:inline" aria-hidden="true">·</span>
					<a href={resolve('/docs/terms')} class="transition-colors hover:text-foreground">
						Terms
					</a>
					<span aria-hidden="true">·</span>
					<a href={resolve('/docs/privacy')} class="transition-colors hover:text-foreground">
						Privacy
					</a>
				</div>

				<div class="flex flex-wrap items-center gap-4 sm:justify-end">
					<span
						class="rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground"
					>
						{networkLabel}
					</span>
					<div class="flex items-center gap-2">
						<span class="text-xs text-muted-foreground">Currency</span>
						<CurrencyDropdown position="up" />
					</div>
				</div>
			</div>

			<p class="text-[11px] leading-relaxed text-muted-foreground/80">
				Bitcoin prediction markets built on Stacks. Trade outcomes, earn reputation, govern the DAO.
			</p>
		</div>
	</div>
</footer>
