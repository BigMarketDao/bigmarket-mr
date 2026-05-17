<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Button } from '@bigmarket/bm-ui';
	import type { MarketDisputeRecord, VotingEventProposeProposal } from '@bigmarket/bm-types';
	import { constructed, walletState } from '@bigmarket/bm-common';
	import { Eye } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fetchProposals } from '$lib/core/app/loaders/governance/proposals';
	import { getDisputes } from '$lib/core/app/loaders/governance/voting';
	import DaoPanelDisputes from './DaoPanelDisputes.svelte';
	import DaoPanelOverview from './DaoPanelOverview.svelte';
	import DaoPanelReputation from './DaoPanelReputation.svelte';
	import DaoPanelTreasury from './DaoPanelTreasury.svelte';
	import DaoPanelVotes from './DaoPanelVotes.svelte';

	const TAB_IDS = ['overview', 'votes', 'disputes', 'reputation', 'treasury'] as const;
	type TabId = (typeof TAB_IDS)[number];

	const TAB_LABELS: Record<TabId, string> = {
		overview: 'Overview',
		votes: 'Active Votes',
		disputes: 'Open Disputes',
		reputation: 'My Reputation',
		treasury: 'Treasury'
	};

	let activeTab = $state<TabId>('overview');
	let proposals = $state<VotingEventProposeProposal[]>([]);
	let disputes = $state<MarketDisputeRecord[]>([]);
	let dataLoaded = $state(false);

	const walletConnected = $derived(
		$walletState.status === 'connected' && ($walletState.accounts?.length ?? 0) > 0
	);
	const previewMode = $derived(page.url.searchParams.get('preview') === '1');
	const loggedIn = $derived(walletConnected || previewMode);

	function togglePreview() {
		const url = new URL(page.url);
		if (previewMode) url.searchParams.delete('preview');
		else url.searchParams.set('preview', '1');
		goto(url.pathname + url.search, { noScroll: true, keepFocus: true });
	}

	function parseTab(value: string | null): TabId {
		if (value && TAB_IDS.includes(value as TabId)) return value as TabId;
		return 'overview';
	}

	async function loadData() {
		if (dataLoaded) return;
		dataLoaded = true;
		const [p, d] = await Promise.all([fetchProposals(), getDisputes()]);
		proposals = p ?? [];
		disputes = d ?? [];
	}

	onMount(() => {
		const initial = parseTab(page.url.searchParams.get('tab'));
		if (initial !== activeTab) activeTab = initial;
		if (loggedIn) loadData();
	});

	$effect(() => {
		if (loggedIn) loadData();
	});
</script>

<section id="control-panel" class="py-8">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex flex-wrap items-end justify-between gap-4">
			<div>
				<h2 class="text-2xl font-bold text-foreground">DAO control panel</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{#if loggedIn}
						Vote, track reputation, and follow treasury activity.
					{:else}
						Connect your wallet from the header to vote, track reputation, and follow treasury
						activity.
					{/if}
				</p>
			</div>
			<div class="flex shrink-0 flex-wrap items-center gap-2">
				<Button
					variant={previewMode ? 'default' : 'outline'}
					size="sm"
					class="gap-2"
					onclick={togglePreview}
				>
					<Eye class="h-4 w-4" aria-hidden="true" />
					{previewMode ? 'Exit preview' : 'Preview features'}
				</Button>
				{#if !$constructed}
					<Button variant="outline" size="sm" href="?page=bootup">DAO boot (coordinator)</Button>
				{/if}
			</div>
		</div>

		{#if previewMode && !walletConnected}
			<div
				class="mt-4 flex items-center gap-2 rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-xs text-foreground"
			>
				<Eye class="h-3.5 w-3.5 text-primary" aria-hidden="true" />
				<span class="font-medium">Preview mode</span>
				<span class="text-muted-foreground"
					>— sample panel. Connect your wallet from the header to use it for real.</span
				>
			</div>
		{/if}

		{#if loggedIn}
			<div role="tablist" aria-label="DAO control panel" class="mt-8 flex w-full flex-wrap gap-1 overflow-x-auto rounded-md bg-secondary p-1">
				{#each TAB_IDS as id (id)}
					<button
						type="button"
						role="tab"
						aria-selected={activeTab === id}
						aria-controls="dao-panel-{id}"
						id="dao-tab-{id}"
						class="shrink-0 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none {activeTab ===
						id
							? 'bg-card text-foreground shadow-sm'
							: 'text-muted-foreground hover:text-foreground'}"
						onclick={() => (activeTab = id)}
					>
						{TAB_LABELS[id]}
					</button>
				{/each}
			</div>

			<div class="mt-6" id="dao-panel-overview" role="tabpanel" aria-labelledby="dao-tab-overview" hidden={activeTab !== 'overview'}>
				{#if activeTab === 'overview'}
					<DaoPanelOverview {proposals} {disputes} />
				{/if}
			</div>
			<div class="mt-6" id="dao-panel-votes" role="tabpanel" aria-labelledby="dao-tab-votes" hidden={activeTab !== 'votes'}>
				{#if activeTab === 'votes'}
					<DaoPanelVotes />
				{/if}
			</div>
			<div class="mt-6" id="dao-panel-disputes" role="tabpanel" aria-labelledby="dao-tab-disputes" hidden={activeTab !== 'disputes'}>
				{#if activeTab === 'disputes'}
					<DaoPanelDisputes />
				{/if}
			</div>
			<div class="mt-6" id="dao-panel-reputation" role="tabpanel" aria-labelledby="dao-tab-reputation" hidden={activeTab !== 'reputation'}>
				{#if activeTab === 'reputation'}
					<DaoPanelReputation />
				{/if}
			</div>
			<div class="mt-6" id="dao-panel-treasury" role="tabpanel" aria-labelledby="dao-tab-treasury" hidden={activeTab !== 'treasury'}>
				{#if activeTab === 'treasury'}
					<DaoPanelTreasury />
				{/if}
			</div>
		{/if}
	</div>
</section>
