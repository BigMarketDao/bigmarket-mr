<script lang="ts">
	import { base } from '$app/paths';
	import { BlockHeightProgressBar } from '@bigmarket/bm-ui';
	import type { MarketDisputeRecord, VotingEventProposeProposal } from '@bigmarket/bm-types';
	import { chainStore, daoOverviewStore, userReputationStore, walletState } from '@bigmarket/bm-common';
	import { fmtMicroToStxNumber, fmtNumber } from '@bigmarket/bm-utilities';
	import { fetchUserBalances } from '$lib/core/app/loaders/walletLoaders';
	import { daoConfigStore, requireDaoConfig } from '@bigmarket/bm-common';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
	import { ArrowRight } from 'lucide-svelte';

	let {
		proposals = [],
		disputes = []
	}: {
		proposals?: VotingEventProposeProposal[];
		disputes?: MarketDisputeRecord[];
	} = $props();

	const daoConfig = $derived(requireDaoConfig($daoConfigStore));
	const appConfig = $derived(requireAppConfig($appConfigStore));

	let bigBalanceHuman = $state<string>('—');
	let loadedBalances = $state(false);

	const loggedIn = $derived(
		$walletState.status === 'connected' && ($walletState.accounts?.length ?? 0) > 0
	);

	const stxAddress = $derived(
		$walletState.status === 'connected'
			? ($walletState.accounts.find((a) => a.type === 'stx')?.address ?? '')
			: ''
	);

	const repScore = $derived($userReputationStore?.userReputationData?.weightedReputation ?? 0);
	const epoch = $derived($daoOverviewStore?.reputationData?.currentEpoch ?? '—');
	const epochDuration = $derived($daoOverviewStore?.reputationData?.epochDuration ?? 0);
	const launchHeight = $derived($daoOverviewStore?.reputationData?.launchHeight ?? 0);
	const currentHeight = $derived($chainStore.stacks.burn_block_height ?? 0);

	const epochStart = $derived(
		epochDuration > 0 && typeof epoch === 'number'
			? launchHeight + (epoch - 1) * epochDuration
			: launchHeight
	);
	const epochEnd = $derived(epochStart + epochDuration);

	const totalWeighted = $derived($daoOverviewStore?.reputationData?.weightedSupply ?? 0);
	const estimatedShare = $derived(
		totalWeighted > 0 && repScore > 0
			? Math.floor((repScore / totalWeighted) * 10000)
			: 0
	);

	type ActivityItem = { label: string; when: string; kind: string };
	const recentActivity = $derived.by((): ActivityItem[] => {
		const items: ActivityItem[] = [];
		for (const p of proposals.slice(0, 3)) {
			items.push({
				kind: 'proposal',
				label: p.proposalMeta?.title ?? p.proposal,
				when: 'Proposal'
			});
		}
		for (const d of disputes.slice(0, 2)) {
			items.push({
				kind: 'dispute',
				label: d.marketName,
				when: 'Dispute'
			});
		}
		return items.slice(0, 5);
	});

	$effect(() => {
		if (!loggedIn || !stxAddress) {
			bigBalanceHuman = '—';
			loadedBalances = true;
			return;
		}

		let cancelled = false;
		loadedBalances = false;

		(async () => {
			try {
				const bals = await fetchUserBalances(
					appConfig.VITE_STACKS_API,
					appConfig.VITE_MEMPOOL_API,
					stxAddress,
					'',
					''
				);
				if (cancelled) return;
				const bigContract = `${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO_GOVERNANCE_TOKEN}::bmg-token`;
				const micro = Number(bals?.tokenBalances?.fungible_tokens[bigContract]?.balance || 0);
				bigBalanceHuman = fmtMicroToStxNumber(micro).toFixed(2);
			} catch {
				if (!cancelled) bigBalanceHuman = '—';
			} finally {
				if (!cancelled) loadedBalances = true;
			}
		})();

		return () => {
			cancelled = true;
		};
	});
</script>

<div class="space-y-6">
	<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
		<div class="rounded-md border border-border bg-card p-4">
			<p class="text-xs text-muted-foreground">Your BIG balance</p>
			<p class="mt-1 text-xl font-bold tabular-nums text-foreground">
				{loadedBalances ? bigBalanceHuman : '…'}
			</p>
		</div>
		<div class="rounded-md border border-border bg-card p-4">
			<p class="text-xs text-muted-foreground">Your reputation score</p>
			<p class="mt-1 text-xl font-bold tabular-nums text-foreground">{fmtNumber(repScore)} pts</p>
		</div>
		<div class="rounded-md border border-border bg-card p-4">
			<p class="text-xs text-muted-foreground">Current round</p>
			<p class="mt-1 text-xl font-bold tabular-nums text-foreground">Round {epoch}</p>
		</div>
		<div class="rounded-md border border-border bg-card p-4">
			<p class="text-xs text-muted-foreground">Est. share this round</p>
			<p class="mt-1 text-xl font-bold tabular-nums text-foreground">{fmtNumber(estimatedShare)} BIG</p>
		</div>
	</div>

	<div class="grid gap-6 lg:grid-cols-3">
		<section class="lg:col-span-2">
			<h3 class="font-semibold text-foreground">Recent activity</h3>
			{#if recentActivity.length === 0}
				<p class="mt-3 text-sm text-muted-foreground">
					No recent activity. Start participating to earn BIG-R.
				</p>
			{:else}
				<ul class="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
					{#each recentActivity as item (item.label + item.kind)}
						<li class="flex items-center justify-between gap-4 px-4 py-3 text-sm">
							<span class="text-foreground">{item.label}</span>
							<span class="shrink-0 text-muted-foreground">{item.when}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section class="rounded-lg border border-border bg-card p-4">
			<h3 class="font-semibold text-foreground">Round progress</h3>
			<p class="mt-1 text-sm text-muted-foreground">Round {epoch}</p>
			{#if epochDuration > 0}
				<div class="mt-4">
					<BlockHeightProgressBar
						currentBurnHeight={currentHeight}
						startBurnHeight={epochStart}
						stopBurnHeight={epochEnd}
					/>
				</div>
			{/if}
			<p class="mt-4 text-sm text-muted-foreground">Prize pool this round: 10,000 BIG</p>
			<p class="text-sm font-medium tabular-nums text-foreground">
				Your estimated share: {fmtNumber(estimatedShare)} BIG
			</p>
			<a
				href="{base}/reputation"
				class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			>
				Claim previous round
				<ArrowRight class="h-4 w-4" aria-hidden="true" />
			</a>
		</section>
	</div>
</div>
