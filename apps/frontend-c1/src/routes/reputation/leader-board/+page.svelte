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

	// Tier requirements from contract
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

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<PageContainer>
		{#if error}
			<div
				class="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20"
			>
				<p class="text-sm text-red-600 dark:text-red-400">Error: {error}</p>
			</div>
		{:else}
			<!-- Hero Section: 2-Column Layout -->
			<div class="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
				<div class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
					<!-- <div class="mb-10 bg-white dark:bg-gray-900">
					<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
						<div class="md:flex md:items-center md:justify-between">
							<div class="min-w-0 flex-1">
								<h1 class="text-xl leading-7 font-semibold text-gray-900 sm:text-2xl dark:text-white">Leaderboard</h1>
								<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Track the <strong class="text-gray-900 dark:text-white">top performers</strong> in our prediction markets. Higher reputation means more influence and better rewards.</p>
							</div>
						</div>
					</div>
				</div> -->
					<div class="grid gap-12 lg:grid-cols-5 lg:gap-16">
						<!-- Left Content: 3 columns width -->
						<div class="space-y-16 lg:col-span-3">
							<!-- Main Hero -->
							<div class="max-w-3xl">
								<h1
									class="text-4xl leading-tight font-bold text-gray-900 lg:text-5xl dark:text-white"
								>
									Leader
									<span
										class="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent"
									>
										Board
									</span>
								</h1>
								<p class="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-400">
									Track the <strong class="text-gray-900 dark:text-white">top performers</strong> in our
									prediction markets. Higher reputation means more influence and better rewards.
								</p>
							</div>

							<!-- How Reputation Works -->
							<div class="space-y-6">
								<div>
									<h2 class="text-2xl font-bold text-gray-900 dark:text-white">
										How Reputation Works
									</h2>
									<p class="mt-2 text-base text-gray-600 dark:text-gray-400">
										Your reputation score reflects your market performance and participation
									</p>
								</div>

								<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
									<!-- Prediction Accuracy -->
									<div
										class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
									>
										<div
											class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700"
										>
											<Target class="h-5 w-5 text-orange-500" />
										</div>
										<h3 class="mb-2 text-base font-semibold text-gray-900 dark:text-white">
											Prediction Accuracy
										</h3>
										<p class="text-sm text-gray-600 dark:text-gray-400">
											Top reputation teir is reserved for winning predictions. Visit the <a
												class="text-blue-800 dark:text-blue-300"
												href="/reputation#reputation-breakdown">reputation breakdown</a
											> for full details.
										</p>
									</div>

									<!-- Market Activity -->
									<div
										class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
									>
										<div
											class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700"
										>
											<TrendingUp class="h-5 w-5 text-orange-500" />
										</div>
										<h3 class="mb-2 text-base font-semibold text-gray-900 dark:text-white">
											Market Activity
										</h3>
										<p class="text-sm text-gray-600 dark:text-gray-400">
											Regular participation and diverse market engagement boost your reputation
											score.
										</p>
									</div>

									<!-- Community Impact -->
									<div
										class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
									>
										<div
											class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700"
										>
											<Users class="h-5 w-5 text-orange-500" />
										</div>
										<h3 class="mb-2 text-base font-semibold text-gray-900 dark:text-white">
											Community Impact
										</h3>
										<p class="text-sm text-gray-600 dark:text-gray-400">
											Vote on proposals, help resolve disputes, join us in growing the ecosystem and
											earn reputation points along the way.
										</p>
									</div>
								</div>
							</div>

							<!-- Reputation Tiers -->
							<div class="space-y-6">
								<div>
									<h2 class="text-2xl font-bold text-gray-900 dark:text-white">
										Reputation <span class="text-orange-500">Rewards</span>
									</h2>
									<p class="mt-2 text-base text-gray-600 dark:text-gray-400">
										Higher reputation unlocks more platform capabilities and better rewards.
									</p>
								</div>

								<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
									<div
										class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
									>
										<div
											class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700"
										>
											<Trophy class="h-5 w-5 text-yellow-500" />
										</div>
										<h3 class="mb-2 text-base font-semibold text-gray-900 dark:text-white">
											Gold Tier
										</h3>
										<p class="text-sm text-gray-600 dark:text-gray-400">
											Create markets, resolve disputes, and earn the highest BIG token rewards.
											Priority access to new features.
										</p>
									</div>

									<div
										class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
									>
										<div
											class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700"
										>
											<Medal class="h-5 w-5 text-gray-400" />
										</div>
										<h3 class="mb-2 text-base font-semibold text-gray-900 dark:text-white">
											Silver Tier
										</h3>
										<p class="text-sm text-gray-600 dark:text-gray-400">
											Participate in governance, stake in any market, and earn enhanced rewards.
											Reduced fees and increased voting power.
										</p>
									</div>

									<div
										class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
									>
										<div
											class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700"
										>
											<Award class="h-5 w-5 text-orange-500" />
										</div>
										<h3 class="mb-2 text-base font-semibold text-gray-900 dark:text-white">
											Bronze Tier
										</h3>
										<p class="text-sm text-gray-600 dark:text-gray-400">
											Start your journey with basic staking and earning capabilities. Build
											reputation through consistent performance.
										</p>
									</div>
								</div>
							</div>
						</div>

						<!-- Right Sidebar: Leaderboard & Stats (2 columns width) -->
						<div class="lg:col-span-2">
							<div class="sticky top-8 space-y-6">
								<!-- Current Rankings Widget -->
								<div
									class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
								>
									<div class="border-b border-gray-200 px-6 py-5 dark:border-gray-700">
										<h2 class="text-lg font-medium text-gray-900 dark:text-white">
											Current Rankings
										</h2>
									</div>
									<div class="p-6">
										<ReputationLeaderBoard />
									</div>
								</div>

								<!-- Contract Stats Widget -->
								<div
									class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
								>
									<div class="border-b border-gray-200 px-6 py-5 dark:border-gray-700">
										<h2 class="text-lg font-medium text-gray-900 dark:text-white">
											Contract Stats
										</h2>
									</div>
									<div class="p-6">
										<div class="grid grid-cols-2 gap-4">
											<!-- Current Epoch -->
											<div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
												<div class="mb-2.5 flex items-center gap-2">
													<Clock class="h-4 w-4 text-orange-500" />
													<span class="text-sm font-medium text-gray-600 dark:text-gray-300"
														>Current Epoch</span
													>
												</div>
												<div
													class="mb-1 text-xl font-medium tracking-tight text-gray-800 dark:text-gray-100"
												>
													{reputationData?.currentEpoch || '?'}
												</div>
												<div class="text-xs leading-tight text-gray-500 dark:text-gray-400">
													~4,000 blocks duration
												</div>
											</div>

											<!-- Epoch Rewards -->
											<div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
												<div class="mb-2.5 flex items-center gap-2">
													<Zap class="h-4 w-4 text-orange-500" />
													<span class="text-sm font-medium text-gray-600 dark:text-gray-300"
														>Epoch Rewards</span
													>
												</div>
												<div class="mb-1 flex items-baseline gap-1.5">
													<span
														class="text-xl font-medium tracking-tight text-gray-800 dark:text-gray-100"
													>
														{fmtMicroToStxFormatted(reputationData?.rewardPerEpoch || 0)}
													</span>
													<span
														class="text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400"
														>BIG</span
													>
												</div>
												<div class="text-xs leading-tight text-gray-500 dark:text-gray-400">
													Total distribution
												</div>
											</div>

											<!-- Total Weight -->
											<div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
												<div class="mb-2.5 flex items-center gap-2">
													<TrendingUp class="h-4 w-4 text-orange-500" />
													<span class="text-sm font-medium text-gray-600 dark:text-gray-300"
														>Total Weight</span
													>
												</div>
												<div
													class="mb-1 text-xl font-medium tracking-tight text-gray-800 dark:text-gray-100"
												>
													{fmtNumber(reputationData?.weightedSupply || 0)}
												</div>
												<div class="text-xs leading-tight text-gray-500 dark:text-gray-400">
													Combined reputation
												</div>
											</div>

											<!-- Required Levels -->
											<div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
												<div class="mb-2.5 flex items-center gap-2">
													<Target class="h-4 w-4 text-orange-500" />
													<span class="text-sm font-medium text-gray-600 dark:text-gray-300"
														>Required Levels</span
													>
												</div>
												<div
													class="mb-1 text-xs font-medium tracking-wide text-gray-800 dark:text-gray-100"
												>
													L{tierRequirements.staking} • L{tierRequirements.creating} • L{tierRequirements.claiming}
												</div>
												<div class="text-xs leading-tight text-gray-500 dark:text-gray-400">
													stake, create, claim
												</div>
											</div>
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
</div>
