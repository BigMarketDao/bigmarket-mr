<script lang="ts">
	import ConnectMenuDropdown from './ConnectMenuDropdown.svelte';
	import { onDestroy, onMount } from 'svelte';
	import SlotModal from './SlotModal.svelte';
	import { showOnRampModal, userReputationStore } from '@bigmarket/bm-common';
	import {
		Menu,
		X,
		Sun,
		Moon,
		Trophy,
		Crown,
		Settings,
		Power,
		BarChart3,
		DollarSign
	} from 'lucide-svelte';
	import { truncate } from '@bigmarket/bm-utilities';
	import ConnectLanes from './ConnectLanes.svelte';
	import { getStxAddress, isLoggedIn } from '@bigmarket/bm-common';
	import { disconnectWallet } from '@bigmarket/bm-common';
	import { resolve } from '$app/paths';
	import { mainNavLinks } from '$lib/core/tools/site';
	import { HeaderButton, HeaderButtonReputation } from '@bigmarket/bm-ui';
	import { isCoordinator } from '$lib/core/tools/security';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';

	let dropdownRef: HTMLElement | null = null;
	//let active = $state(false);
	let isOpen = $state(false);
	let isDarkMode = $state(false);
	let currentPath = $state(page.url.pathname);
	afterNavigate(() => {
		currentPath = page.url.pathname;
	});

	const disWallet = async () => {
		await disconnectWallet();
		window.location.reload();
	};

	function toggleMenu() {
		console.log('toggleMenu called, current isOpen:', isOpen);
		isOpen = !isOpen;
		console.log('Menu toggled to:', isOpen);
	}

	function closeMenu() {
		isOpen = false;
	}

	// Dark mode functions
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

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (isOpen && !dropdownRef?.contains(target)) {
			isOpen = false;
			console.log('Menu toggled:', isOpen);
		}
	}

	// Handle window resize to close mobile menu
	function handleResize() {
		if (typeof window !== 'undefined' && window.innerWidth >= 768) {
			// Close mobile menu when resizing to desktop
			isOpen = false;
		}
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('click', handleClickOutside);
			window.addEventListener('resize', handleResize);
			checkDarkMode(); // Initialize dark mode state
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('click', handleClickOutside);
			window.removeEventListener('resize', handleResize);
		}
	});
</script>

<header
	class="relative top-0 right-0 left-0 z-[999] h-16 border-b border-border bg-background/90 backdrop-blur-md"
	bind:this={dropdownRef}
>
	<nav
		class="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
	>
		<!-- Left Section: Logo + Links -->
		<div class="flex items-center gap-8">
			<!-- Logo -->

			<a href={resolve('/')} class="group flex items-center gap-3">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-sm transition-all duration-200 group-hover:bg-accent/90 group-hover:shadow-md"
				>
					<span class="text-sm font-bold">BM</span>
				</div>
				<span class="text-xl font-bold text-foreground">BigMarket</span>
			</a>
			{#if typeof window !== 'undefined'}
				<div class="hidden items-center gap-4 md:flex">
					<!-- Centralized main nav links -->
					{#each mainNavLinks as nav (nav.href)}
						<HeaderButton href={nav.href} label={nav.label} active={currentPath === nav.href} />
					{/each}
					{#if isLoggedIn()}
						{#if isCoordinator(getStxAddress())}<HeaderButton
								href="/market-mgt"
								label="Create"
								active={currentPath.startsWith('/market-mgt')}
							/>{/if}
						<HeaderButton
							href={`/my-markets/${getStxAddress()}`}
							label="My Markets"
							active={currentPath.startsWith('/my-markets')}
						/>
						<HeaderButtonReputation
							weightedReputation={$userReputationStore.userReputationData?.weightedReputation || 0}
							active={currentPath.startsWith('/reputation')}
						/>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Right Section: Dark Toggle + Connect Menu + Mobile Menu Button -->
		<div class="flex items-center gap-3">
			<!-- Dark Mode Toggle (Desktop) -->
			<button
				onclick={toggleDarkMode}
				type="button"
				aria-label="Toggle dark mode"
				class="hidden h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none md:inline-flex dark:focus-visible:ring-offset-background"
			>
				{#if isDarkMode}
					<Sun class="h-4 w-4" />
				{:else}
					<Moon class="h-4 w-4" />
				{/if}
			</button>
			{#if isLoggedIn()}
				<a
					href={resolve('/vault/deposit')}
					class="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/50"
					onclick={closeMenu}
				>
					<div class="flex-1">
						<div class="text-sm font-semibold text-foreground">Deposits</div>
					</div>
				</a>
			{/if}

			<!-- Connect dropdown (Desktop) -->
			<div class="hidden md:block">
				<ConnectMenuDropdown />
			</div>

			<!-- Mobile menu button -->
			<button
				id="mobile-menu-button"
				onclick={toggleMenu}
				type="button"
				aria-label={isOpen ? 'Close menu' : 'Open menu'}
				aria-expanded={isOpen}
				class="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none md:hidden dark:focus-visible:ring-offset-background {isOpen
					? 'bg-accent/10 dark:bg-accent/20'
					: ''}"
			>
				{#if isOpen}
					<X class="pointer-events-none h-5 w-5" />
				{:else}
					<Menu class="pointer-events-none h-5 w-5" />
				{/if}
			</button>
		</div>
	</nav>

	<!-- Mobile Menu -->
	{#if isOpen}
		<div
			id="header-dd"
			class="absolute top-16 right-0 left-0 z-[999] border-b border-border bg-popover shadow-lg"
		>
			<div class="mx-auto max-w-7xl p-4">
				<!-- Main Actions (Top) -->
				<div class="mb-4 space-y-1 border-b border-border pb-4">
					{#if typeof window !== 'undefined'}
						{#if isLoggedIn()}
							<a
								href={resolve('/vault/deposit')}
								class="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/50"
								onclick={closeMenu}
							>
								<div
									class="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground"
								>
									<BarChart3 class="h-4 w-4" />
								</div>
								<div class="flex-1">
									<div class="text-sm font-semibold text-foreground">Deposits</div>
									<div class="text-xs text-muted-foreground">Deposit funds</div>
								</div>
							</a>
						{/if}
						<a
							href={resolve('/dao')}
							class="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/50"
							onclick={closeMenu}
						>
							<div
								class="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground"
							>
								<DollarSign class="h-4 w-4" />
							</div>
							<div class="flex-1">
								<div class="text-sm font-semibold text-foreground">
									BigMarket IDO
								</div>
								<div class="text-xs text-muted-foreground">Join our token sale</div>
							</div>
						</a>
						{#if isLoggedIn()}
							<a
								href={resolve(`/my-markets/${getStxAddress()}`)}
								class="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/50"
								onclick={closeMenu}
							>
								<div
									class="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground"
								>
									<BarChart3 class="h-4 w-4" />
								</div>
								<div class="flex-1">
									<div class="text-sm font-semibold text-foreground">
										My Markets
									</div>
									<div class="text-xs text-muted-foreground">View your positions</div>
								</div>
							</a>
							<!-- <a
								href={resolve('/market-mgt')}
								class="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/50"
								onclick={closeMenu}
							/> -->
						{/if}
					{/if}
					<a
						href={resolve('/reputation')}
						class="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/50"
						onclick={closeMenu}
					>
						<div
							class="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground"
						>
							<Trophy class="h-4 w-4" />
						</div>
						<div class="flex-1">
							<div class="text-sm font-semibold text-foreground">
								Reputation Hub
							</div>
							<div class="text-xs text-muted-foreground">Build your track record</div>
						</div>
					</a>
				</div>

				<!-- Dark Mode Toggle (Mobile) -->
				<div
					class="mb-4 flex items-center justify-between border-b border-border py-2"
				>
					<span class="text-sm font-medium text-muted-foreground">Theme</span>
					<button
						onclick={toggleDarkMode}
						class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors {isDarkMode
							? 'bg-muted text-foreground'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
					>
						{#if isDarkMode}
							<Sun class="h-4 w-4" />
							Light
						{:else}
							<Moon class="h-4 w-4" />
							Dark
						{/if}
					</button>
				</div>

				<!-- Wallet Section -->
				{#if typeof window !== 'undefined' && isLoggedIn()}
					<div class="space-y-3">
						<!-- Wallet Info Card -->
						<div class="rounded-md border border-border bg-card p-3 text-card-foreground shadow-sm">
							<div class="flex items-center justify-between">
								<div class="min-w-0 flex-1">
									<div class="text-xs text-muted-foreground">Connected wallet</div>
									<div class="truncate font-mono text-sm text-foreground">
										{truncate(getStxAddress())}
									</div>
								</div>
								<span
									class="rounded bg-accent/15 px-2 py-1 text-xs font-bold text-accent dark:bg-accent/20"
									>STX</span
								>
							</div>
						</div>

						<!-- Secondary Actions -->
						<div class="space-y-1">
							<a
								href={resolve('/reputation/leader-board')}
								class="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted"
								onclick={closeMenu}
							>
								<div
									class="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground"
								>
									<Crown class="h-3.5 w-3.5" />
								</div>
								<div class="flex-1">
									<div class="text-sm font-medium text-muted-foreground">
										Top Traders
									</div>
									<div class="text-xs text-muted-foreground">See the leaderboard</div>
								</div>
							</a>
							<a
								href={resolve('/settings')}
								class="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted"
								onclick={closeMenu}
							>
								<div
									class="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground"
								>
									<Settings class="h-3.5 w-3.5" />
								</div>
								<div class="flex-1">
									<div class="text-sm font-medium text-muted-foreground">Settings</div>
									<div class="text-xs text-muted-foreground">
										Customize your experience
									</div>
								</div>
							</a>

							<!-- Disconnect Button -->
							<button
								onclick={() => {
									disWallet();
									closeMenu();
									if (typeof window !== 'undefined') window.location.reload();
								}}
								class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted"
							>
								<div
									class="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground"
								>
									<Power class="h-3.5 w-3.5" />
								</div>
								<div class="flex-1">
									<div class="text-sm font-medium text-destructive">Disconnect</div>
									<div class="text-xs text-muted-foreground">Log out safely</div>
								</div>
							</button>
						</div>
					</div>
				{:else}
					<!-- Connect Button -->
					<div class="flex justify-center">
						<ConnectMenuDropdown />
					</div>
				{/if}
			</div>
		</div>
	{/if}
</header>

<!-- Spacer to account for fixed header -->
{#if $showOnRampModal}
	<SlotModal onClose={() => closeModal()}>
		{#snippet modalBody()}
			<div class="">
				<ConnectLanes />
			</div>
		{/snippet}
	</SlotModal>
{/if}
