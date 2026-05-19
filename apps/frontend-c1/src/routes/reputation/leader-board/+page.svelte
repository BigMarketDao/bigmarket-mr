<script lang="ts">
	import ReputationLeaderBoard from '$lib/components/reputation/ReputationLeaderBoard.svelte';
	import { getReputationContractData } from '$lib/core/app/loaders/reputationLoaders';
	import type { ReputationContractData } from '@bigmarket/bm-types';
	import { PageContainer } from '@bigmarket/bm-ui';
	import {
		CLAIMING_TIER,
		CREATE_MARKET_TIER,
		fmtMicroToStxFormatted,
		fmtNumber,
		STAKING_TIER
	} from '@bigmarket/bm-utilities';
	import { Award, Clock, Medal, Target, TrendingUp, Trophy, Users, Zap } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let reputationData: ReputationContractData | undefined = $state(undefined);
	let error: string | null = $state(null);

	onMount(async () => {
		try {
			reputationData = await getReputationContractData();
		} catch {
			error = 'Failed to load contract data';
		}
	});

	const tierRequirements = $derived({
		claiming: CLAIMING_TIER,
		staking: STAKING_TIER,
		creating: CREATE_MARKET_TIER
	});
</script>

<svelte:head>
	<title>BigMarket - Reputation Leaderboard</title>
	<meta
		name="description"
		content="Top performers and reputation rankings in the BigMarket prediction markets ecosystem"
	/>
</svelte:head>

<PageContainer>
	{#if error}
		<div
			class="rounded-lg border border-destructive-border bg-destructive-soft p-4 text-center"
		>
			<p class="text-sm text-destructive">Error: {error}</p>
		</div>
	{:else}
		<div class="mb-8 md:flex md:items-center md:justify-between">
			<div class="min-w-0 flex-1">
				<h1 class="text-xl leading-7 font-semibold text-foreground sm:text-2xl">
					Leader
					<span class="text-primary">Board</span>
				</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					Track the <strong class="text-foreground">top performers</strong> in our prediction markets.
				</p>
			</div>
			<div class="mt-4 flex md:mt-0 md:ml-4">
				<a
					href="/reputation"
					class="inline-flex h-11 items-center rounded-md border border-border bg-muted px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:h-10"
				>
					Reputation Hub
				</a>
			</div>
		</div>

		<div class="grid gap-12 lg:grid-cols-5 lg:gap-16">
			<div class="space-y-12 lg:col-span-3">
				<section class="space-y-6">
					<div>
						<h2 class="text-2xl font-bold text-foreground">How Reputation Works</h2>
						<p class="mt-2 text-base text-muted-foreground">
							Your reputation score reflects your market performance and participation
						</p>
					</div>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div class="rounded-lg border border-border bg-card p-4 shadow-sm">
							<div
								class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
							>
								<Target class="h-5 w-5 text-primary" />
							</div>
							<h3 class="mb-2 text-base font-semibold text-foreground">Prediction Accuracy</h3>
							<p class="text-sm text-muted-foreground">
								Top reputation tier is reserved for winning predictions. Visit the
								<a
									class="text-primary hover:underline"
									href="/reputation#reputation-breakdown">reputation breakdown</a
								> for full details.
							</p>
						</div>

						<div class="rounded-lg border border-border bg-card p-4 shadow-sm">
							<div
								class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
							>
								<TrendingUp class="h-5 w-5 text-primary" />
							</div>
							<h3 class="mb-2 text-base font-semibold text-foreground">Market Activity</h3>
							<p class="text-sm text-muted-foreground">
								Regular participation and diverse market engagement boost your reputation score.
							</p>
						</div>

						<div class="rounded-lg border border-border bg-card p-4 shadow-sm">
							<div
								class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
							>
								<Users class="h-5 w-5 text-primary" />
							</div>
							<h3 class="mb-2 text-base font-semibold text-foreground">Community Impact</h3>
							<p class="text-sm text-muted-foreground">
								Vote on proposals, help resolve disputes, and earn reputation points along the way.
							</p>
						</div>
					</div>
				</section>

				<section class="space-y-6">
					<div>
						<h2 class="text-2xl font-bold text-foreground">
							Reputation <span class="text-primary">Rewards</span>
						</h2>
						<p class="mt-2 text-base text-muted-foreground">
							Higher reputation unlocks more platform capabilities and better rewards.
						</p>
					</div>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div class="rounded-lg border border-border bg-card p-4 shadow-sm">
							<div
								class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
							>
								<Trophy class="h-5 w-5 text-yellow-500" />
							</div>
							<h3 class="mb-2 text-base font-semibold text-foreground">Gold Tier</h3>
							<p class="text-sm text-muted-foreground">
								Create markets, resolve disputes, and earn the highest BIG token rewards.
							</p>
						</div>

						<div class="rounded-lg border border-border bg-card p-4 shadow-sm">
							<div
								class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted"
							>
								<Medal class="h-5 w-5 text-muted-foreground" />
							</div>
							<h3 class="mb-2 text-base font-semibold text-foreground">Silver Tier</h3>
							<p class="text-sm text-muted-foreground">
								Participate in governance, stake in any market, and earn enhanced rewards.
							</p>
						</div>

						<div class="rounded-lg border border-border bg-card p-4 shadow-sm">
							<div
								class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
							>
								<Award class="h-5 w-5 text-primary" />
							</div>
							<h3 class="mb-2 text-base font-semibold text-foreground">Bronze Tier</h3>
							<p class="text-sm text-muted-foreground">
								Start your journey with basic staking and earning capabilities.
							</p>
						</div>
					</div>
				</section>
			</div>

			<div class="lg:col-span-2">
				<div class="sticky top-8 space-y-6">
					<div class="rounded-xl border border-border bg-card shadow-sm">
						<div class="border-b border-border px-6 py-5">
							<h2 class="text-lg font-medium text-foreground">Current Rankings</h2>
						</div>
						<div class="p-6">
							<ReputationLeaderBoard />
						</div>
					</div>

					<div class="rounded-xl border border-border bg-card shadow-sm">
						<div class="border-b border-border px-6 py-5">
							<h2 class="text-lg font-medium text-foreground">Contract Stats</h2>
						</div>
						<div class="p-6">
							<div class="grid grid-cols-2 gap-4">
								<div class="rounded-lg border border-border bg-muted/30 p-4">
									<div class="mb-2.5 flex items-center gap-2">
										<Clock class="h-4 w-4 text-primary" />
										<span class="text-sm font-medium text-muted-foreground">Current Epoch</span>
									</div>
									<div class="mb-1 text-xl font-medium tracking-tight tabular-nums text-foreground">
										{reputationData?.currentEpoch || '?'}
									</div>
									<div class="text-xs leading-tight text-muted-foreground">
										~4,000 blocks duration
									</div>
								</div>

								<div class="rounded-lg border border-border bg-muted/30 p-4">
									<div class="mb-2.5 flex items-center gap-2">
										<Zap class="h-4 w-4 text-primary" />
										<span class="text-sm font-medium text-muted-foreground">Epoch Rewards</span>
									</div>
									<div class="mb-1 flex items-baseline gap-1.5">
										<span class="text-xl font-medium tracking-tight tabular-nums text-foreground">
											{fmtMicroToStxFormatted(reputationData?.rewardPerEpoch || 0)}
										</span>
										<span class="text-xs font-medium tracking-wide text-muted-foreground">BIG</span>
									</div>
									<div class="text-xs leading-tight text-muted-foreground">
										Total distribution
									</div>
								</div>

								<div class="rounded-lg border border-border bg-muted/30 p-4">
									<div class="mb-2.5 flex items-center gap-2">
										<TrendingUp class="h-4 w-4 text-primary" />
										<span class="text-sm font-medium text-muted-foreground">Total Weight</span>
									</div>
									<div class="mb-1 text-xl font-medium tracking-tight tabular-nums text-foreground">
										{fmtNumber(reputationData?.weightedSupply || 0)}
									</div>
									<div class="text-xs leading-tight text-muted-foreground">
										Combined reputation
									</div>
								</div>

								<div class="rounded-lg border border-border bg-muted/30 p-4">
									<div class="mb-2.5 flex items-center gap-2">
										<Target class="h-4 w-4 text-primary" />
										<span class="text-sm font-medium text-muted-foreground">Required Levels</span>
									</div>
									<div class="mb-1 text-xs font-medium tracking-wide text-foreground">
										L{tierRequirements.staking} • L{tierRequirements.creating} • L{tierRequirements.claiming}
									</div>
									<div class="text-xs leading-tight text-muted-foreground">
										stake, create, claim
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</PageContainer>
