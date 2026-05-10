<script lang="ts">
	import WalletMenuTailwind from './WalletMenuTailwind.svelte';
	import { onDestroy, onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';
	import SlotModal from './SlotModal.svelte';
	import { showOnRampModal, userReputationStore } from '@bigmarket/bm-common';
	import { Menu, X, Sun, Moon } from 'lucide-svelte';
	import { truncate } from '@bigmarket/bm-utilities';
	import ConnectLanes from './ConnectLanes.svelte';
	import { getStxAddress, isLoggedIn } from '@bigmarket/bm-common';
	import { disconnectWallet } from '@bigmarket/bm-common';
	import { resolve } from '$app/paths';
	import { mainNavLinks } from '$lib/core/tools/site';
	import { isCoordinator } from '$lib/core/tools/security';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import { PAGE_CONTENT_RAIL } from './headerMenuTailwindLayout';

	const MD_BREAKPOINT_PX = 768;

	let sheetOpen = $state(false);
	let isDarkMode = $state(false);
	let currentPath = $state(page.url.pathname);

	afterNavigate(() => {
		currentPath = page.url.pathname;
		sheetOpen = false;
	});

	const disWallet = async () => {
		await disconnectWallet();
		window.location.reload();
	};

	function closeSheet() {
		sheetOpen = false;
	}

	function checkDarkMode() {
		if (typeof window !== 'undefined') {
			isDarkMode = document.documentElement.classList.contains('dark');
		}
	}

	function toggleDarkMode() {
		if (typeof window !== 'undefined') {
			const html = document.documentElement;
			isDarkMode = !isDarkMode;

			if (isDarkMode) {
				html.classList.add('dark');
				localStorage.theme = 'dark';
			} else {
				html.classList.remove('dark');
				localStorage.theme = 'light';
			}
		}
	}

	function closeModal() {
		showOnRampModal.set(false);
	}

	function handleResize() {
		if (typeof window !== 'undefined' && window.innerWidth >= MD_BREAKPOINT_PX) {
			sheetOpen = false;
		}
	}

	$effect(() => {
		if (typeof document === 'undefined') return;
		document.documentElement.style.overflow = sheetOpen ? 'hidden' : '';
		return () => {
			document.documentElement.style.overflow = '';
		};
	});

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', handleResize);
			checkDarkMode();
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', handleResize);
			document.documentElement.style.overflow = '';
		}
	});

	/** Carbon-style text nav: bottom rule; weight/size aligned with wallet strip */
	const navLinkBase =
		'border-b-2 border-transparent px-4 py-3 text-sm font-semibold tracking-tight text-zinc-700 transition-[color,border-color] duration-150 dark:text-zinc-400';
	const navLinkInactive =
		'hover:border-zinc-400 hover:text-zinc-950 dark:hover:border-zinc-500 dark:hover:text-zinc-50';
	const navLinkActive =
		'border-zinc-900 text-zinc-950 hover:border-zinc-900 dark:border-zinc-50 dark:text-zinc-50 dark:hover:border-zinc-50';
</script>

<header
	class="sticky top-0 z-[999] border-b border-zinc-200 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90"
>
	<div class={PAGE_CONTENT_RAIL}>
		<div class="flex h-16 min-h-16 w-full items-center gap-2 md:gap-4">
			<!-- Start: wordmark -->
			<div class="flex shrink-0 justify-start">
				<a
					href={resolve('/')}
					class="flex max-w-[11rem] items-center gap-2 py-2 text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-50 dark:focus-visible:outline-zinc-200 sm:max-w-none"
					aria-label="BigMarket home"
				>
					<span
						class="flex h-7 w-7 shrink-0 items-center justify-center border border-zinc-900 text-[10px] font-semibold leading-none tracking-tight dark:border-zinc-100"
					>
						BM
					</span>
					<span class="truncate text-sm font-semibold tracking-tight sm:text-base">BigMarket</span>
				</a>
			</div>

			<!-- Center: primary CTAs (desktop) — flex-1 keeps items visually centered between chrome -->
			{#if typeof window !== 'undefined'}
				<nav class="hidden min-w-0 flex-1 justify-center md:flex" aria-label="Primary">
					<ul class="flex max-w-full flex-wrap items-center justify-center gap-x-3 lg:gap-x-5">
						{#each mainNavLinks as nav (nav.href)}
							<li>
								<a
									href={resolve(nav.href as '/')}
									data-sveltekit-preload-data="hover"
									data-sveltekit-preload-code="hover"
									class="{navLinkBase} {currentPath === nav.href ? navLinkActive : navLinkInactive}"
									aria-current={currentPath === nav.href ? 'page' : undefined}
								>
									{nav.label}
								</a>
							</li>
						{/each}
						{#if isLoggedIn()}
							{#if isCoordinator(getStxAddress())}
								<li>
									<a
										href={resolve('/market-mgt')}
										data-sveltekit-preload-data="hover"
										data-sveltekit-preload-code="hover"
										class="{navLinkBase} {currentPath.startsWith('/market-mgt')
											? navLinkActive
											: navLinkInactive}"
										aria-current={currentPath.startsWith('/market-mgt') ? 'page' : undefined}
									>
										Start a Market
									</a>
								</li>
							{/if}
							<li>
								<a
									href={resolve(`/my-markets/${getStxAddress()}`)}
									data-sveltekit-preload-data="hover"
									data-sveltekit-preload-code="hover"
									class="{navLinkBase} {currentPath.startsWith('/my-markets')
										? navLinkActive
										: navLinkInactive}"
									aria-current={currentPath.startsWith('/my-markets') ? 'page' : undefined}
								>
									My Bets
								</a>
							</li>
							<li>
								<a
									href={resolve('/reputation')}
									data-sveltekit-preload-data="hover"
									data-sveltekit-preload-code="hover"
									class="{navLinkBase} {currentPath.startsWith('/reputation')
										? navLinkActive
										: navLinkInactive}"
									aria-current={currentPath.startsWith('/reputation') ? 'page' : undefined}
								>
									Reputation Hub
								</a>
							</li>
						{/if}
					</ul>
				</nav>
			{/if}

			<!-- End: utilities -->
			<div class="ml-auto flex shrink-0 items-center justify-end gap-0.5 sm:gap-1">
				<button
					type="button"
					aria-label="Toggle dark mode"
					class="hidden p-2 text-zinc-600 underline-offset-4 transition-colors hover:text-zinc-950 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-200 md:inline-flex"
					onclick={toggleDarkMode}
				>
					{#if isDarkMode}
						<Sun class="h-5 w-5" strokeWidth={1.5} />
					{:else}
						<Moon class="h-5 w-5" strokeWidth={1.5} />
					{/if}
				</button>

				<div class="hidden md:block">
					<WalletMenuTailwind />
				</div>

				<button
					type="button"
					class="inline-flex p-2 text-zinc-700 underline-offset-4 transition-colors hover:text-zinc-950 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50 dark:focus-visible:outline-zinc-200 md:hidden"
					aria-expanded={sheetOpen}
					aria-controls="header-tw-mobile-sheet"
					onclick={() => (sheetOpen = !sheetOpen)}
				>
					{#if sheetOpen}
						<X class="h-5 w-5" strokeWidth={1.5} />
					{:else}
						<Menu class="h-5 w-5" strokeWidth={1.5} />
					{/if}
				</button>
			</div>
		</div>
	</div>
</header>

{#if sheetOpen}
	<div
		class="fixed inset-0 z-[1000] md:hidden"
		role="dialog"
		aria-modal="true"
		aria-label="Navigation menu"
		transition:fade={{ duration: 160 }}
	>
		<button
			type="button"
			class="absolute inset-0 h-full w-full cursor-default bg-zinc-950/45 backdrop-blur-[3px] motion-safe:transition-opacity"
			onclick={closeSheet}
			aria-label="Close menu"
		></button>
		<aside
			id="header-tw-mobile-sheet"
			class="absolute inset-y-0 right-0 z-[1001] flex w-[min(20rem,92vw)] flex-col gap-5 border-l border-zinc-200/80 bg-zinc-50/95 p-5 shadow-[-12px_0_40px_-8px_rgba(0,0,0,0.18)] backdrop-blur-xl dark:border-zinc-700/80 dark:bg-zinc-900/95 dark:shadow-black/50"
			transition:fly={{ x: 288, duration: 260, easing: cubicOut }}
		>
			<div class="flex items-center justify-between">
				<p class="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Menu</p>
				<button
					type="button"
					class="p-2 text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
					onclick={closeSheet}
					aria-label="Close menu"
				>
					<X class="h-5 w-5" strokeWidth={1.75} />
				</button>
			</div>

			<nav class="flex flex-col" aria-label="Mobile primary">
				<a
					href={resolve('/dao')}
					class="border-b border-zinc-200 py-3 text-sm text-zinc-800 underline-offset-4 transition-colors hover:underline dark:border-zinc-700 dark:text-zinc-100"
					onclick={closeSheet}
				>
					<span class="font-semibold">Community</span>
					<span class="mt-0.5 block text-xs font-normal text-zinc-500 dark:text-zinc-400">Token sale</span>
				</a>
				{#if typeof window !== 'undefined' && isLoggedIn()}
					{#if isCoordinator(getStxAddress())}
						<a
							href={resolve('/market-mgt')}
							class="border-b border-zinc-200 py-3 text-sm font-semibold text-zinc-800 underline-offset-4 transition-colors hover:underline dark:border-zinc-700 dark:text-zinc-100"
							onclick={closeSheet}
						>
							Start a Market
						</a>
					{/if}
					<a
						href={resolve(`/my-markets/${getStxAddress()}`)}
						class="border-b border-zinc-200 py-3 text-sm font-semibold text-zinc-800 underline-offset-4 transition-colors hover:underline dark:border-zinc-700 dark:text-zinc-100"
						onclick={closeSheet}
					>
						My Bets
					</a>
				{/if}
				<a
					href={resolve('/reputation')}
					class="py-3 text-sm font-semibold text-zinc-800 underline-offset-4 transition-colors hover:underline dark:text-zinc-100"
					onclick={closeSheet}
				>
					Reputation Hub
				</a>
			</nav>

			<div class="h-px shrink-0 bg-zinc-200/90 dark:bg-zinc-700/80" role="separator"></div>

			<div class="flex items-center justify-between gap-3">
				<span class="text-sm font-medium text-zinc-600 dark:text-zinc-300">Theme</span>
				<button
					type="button"
					class="text-xs font-medium text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300"
					onclick={toggleDarkMode}
				>
					{#if isDarkMode}
						<Sun class="h-3.5 w-3.5" strokeWidth={1.75} />
						Light
					{:else}
						<Moon class="h-3.5 w-3.5" strokeWidth={1.75} />
						Dark
					{/if}
				</button>
			</div>

			<div class="h-px shrink-0 bg-zinc-200/90 dark:bg-zinc-700/80" role="separator"></div>

			{#if typeof window !== 'undefined' && isLoggedIn()}
				<div
					class="rounded-2xl border border-zinc-200/80 bg-white/90 p-4 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-950/60"
				>
					<p class="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
						Connected wallet
					</p>
					<p
						class="mt-2 min-w-0 truncate font-mono text-sm font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100"
						title={getStxAddress()}
					>
						<span class="[font-variant-caps:small-caps]">{truncate(getStxAddress(), 3)}</span>
						<span class="text-zinc-400"> · </span>
						<span>STX</span>
						<span class="text-zinc-400"> · </span>
						<span>{$userReputationStore.userReputationData?.weightedReputation ?? 0} Karma</span>
					</p>
				</div>

				<nav class="flex flex-col" aria-label="Mobile account">
					<a
						href={resolve('/reputation/leader-board')}
						class="border-b border-zinc-200 py-2.5 text-sm text-zinc-800 underline-offset-4 hover:underline dark:border-zinc-700 dark:text-zinc-100"
						onclick={closeSheet}
					>
						Top Traders
					</a>
					<a
						href={resolve('/settings')}
						class="border-b border-zinc-200 py-2.5 text-sm text-zinc-800 underline-offset-4 hover:underline dark:border-zinc-700 dark:text-zinc-100"
						onclick={closeSheet}
					>
						Settings
					</a>
					<button
						type="button"
						class="py-2.5 text-left text-sm text-red-700 underline-offset-4 hover:underline dark:text-red-400"
						onclick={() => {
							void disWallet();
							closeSheet();
						}}
					>
						Disconnect
					</button>
				</nav>
			{:else}
				<div class="flex w-full justify-center pt-1">
					<WalletMenuTailwind menuPlacement="top" />
				</div>
			{/if}
		</aside>
	</div>
{/if}

{#if $showOnRampModal}
	<SlotModal onClose={() => closeModal()}>
		{#snippet modalBody()}
			<div>
				<ConnectLanes />
			</div>
		{/snippet}
	</SlotModal>
{/if}
