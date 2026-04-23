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
	class="relative top-0 right-0 left-0 z-[999] h-16 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
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
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white shadow-sm transition-all duration-200 group-hover:bg-orange-600 group-hover:shadow-md"
				>
					<span class="text-sm font-bold">BM</span>
				</div>
				<span class="text-xl font-bold text-gray-900 dark:text-white">BigMarket</span>
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
				class="hidden h-9 w-9 items-center justify-center rounded-md text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:outline-none md:inline-flex dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white dark:focus-visible:ring-offset-gray-900"
			>
				{#if isDarkMode}
					<Sun class="h-4 w-4" />
				{:else}
					<Moon class="h-4 w-4" />
				{/if}
			</button>
			<!-- {#if isLoggedIn()}
				<a
					href={resolve('/vault/deposit')}
					class="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
					onclick={closeMenu}
				>
					<div class="flex-1">
						<div class="text-sm font-semibold text-gray-900 dark:text-gray-100">Deposit</div>
					</div>
				</a>
			{/if} -->

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
				class="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:outline-none md:hidden dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white dark:focus-visible:ring-offset-gray-900 {isOpen
					? 'bg-orange-100 dark:bg-orange-900'
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
			class="absolute top-16 right-0 left-0 z-[999] border-b border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
		>
			<div class="mx-auto max-w-7xl p-4">
				<!-- Main Actions (Top) -->
				<div class="mb-4 space-y-1 border-b border-gray-200 pb-4 dark:border-gray-700">
					{#if typeof window !== 'undefined'}
						<!-- {#if isLoggedIn()}
							<a
								href={resolve('/vault/deposit')}
								class="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
								onclick={closeMenu}
							>
								<div
									class="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
								>
									<BarChart3 class="h-4 w-4" />
								</div>
								<div class="flex-1">
									<div class="text-sm font-semibold text-gray-900 dark:text-gray-100">Deposit</div>
									<div class="text-xs text-gray-500 dark:text-gray-400">Deposit funds</div>
								</div>
							</a>
						{/if} -->
						<a
							href={resolve('/dao')}
							class="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
							onclick={closeMenu}
						>
							<div
								class="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
							>
								<DollarSign class="h-4 w-4" />
							</div>
							<div class="flex-1">
								<div class="text-sm font-semibold text-gray-900 dark:text-gray-100">
									BigMarket IDO
								</div>
								<div class="text-xs text-gray-500 dark:text-gray-400">Join our token sale</div>
							</div>
						</a>
						{#if isLoggedIn()}
							<a
								href={resolve(`/my-markets/${getStxAddress()}`)}
								class="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
								onclick={closeMenu}
							>
								<div
									class="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
								>
									<BarChart3 class="h-4 w-4" />
								</div>
								<div class="flex-1">
									<div class="text-sm font-semibold text-gray-900 dark:text-gray-100">
										My Markets
									</div>
									<div class="text-xs text-gray-500 dark:text-gray-400">View your positions</div>
								</div>
							</a>
							<!-- <a
								href={resolve('/market-mgt')}
								class="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
								onclick={closeMenu}
							/> -->
						{/if}
					{/if}
					<a
						href={resolve('/reputation')}
						class="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
						onclick={closeMenu}
					>
						<div
							class="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
						>
							<Trophy class="h-4 w-4" />
						</div>
						<div class="flex-1">
							<div class="text-sm font-semibold text-gray-900 dark:text-gray-100">
								Reputation Hub
							</div>
							<div class="text-xs text-gray-500 dark:text-gray-400">Build your track record</div>
						</div>
					</a>
				</div>

				<!-- Dark Mode Toggle (Mobile) -->
				<div
					class="mb-4 flex items-center justify-between border-b border-gray-200 py-2 dark:border-gray-700"
				>
					<span class="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
					<button
						onclick={toggleDarkMode}
						class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors {isDarkMode
							? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
							: 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}"
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
						<div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
							<div class="flex items-center justify-between">
								<div class="min-w-0 flex-1">
									<div class="text-xs text-gray-500 dark:text-gray-400">Connected wallet</div>
									<div class="truncate font-mono text-sm text-gray-900 dark:text-gray-100">
										{truncate(getStxAddress())}
									</div>
								</div>
								<span
									class="rounded bg-orange-100 px-2 py-1 text-[10px] font-bold text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
									>STX</span
								>
							</div>
						</div>

						<!-- Secondary Actions -->
						<div class="space-y-1">
							<a
								href={resolve('/reputation/leader-board')}
								class="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
								onclick={closeMenu}
							>
								<div
									class="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
								>
									<Crown class="h-3.5 w-3.5" />
								</div>
								<div class="flex-1">
									<div class="text-sm font-medium text-gray-600 dark:text-gray-400">
										Top Traders
									</div>
									<div class="text-xs text-gray-500 dark:text-gray-400">See the leaderboard</div>
								</div>
							</a>
							<a
								href={resolve('/settings')}
								class="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
								onclick={closeMenu}
							>
								<div
									class="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
								>
									<Settings class="h-3.5 w-3.5" />
								</div>
								<div class="flex-1">
									<div class="text-sm font-medium text-gray-600 dark:text-gray-400">Settings</div>
									<div class="text-xs text-gray-500 dark:text-gray-400">
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
								class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
							>
								<div
									class="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
								>
									<Power class="h-3.5 w-3.5" />
								</div>
								<div class="flex-1">
									<div class="text-sm font-medium text-gray-700 dark:text-gray-300">Disconnect</div>
									<div class="text-xs text-gray-500 dark:text-gray-400">Log out safely</div>
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
