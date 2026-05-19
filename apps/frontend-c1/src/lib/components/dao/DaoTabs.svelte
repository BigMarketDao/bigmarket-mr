<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { isCoordinator } from '$lib/core/tools/security';
	import { constructed, getStxAddress } from '@bigmarket/bm-common';
	import { onMount } from 'svelte';

	let {
		currentPage = 'dao-with-liquidity',
		onReload
	}: {
		currentPage?: string;
		onReload: (data: string) => void;
	} = $props();
	let inited = $state(false);
	const pages = [
		{
			title: 'DAO',
			tab: 'dao-with-liquidity'
		},
		{
			title: 'Proposals',
			tab: 'proposals'
		},
		{
			title: 'Disputes',
			tab: 'disputes'
		}
	];
	if (isCoordinator(getStxAddress())) {
		pages.push({
			title: 'Propose',
			tab: 'propose'
		});
	}

	// Update the URL when a tab is clicked (preserving other params)
	function changePage(tab: string) {
		const url = new URL(page.url);
		url.searchParams.set('page', tab);
		goto(url);
		currentPage = tab;
		onReload(tab);
	}

	onMount(async () => {
		if (!$constructed) {
			pages.push({ title: 'Boot', tab: 'bootup' });
		}
		inited = true;
	});
</script>

<div class="mb-6 flex w-full justify-center border-b border-border">
	<nav
		class="scrollbar-hide -mb-px flex space-x-4 overflow-x-auto sm:space-x-8"
		role="tablist"
	>
		{#if inited}
			{#each pages as page (page.tab)}
				<button
					type="button"
					role="tab"
					aria-selected={page.tab === currentPage}
					class="flex min-h-[44px] flex-shrink-0 cursor-pointer items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:px-4 {page.tab ===
					currentPage
						? 'border-primary text-primary'
						: 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'}"
					onclick={() => changePage(page.tab)}
				>
					<span class="hidden sm:inline">{page.title}</span>
					<span class="sm:hidden">{page.title.split(' ')[0]}</span>
				</button>
			{/each}
		{/if}
	</nav>
</div>
