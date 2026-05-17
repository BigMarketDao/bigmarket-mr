<script lang="ts">
	import ConnectMenuDropdown from './ConnectMenuDropdown.svelte';
	import BigMarketLogo from './BigMarketLogo.svelte';
	import { onDestroy, onMount } from 'svelte';
	import SlotModal from './SlotModal.svelte';
	import { showOnRampModal } from '@bigmarket/bm-common';
	import {
		Menu,
		X,
		Sun,
		Moon,
		Trophy,
		Crown,
		Settings,
		Power
	} from 'lucide-svelte';
	import { truncate } from '@bigmarket/bm-utilities';
	import ConnectLanes from './ConnectLanes.svelte';
	import { getStxAddress, isLoggedIn } from '@bigmarket/bm-common';
	import { disconnectWallet } from '@bigmarket/bm-common';
	import { resolve } from '$app/paths';
	import { controlRoomLink, howItWorksLink } from '$lib/core/tools/site';
	import { HeaderButton } from '@bigmarket/bm-ui';
	import { isCoordinator } from '$lib/core/tools/security';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';

	let dropdownRef: HTMLElement | null = null;
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
		isOpen = !isOpen;
	}

	function closeMenu() {
		isOpen = false;
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

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (isOpen && !dropdownRef?.contains(target)) {
			isOpen = false;
		}
	}

	function handleResize() {
		if (typeof window !== 'undefined' && window.innerWidth >= 768) {
			isOpen = false;
		}
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('click', handleClickOutside);
			window.addEventListener('resize', handleResize);
			checkDarkMode();
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
		<div class="flex min-w-0 flex-1 items-center gap-6 md:gap-8">
			<a href={resolve('/')} class="group shrink-0">
				<span class="sr-only">BigMarket home</span>
				<BigMarketLogo />
			</a>

			{#if typeof window !== 'undefined'}
				<div class="hidden min-w-0 items-center gap-1 md:flex">
					{#if isLoggedIn()}
						<HeaderButton
							href={`/my-markets/${getStxAddress()}`}
							label="MY PREDICTIONS"
							active={currentPath.startsWith('/my-markets')}
						/>
					{/if}
					<HeaderButton
						href={controlRoomLink.href}
						label={controlRoomLink.label}
						active={currentPath === controlRoomLink.href || currentPath.startsWith('/dao')}
					/>
					{#if isLoggedIn() && isCoordinator(getStxAddress())}
						<HeaderButton
							href="/market-mgt"
							label="CREATE MARKET"
							active={currentPath.startsWith('/market-mgt')}
						/>
					{/if}
					<HeaderButton
						href={howItWorksLink.href}
						label={howItWorksLink.label}
						active={false}
						external={howItWorksLink.external}
					/>
				</div>
			{/if}
		</div>

		<div class="flex shrink-0 items-center gap-1">
			{#if isLoggedIn()}
				<div class="hidden md:block">
					<HeaderButton
						href={resolve('/vault/deposit')}
						label="DEPOSIT"
						active={currentPath.startsWith('/vault/deposit')}
					/>
				</div>
			{/if}

			<div class="hidden md:block">
				<ConnectMenuDropdown {isDarkMode} onToggleDarkMode={toggleDarkMode} />
			</div>

			<button
				id="mobile-menu-button"
				onclick={toggleMenu}
				type="button"
				aria-label={isOpen ? 'Close menu' : 'Open menu'}
				aria-expanded={isOpen}
				class="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none md:hidden dark:focus-visible:ring-offset-background {isOpen
					? 'bg-primary/15'
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

	{#if isOpen}
		<div
			id="header-dd"
			class="absolute top-16 right-0 left-0 z-[999] border-b border-border bg-popover shadow-lg md:hidden"
		>
			<div class="mx-auto max-w-7xl p-4">
				<div class="mb-4 space-y-1 border-b border-border pb-4">
					{#if typeof window !== 'undefined'}
						{#if isLoggedIn()}
							<HeaderButton
								href={`/my-markets/${getStxAddress()}`}
								label="MY PREDICTIONS"
								active={currentPath.startsWith('/my-markets')}
							/>
						{/if}
						<HeaderButton
							href={controlRoomLink.href}
							label={controlRoomLink.label}
							active={currentPath === controlRoomLink.href || currentPath.startsWith('/dao')}
						/>
						{#if isLoggedIn() && isCoordinator(getStxAddress())}
							<HeaderButton
								href="/market-mgt"
								label="CREATE MARKET"
								active={currentPath.startsWith('/market-mgt')}
							/>
						{/if}
						<HeaderButton
							href={howItWorksLink.href}
							label={howItWorksLink.label}
							active={false}
							external={howItWorksLink.external}
						/>
						{#if isLoggedIn()}
							<HeaderButton
								href={resolve('/vault/deposit')}
								label="DEPOSIT"
								active={currentPath.startsWith('/vault/deposit')}
							/>
						{/if}
					{/if}
				</div>

				<div class="mb-4 border-b border-border pb-4">
					<button
						type="button"
						onclick={toggleDarkMode}
						class="flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase transition-colors hover:bg-muted/80 hover:text-foreground"
					>
						<span>Theme</span>
						<span class="inline-flex items-center gap-1.5 normal-case">
							{#if isDarkMode}
								<Sun class="h-3.5 w-3.5" />
								Light
							{:else}
								<Moon class="h-3.5 w-3.5" />
								Dark
							{/if}
						</span>
					</button>
				</div>

				{#if typeof window !== 'undefined' && isLoggedIn()}
					<div class="space-y-3">
						<div class="rounded-md border border-border bg-card p-3 text-card-foreground shadow-sm">
							<div class="min-w-0">
								<div class="text-xs text-muted-foreground">Wallet</div>
								<div class="truncate font-mono text-sm text-foreground">
									{truncate(getStxAddress())}
								</div>
							</div>
						</div>

						<div class="space-y-1">
							<a
								href={resolve('/reputation')}
								class="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted"
								onclick={closeMenu}
							>
								<Trophy class="h-4 w-4 text-muted-foreground" />
								<span class="text-xs font-semibold tracking-wide text-foreground uppercase"
									>Reputation</span
								>
							</a>
							<a
								href={resolve('/reputation/leader-board')}
								class="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted"
								onclick={closeMenu}
							>
								<Crown class="h-4 w-4 text-muted-foreground" />
								<span class="text-xs font-semibold tracking-wide text-foreground uppercase"
									>Leaderboard</span
								>
							</a>
							<a
								href={resolve('/settings')}
								class="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted"
								onclick={closeMenu}
							>
								<Settings class="h-4 w-4 text-muted-foreground" />
								<span class="text-xs font-semibold tracking-wide text-foreground uppercase"
									>Settings</span
								>
							</a>
							<button
								type="button"
								onclick={() => {
									disWallet();
									closeMenu();
								}}
								class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted"
							>
								<Power class="h-4 w-4 text-destructive" />
								<span class="text-xs font-semibold tracking-wide text-destructive uppercase"
									>Disconnect</span
								>
							</button>
						</div>
					</div>
				{:else if typeof window !== 'undefined'}
					<div class="flex justify-center pt-2">
						<ConnectMenuDropdown {isDarkMode} onToggleDarkMode={toggleDarkMode} />
					</div>
				{/if}
			</div>
		</div>
	{/if}
</header>

{#if $showOnRampModal}
	<SlotModal onClose={() => closeModal()}>
		{#snippet modalBody()}
			<div class="">
				<ConnectLanes />
			</div>
		{/snippet}
	</SlotModal>
{/if}
