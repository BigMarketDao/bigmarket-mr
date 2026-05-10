<script lang="ts">
	import WalletMenuDaisy from './WalletMenuDaisy.svelte';
	import { onDestroy, onMount } from 'svelte';
	import SlotModal from './SlotModal.svelte';
	import { showOnRampModal, userReputationStore } from '@bigmarket/bm-common';
	import { Menu, X, Sun, Moon, Trophy, Crown, Settings, Power, BarChart3, DollarSign } from 'lucide-svelte';
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
	import { PAGE_CONTENT_RAIL } from './headerMenuDaisyLayout';

	const DRAWER_ID = 'header-menu-daisy-drawer';
	const MD_BREAKPOINT_PX = 768;

	let drawerOpen = $state(false);
	let isDarkMode = $state(false);
	let currentPath = $state(page.url.pathname);

	afterNavigate(() => {
		currentPath = page.url.pathname;
		drawerOpen = false;
	});

	const disWallet = async () => {
		await disconnectWallet();
		window.location.reload();
	};

	function closeDrawer() {
		drawerOpen = false;
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
			drawerOpen = false;
		}
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', handleResize);
			checkDarkMode();
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', handleResize);
		}
	});
</script>

<div class="drawer drawer-end">
	<input id={DRAWER_ID} type="checkbox" class="drawer-toggle" bind:checked={drawerOpen} />

	<div class="drawer-content">
		<header class="bg-base-100 border-base-300 sticky top-0 z-[999] border-b shadow-sm">
			<div class={PAGE_CONTENT_RAIL}>
				<div class="navbar min-h-16 w-full px-0">
					<div class="navbar-start w-auto max-w-[65%] flex-nowrap gap-2 md:max-w-none md:flex-1">
						<a
							href={resolve('/')}
							class="btn btn-ghost shrink-0 gap-2 px-2 normal-case md:px-3"
							aria-label="BigMarket home"
						>
							<span class="bg-primary text-primary-content flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold shadow-sm">
								BM
							</span>
							<span class="text-base-content hidden text-lg font-bold sm:inline lg:text-xl">BigMarket</span>
						</a>

						{#if typeof window !== 'undefined'}
							<div class="hidden items-center md:flex md:gap-2 lg:gap-4">
								{#each mainNavLinks as nav (nav.href)}
									<HeaderButton href={nav.href} label={nav.label} active={currentPath === nav.href} />
								{/each}
								{#if isLoggedIn()}
									{#if isCoordinator(getStxAddress())}
										<HeaderButton
											href="/market-mgt"
											label="Create"
											active={currentPath.startsWith('/market-mgt')}
										/>
									{/if}
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

					<div class="navbar-end w-auto flex-nowrap gap-1 md:gap-2">
						<button
							type="button"
							aria-label="Toggle dark mode"
							class="btn btn-ghost btn-square hidden md:inline-flex"
							onclick={toggleDarkMode}
						>
							{#if isDarkMode}
								<Sun class="h-5 w-5" />
							{:else}
								<Moon class="h-5 w-5" />
							{/if}
						</button>

						<div class="hidden md:block">
							<WalletMenuDaisy />
						</div>

						<label
							for={DRAWER_ID}
							aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
							class="btn btn-ghost btn-square drawer-button md:hidden"
							class:btn-active={drawerOpen}
						>
							{#if drawerOpen}
								<X class="h-5 w-5" />
							{:else}
								<Menu class="h-5 w-5" />
							{/if}
						</label>
					</div>
				</div>
			</div>
		</header>
	</div>

	<div class="drawer-side md:hidden z-[1001] border-l border-base-300 bg-base-200">
		<label for={DRAWER_ID} class="drawer-overlay" aria-label="Close menu"></label>
		<aside class="flex min-h-full w-[min(100vw,20rem)] flex-col gap-4 p-4">
			<div class="flex items-center justify-between md:hidden">
				<span class="text-base-content text-sm font-semibold">Menu</span>
				<label for={DRAWER_ID} class="btn btn-sm btn-ghost btn-circle" aria-label="Close menu">
					<X class="h-5 w-5" />
				</label>
			</div>

			<ul class="menu w-full rounded-box bg-base-200">
				<li>
					<a href={resolve('/dao')} onclick={closeDrawer}>
						<DollarSign class="h-4 w-4" />
						<span>
							<span class="font-medium">BigMarket IDO</span>
							<span class="text-xs text-base-content/60 block">Join our token sale</span>
						</span>
					</a>
				</li>
				{#if typeof window !== 'undefined' && isLoggedIn()}
					<li>
						<a href={resolve(`/my-markets/${getStxAddress()}`)} onclick={closeDrawer}>
							<BarChart3 class="h-4 w-4" />
							<span>
								<span class="font-medium">My Markets</span>
								<span class="text-xs text-base-content/60 block">View your positions</span>
							</span>
						</a>
					</li>
				{/if}
				<li>
					<a href={resolve('/reputation')} onclick={closeDrawer}>
						<Trophy class="h-4 w-4" />
						<span>
							<span class="font-medium">Reputation Hub</span>
							<span class="text-xs text-base-content/60 block">Build your track record</span>
						</span>
					</a>
				</li>
			</ul>

			<div class="divider my-0"></div>

			<div class="flex items-center justify-between gap-2">
				<span class="text-sm font-medium">Theme</span>
				<button type="button" class="btn btn-sm btn-outline gap-2" onclick={toggleDarkMode}>
					{#if isDarkMode}
						<Sun class="h-4 w-4" />
						Light
					{:else}
						<Moon class="h-4 w-4" />
						Dark
					{/if}
				</button>
			</div>

			<div class="divider my-0"></div>

			{#if typeof window !== 'undefined' && isLoggedIn()}
				<div class="card bg-base-100 border-base-300 border shadow-sm">
					<div class="card-body gap-2 p-4">
						<p class="text-xs text-base-content/60">Connected wallet</p>
						<div class="flex items-start justify-between gap-2">
							<p class="text-base-content font-mono text-sm leading-tight break-all">
								{truncate(getStxAddress())}
							</p>
							<span class="badge badge-primary badge-sm shrink-0">STX</span>
						</div>
					</div>
				</div>

				<ul class="menu menu-sm rounded-box bg-base-200 w-full">
					<li>
						<a href={resolve('/reputation/leader-board')} onclick={closeDrawer}>
							<Crown class="h-4 w-4" />
							<span>
								<span class="font-medium">Top Traders</span>
								<span class="text-xs text-base-content/60 block">See the leaderboard</span>
							</span>
						</a>
					</li>
					<li>
						<a href={resolve('/settings')} onclick={closeDrawer}>
							<Settings class="h-4 w-4" />
							<span>
								<span class="font-medium">Settings</span>
								<span class="text-xs text-base-content/60 block">Customize your experience</span>
							</span>
						</a>
					</li>
					<li>
						<button
							type="button"
							class="text-error hover:bg-error/10 w-full gap-3 rounded-lg text-start"
							onclick={() => {
								void disWallet();
								closeDrawer();
							}}
						>
							<Power class="h-4 w-4" />
							<span>
								<span class="font-medium">Disconnect</span>
								<span class="text-xs opacity-80 block">Log out safely</span>
							</span>
						</button>
					</li>
				</ul>
			{:else}
				<div class="flex w-full justify-center pt-2">
					<WalletMenuDaisy menuPlacement="top" />
				</div>
			{/if}
		</aside>
	</div>
</div>

{#if $showOnRampModal}
	<SlotModal onClose={() => closeModal()}>
		{#snippet modalBody()}
			<div>
				<ConnectLanes />
			</div>
		{/snippet}
	</SlotModal>
{/if}
