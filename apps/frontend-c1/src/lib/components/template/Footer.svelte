<script lang="ts">
	import { resolve } from '$app/paths';
	import BigMarketLogo from '$lib/components/template/BigMarketLogo.svelte';
	import CurrencyDropdown from '$lib/components/template/CurrencyDropdown.svelte';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
	import { footerDisclaimer, footerNavSections } from '$lib/core/tools/site';
	import { ExternalLink } from 'lucide-svelte';

	const currentYear = new Date().getFullYear();
	const appConfig = $derived(requireAppConfig($appConfigStore));

	const networkLabel = $derived(
		appConfig.VITE_NETWORK === 'testnet' || appConfig.VITE_NETWORK === 'devnet'
			? appConfig.VITE_NETWORK.toUpperCase()
			: appConfig.VITE_NETWORK === 'mainnet'
				? 'MAINNET'
				: 'ALPHA'
	);

	const legalLinks = [
		{ href: '/docs/terms', label: 'Terms' },
		{ href: '/docs/privacy', label: 'Privacy' },
		{ href: '/docs/license', label: 'License' }
	] as const;

	const scanLines = [
		{ delay: '0s', duration: '14s' },
		{ delay: '-7s', duration: '18s' }
	] as const;
</script>

<footer class="footer-crt relative mt-auto overflow-hidden border-t-2 border-border bg-muted/50">
	<!-- BIG watermark edge-to-edge + subtle retro scan -->
	<div
		class="footer-big-retro pointer-events-none absolute inset-x-0 top-8 bottom-4 z-0"
		aria-hidden="true"
	>
		{#each scanLines as line, i (i)}
			<div
				class="footer-scan-line"
				style="--scan-delay: {line.delay}; --scan-duration: {line.duration};"
			></div>
		{/each}
		<div class="absolute inset-x-0 bottom-0 flex items-end justify-end">
			<p
				class="relative z-[1] max-w-none leading-[0.85] font-black tracking-tighter text-primary/10 select-none"
				style="font-size: clamp(21rem, 66vw, 54rem); margin-right: clamp(0.5rem, 3vw, 2.5rem);"
			>
				BIG
			</p>
		</div>
	</div>

	<div class="relative z-10 mx-auto max-w-7xl px-4 pt-12 pb-6 sm:px-6 sm:pt-14 lg:px-8 lg:pt-16">
		<div class="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4 lg:grid-cols-12 lg:gap-x-10">
			<div class="col-span-2 md:col-span-4 lg:col-span-4">
				<a href={resolve('/')} class="group inline-block">
					<span class="sr-only">BigMarket home</span>
					<BigMarketLogo class="text-2xl sm:text-3xl" />
				</a>
			</div>

			{#each footerNavSections as section (section.title)}
				<div class="col-span-1 md:col-span-1 lg:col-span-2">
					<h3 class="text-sm font-bold tracking-widest text-foreground uppercase">
						{section.title}
					</h3>
					<ul class="mt-4 flex flex-col gap-3">
						{#each section.links as link (link.href + link.label)}
							<li>
								{#if link.external}
									<a
										href={link.href}
										target="_blank"
										rel="noopener noreferrer"
										class="group inline-flex items-center gap-1.5 text-base font-semibold text-foreground/75 transition-colors hover:text-primary"
									>
										{link.label}
										<ExternalLink
											class="h-3.5 w-3.5 shrink-0 opacity-40 group-hover:opacity-80"
											aria-hidden="true"
										/>
									</a>
								{:else}
									<a
										href={resolve(link.href as '/')}
										class="text-base font-semibold text-foreground/75 transition-colors hover:text-primary"
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

		<div class="mt-12 grid gap-8 border-t-2 border-border pt-10 lg:grid-cols-12 lg:gap-10">
			<p
				class="text-sm leading-relaxed font-semibold text-foreground/70 sm:text-base lg:col-span-8"
			>
				{footerDisclaimer}
			</p>

			<div
				class="flex flex-col gap-5 sm:flex-row sm:items-center lg:col-span-4 lg:flex-col lg:items-end"
			>
				<span
					class="inline-flex w-fit items-center rounded-full border-2 border-border bg-background px-3 py-1.5 text-xs font-bold tracking-widest text-foreground uppercase"
				>
					<span class="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true"
					></span>
					{networkLabel}
				</span>
				<div class="flex items-center gap-3">
					<span class="text-sm font-bold text-foreground/80 uppercase">Currency</span>
					<CurrencyDropdown position="up" />
				</div>
			</div>
		</div>

		<!-- Bottom row: same 12-col grid as above -->
		<div
			class="mt-8 grid grid-cols-2 items-center gap-x-8 gap-y-4 border-t-2 border-border pt-8 md:grid-cols-4 lg:grid-cols-12 lg:gap-x-10"
		>
			<p
				class="col-span-2 text-sm font-bold text-foreground/80 sm:text-base md:col-span-2 lg:col-span-4"
			>
				&copy; {currentYear} BigMarket DAO
			</p>
			<nav
				aria-label="Legal"
				class="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-2 md:col-span-2 lg:col-span-8 lg:justify-end"
			>
				{#each legalLinks as link (link.href)}
					<a
						href={resolve(link.href)}
						class="text-sm font-bold tracking-wide text-foreground/75 uppercase transition-colors hover:text-primary sm:text-base"
					>
						{link.label}
					</a>
				{/each}
			</nav>
		</div>
	</div>
</footer>

<style>
	/* Faint CRT mesh over the BIG zone only */
	.footer-big-retro::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		background: repeating-linear-gradient(
			0deg,
			transparent 0px,
			transparent 3px,
			color-mix(in oklch, var(--color-primary) 8%, transparent) 3px,
			color-mix(in oklch, var(--color-primary) 8%, transparent) 4px
		);
		opacity: 0.35;
	}

	.footer-scan-line {
		position: absolute;
		left: 0;
		right: 0;
		z-index: 0;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			color-mix(in oklch, var(--color-primary) 25%, #a855f7 15%) 50%,
			transparent 100%
		);
		opacity: 0.07;
		animation: footer-scan-drift var(--scan-duration, 14s) var(--scan-delay, 0s) ease-in-out
			infinite;
		will-change: top, opacity;
	}

	@keyframes footer-scan-drift {
		0%,
		100% {
			top: 18%;
			opacity: 0.04;
		}
		50% {
			top: 82%;
			opacity: 0.09;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.footer-scan-line {
			animation: none;
			opacity: 0.04;
			top: 40%;
		}

		.footer-big-retro::before {
			opacity: 0.2;
		}
	}
</style>
