<script lang="ts">
	import ReputationClaims from '$lib/components/reputation/ReputationClaims.svelte';
	import { getReputationContractData } from '$lib/core/app/loaders/reputationLoaders';
	import { getUserReputation } from '$lib/core/server/loaders/reputationLoaders';
	import { userReputationStore, walletState } from '@bigmarket/bm-common';
	import type { ReputationContractData, ReputationByUserContractData } from '@bigmarket/bm-types';
	import { fmtNumber } from '@bigmarket/bm-utilities';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
	import { CheckCircle2, Droplet, Hammer, Scale, Target } from 'lucide-svelte';
	const appConfig = $derived(requireAppConfig($appConfigStore));

	let reputationData = $state<ReputationContractData | undefined>(undefined);
	let userReputationData = $state<ReputationByUserContractData | undefined>(undefined);
	let loaded = $state(false);

	const loggedIn = $derived(
		$walletState.status === 'connected' && ($walletState.accounts?.length ?? 0) > 0
	);

	const stxAddress = $derived(
		$walletState.status === 'connected'
			? ($walletState.accounts.find((a) => a.type === 'stx')?.address ?? '')
			: ''
	);

	const repScore = $derived(userReputationData?.weightedReputation ?? 0);

	const repActions = [
		{ icon: Target, label: 'Making a prediction' },
		{ icon: Hammer, label: 'Creating a market' },
		{ icon: Scale, label: 'Voting on a dispute' },
		{ icon: Droplet, label: 'Providing liquidity' },
		{ icon: CheckCircle2, label: 'Claiming winnings' }
	];

	$effect(() => {
		if (!loggedIn || !stxAddress) {
			reputationData = undefined;
			userReputationData = undefined;
			loaded = true;
			return;
		}

		let cancelled = false;
		loaded = false;

		(async () => {
			reputationData = await getReputationContractData();
			if (cancelled) return;

			if ($userReputationStore?.userReputationData) {
				userReputationData = $userReputationStore.userReputationData;
			} else {
				userReputationData = await getUserReputation(appConfig.VITE_BIGMARKET_API, stxAddress);
			}
			if (!cancelled) loaded = true;
		})();

		return () => {
			cancelled = true;
		};
	});
</script>

<div class="grid gap-8 lg:grid-cols-3">
	<div class="space-y-8 lg:col-span-2">
		<section>
			<h2 class="text-xl font-semibold text-foreground">Your reputation score</h2>
			<p class="mt-2 text-5xl font-bold tabular-nums text-primary">{fmtNumber(repScore)}</p>
			<p class="text-sm text-muted-foreground">pts earned from participating</p>
		</section>

		<section>
			<h3 class="font-semibold text-foreground">How you earned it</h3>
			<p class="mt-2 text-sm text-muted-foreground">
				Detailed per-action history is available on the reputation hub. Participate in markets and
				governance to grow your score each round.
			</p>
		</section>

		<section>
			<h3 class="font-semibold text-foreground">Claim your BIG rewards</h3>
			{#if loaded && reputationData && userReputationData}
				<div class="mt-4">
					<ReputationClaims {reputationData} {userReputationData} />
				</div>
			{:else if !loaded}
				<p class="mt-2 text-sm text-muted-foreground">Loading reputation…</p>
			{:else}
				<p class="mt-2 text-sm text-muted-foreground">
					Nothing to claim right now. Check back at the end of the round.
				</p>
			{/if}
		</section>
	</div>

	<aside class="rounded-lg bg-muted/30 p-5">
		<h3 class="font-semibold text-foreground">How reputation works</h3>
		<p class="mt-3 text-sm text-muted-foreground">
			Every time you predict, create a market, or vote on a dispute, you earn BIG-R reputation points.
			They're permanently tied to your wallet — you can't buy them, sell them, or transfer them.
		</p>
		<p class="mt-3 text-sm text-muted-foreground">
			At the end of every round (~monthly), 10,000 BIG is split between everyone who participated,
			based on their score.
		</p>
		<ul class="mt-4 space-y-2 text-sm">
			{#each repActions as action (action.label)}
				<li class="flex items-center gap-2 text-muted-foreground">
					<action.icon class="h-4 w-4 text-primary" aria-hidden="true" />
					<span class="text-foreground">{action.label}</span>
					<span class="text-xs">— earns points</span>
				</li>
			{/each}
		</ul>
	</aside>
</div>
