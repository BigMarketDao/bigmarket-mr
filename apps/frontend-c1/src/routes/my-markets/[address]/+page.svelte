<script lang="ts">
	import UserClaim from '$lib/components/my-markets/UserClaim.svelte';
	import { connectWallet, isLoggedIn } from '@bigmarket/bm-common';
	import type {
		PredictionMarketClaimEvent,
		TokenPermissionEvent,
		UserMarketStake,
		UserStake
	} from '@bigmarket/bm-types';
	import { PageContainer } from '@bigmarket/bm-ui';
	import {
		calculateExpectedPayout,
		canUserClaim,
		fmtMicroToStx,
		getMarketToken
	} from '@bigmarket/bm-utilities';
	import { onMount } from 'svelte';
	import { stacks } from '@bigmarket/sdk';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
	import { daoConfigStore, requireDaoConfig } from '@bigmarket/bm-common';
	import { allowedTokenStore } from '@bigmarket/bm-common';

	const appConfig = $derived(requireAppConfig($appConfigStore));
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));

	const { data } = $props<{
		myMarketData: Array<UserMarketStake>;
		claims: Array<PredictionMarketClaimEvent>;
		totalClaims: number;
		tokens: TokenPermissionEvent[];
		address: string;
	}>();

	let myMarketData = $derived(data.myMarketData);
	let totalClaims = $derived(data.totalClaims);
	let componentKey: number = $state(0);

	// UI state
	let activeTab: 'all' | 'open' | 'resolved' = $state('all');
	let filterText: string = $state('');
	let isLoading: boolean = $state(false);
	let error: string | null = $state(null);
	let userStakes: Array<{ mid: string; shares: Array<number> }> = $state([]);
	let userTokens: Array<{ mid: string; tokens: Array<number> }> = $state([]);

	const connect = async () => {
		await connectWallet();
		window.location.reload();
	};

	// Derived metrics
	let claimablesCount = $state(0);

	type PendingTokenPayout = { micro: number; decimals: number; symbol: string };

	// Reactive filtering ($derived.by evaluates the function; $derived(fn) would store the function itself)
	const filteredMarkets = $derived.by(() => {
		if (!myMarketData || myMarketData.length === 0) return [];

		let filtered = myMarketData.slice();

		if (activeTab === 'open') {
			filtered = filtered.filter((m: UserMarketStake) => !m.marketData.concluded);
		} else if (activeTab === 'resolved') {
			filtered = filtered.filter((m: UserMarketStake) => m.marketData.concluded);
		}

		if (filterText && filterText.trim()) {
			const searchTerm = filterText.toLowerCase().trim().slice(0, 100);
			filtered = filtered.filter(
				(m: UserMarketStake) =>
					m.marketMeta?.name?.toLowerCase().includes(searchTerm) ||
					m.marketData?.categories?.some((cat) => {
						if (typeof cat === 'string') {
							return cat.toLowerCase().includes(searchTerm);
						} else if (cat && typeof cat === 'object' && 'label' in cat) {
							return String(cat.label || '')
								.toLowerCase()
								.includes(searchTerm);
						}
						return false;
					})
			);
		}

		return filtered;
	});

	// Pending payouts per token — $state so mutations in computePendingPayouts invalidate pendingPayoutsList
	let pendingPayoutsByToken = $state<Record<string, PendingTokenPayout>>({});
	const pendingPayoutsList = $derived.by(() => Object.values(pendingPayoutsByToken));

	const computePendingPayouts = async () => {
		pendingPayoutsByToken = {};
		claimablesCount = 0;
		userStakes = [];
		userTokens = [];
		if (!myMarketData) return;
		for (const market of myMarketData) {
			//if (market.marketData.concluded && !market.claimed && market.marketData.outcome !== undefined) {
			const userSharesMap =
				(await stacks
					.createMarketsClient(daoConfig)
					.fetchUserStake(
						appConfig.VITE_STACKS_API,
						market.marketId,
						market.extension.split('.')[0],
						market.extension.split('.')[1],
						data.address
					)) || ({} as UserStake);
			const userTokensMap =
				(await stacks
					.createMarketsClient(daoConfig)
					.fetchUserTokens(
						appConfig.VITE_STACKS_API,
						market.marketId,
						market.extension.split('.')[0],
						market.extension.split('.')[1],
						data.address
					)) || ({} as UserStake);
			const outcomeIndex = market.marketData.outcome!;
			const payout = calculateExpectedPayout(
				market.marketData,
				userSharesMap?.stakes || [],
				outcomeIndex
			);
			const token = getMarketToken(market.marketData.token, $allowedTokenStore);
			const tokenKey = market.marketData.token; // contract id
			const mid = market.marketId + '_' + market.marketType;
			userStakes.push({ mid, shares: userSharesMap?.stakes || [] });
			userTokens.push({ mid, tokens: userTokensMap?.stakes || [] });
			if (
				typeof market.marketData.outcome === 'number' &&
				canUserClaim(market.marketData.outcome, userSharesMap?.stakes || [])
			) {
				claimablesCount++;
			}
			if (!pendingPayoutsByToken[tokenKey]) {
				pendingPayoutsByToken[tokenKey] = {
					micro: 0,
					decimals: token.decimals,
					symbol: token.symbol
				};
			}
			pendingPayoutsByToken[tokenKey].micro += payout?.netRefund || 0;
			//}
		}
	};

	onMount(async () => {
		try {
			isLoading = true;
			await computePendingPayouts();
			isLoading = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load market data';
		}
	});
</script>

<svelte:head>
	<title>BigMarket - Staking and claiming history</title>
	<meta
		name="description"
		content="DAO Governance tokens to participate in BigMarket prediction markets on Bitcoin"
	/>
</svelte:head>

<PageContainer>
	<!-- Page Header -->
	<div class="bg-white dark:bg-gray-900">
		<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
			<div class="md:flex md:items-center md:justify-between">
				<div class="min-w-0 flex-1">
					<h1 class="text-xl leading-7 font-semibold text-gray-900 sm:text-2xl dark:text-white">
						My Markets
					</h1>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Track your positions, pending claims, and trading history across all markets
					</p>
				</div>
				<div class="mt-4 flex md:mt-0 md:ml-4">
					<button
						onclick={() => (window.location.href = '/')}
						class="inline-flex items-center rounded-md border-0 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
					>
						Browse Markets
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	{#if typeof window !== 'undefined' && isLoggedIn() && myMarketData}
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="grid gap-8 lg:grid-cols-1">
				<!-- Stats -->
				<div class="space-y-6">
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<!-- Total Positions -->
						<div
							class="overflow-hidden rounded border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
						>
							<div class="p-4">
								<div class="flex items-center">
									<div class="flex-shrink-0">
										<svg
											class="h-5 w-5 text-gray-400"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
											/>
										</svg>
									</div>
									<div class="ml-4 w-0 flex-1">
										<dl>
											<dt class="truncate text-xs font-medium text-gray-500 dark:text-gray-400">
												Total Positions
											</dt>
											<dd class="text-xl font-semibold text-gray-900 dark:text-white">
												{myMarketData?.length || 0}
											</dd>
										</dl>
									</div>
								</div>
							</div>
						</div>

						<!-- Successful Claims -->
						<div
							class="overflow-hidden rounded border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
						>
							<div class="p-4">
								<div class="flex items-center">
									<div class="flex-shrink-0">
										<svg
											class="h-5 w-5 text-green-400"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
									</div>
									<div class="ml-4 w-0 flex-1">
										<dl>
											<dt class="truncate text-xs font-medium text-gray-500 dark:text-gray-400">
												Successful Claims
											</dt>
											<dd class="text-xl font-semibold text-gray-900 dark:text-white">
												{totalClaims}
											</dd>
										</dl>
									</div>
								</div>
							</div>
						</div>

						<!-- Pending Claims -->
						<div
							class="overflow-hidden rounded border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
						>
							<div class="p-4">
								<div class="flex items-center">
									<div class="flex-shrink-0">
										<svg
											class="h-5 w-5 text-orange-400"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
									</div>
									<div class="ml-4 w-0 flex-1">
										<dl>
											<dt class="truncate text-xs font-medium text-gray-500 dark:text-gray-400">
												Pending Claims
											</dt>
											<dd class="text-xl font-semibold text-gray-900 dark:text-white">
												{claimablesCount}
											</dd>
										</dl>
									</div>
								</div>
							</div>
						</div>

						<!-- Pending Payouts -->
						<div
							class="overflow-hidden rounded border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
						>
							<div class="p-4">
								<div class="flex items-center">
									<div class="flex-shrink-0">
										<svg
											class="h-5 w-5 text-blue-400"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
											/>
										</svg>
									</div>
									<div class="ml-4 w-0 flex-1">
										<dl>
											<dt class="truncate text-xs font-medium text-gray-500 dark:text-gray-400">
												Pending Payouts
											</dt>
											<dd class="text-lg font-semibold text-gray-900 dark:text-white">
												{#if pendingPayoutsList.length === 1}
													{#each pendingPayoutsList as p (p.symbol)}
														{fmtMicroToStx(p.micro, p.decimals)} {p.symbol}
													{/each}
												{:else if pendingPayoutsList.length > 1}
													Multi-token
												{:else}
													0
												{/if}
											</dd>
										</dl>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Filters -->
				<div class="space-y-4">
					<!-- Filter tabs -->
					<div class="overflow-x-auto">
						<nav class="inline-flex items-center gap-5 whitespace-nowrap">
							<button
								type="button"
								onclick={() => (activeTab = 'all')}
								class={`relative text-xs font-medium transition-colors md:text-sm
									${
										activeTab === 'all'
											? 'text-orange-600 after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:bg-orange-600 dark:text-orange-400 dark:after:bg-orange-400'
											: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
									}`}
							>
								All
							</button>
							<button
								type="button"
								onclick={() => (activeTab = 'open')}
								class={`relative text-xs font-medium transition-colors md:text-sm
									${
										activeTab === 'open'
											? 'text-orange-600 after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:bg-orange-600 dark:text-orange-400 dark:after:bg-orange-400'
											: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
									}`}
							>
								Open
							</button>
							<button
								type="button"
								onclick={() => (activeTab = 'resolved')}
								class={`relative text-xs font-medium transition-colors md:text-sm
									${
										activeTab === 'resolved'
											? 'text-orange-600 after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:bg-orange-600 dark:text-orange-400 dark:after:bg-orange-400'
											: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
									}`}
							>
								Resolved
							</button>
						</nav>
					</div>

					<!-- Divider -->
					<div class="h-px w-full bg-gray-200 dark:bg-gray-800"></div>

					<!-- Search -->
					<div class="flex items-center justify-between">
						<div class="relative w-full md:w-72">
							<input
								type="text"
								placeholder="Search markets..."
								bind:value={filterText}
								maxlength="100"
								class="h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 pl-9 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-gray-600"
							/>
							<svg
								class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"
								/>
							</svg>
							{#if filterText}
								<button
									type="button"
									aria-label="Clear search"
									onclick={() => (filterText = '')}
									class="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none dark:hover:bg-gray-800"
								>
									<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							{/if}
						</div>

						<div class="text-xs font-medium text-gray-600 md:text-sm dark:text-gray-400">
							{filteredMarkets.length} of {myMarketData?.length || 0} markets
						</div>
					</div>
				</div>

				<!-- Table -->
				<div class="grid grid-cols-1 gap-4">
					<div
						class="rounded border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
					>
						<div class="px-4 py-3">
							<div class="flex items-center justify-between">
								<h2 class="text-base font-semibold text-gray-900 dark:text-white">Your Markets</h2>
								<span class="text-xs text-gray-500 dark:text-gray-400">
									{filteredMarkets.length} of {myMarketData?.length || 0} markets
								</span>
							</div>
						</div>
						<div>
							{#if error}
								<div
									class="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20"
								>
									<p class="text-sm text-red-600 dark:text-red-400">Error: {error}</p>
								</div>
							{:else if isLoading}
								<div class="flex items-center justify-center py-8">
									<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500"></div>
									<span class="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
								</div>
							{:else if filteredMarkets && filteredMarkets.length > 0}
								{#key componentKey}
									<div class="overflow-x-auto">
										<table class="w-full text-xs md:table-fixed">
											<thead class="border-b border-gray-100 text-left dark:border-gray-800">
												<tr>
													<th
														class="px-4 py-2 text-[11px] font-medium tracking-wider text-gray-500 md:w-[34%] dark:text-gray-400"
														>Market</th
													>
													<th
														class="px-4 py-2 text-[11px] font-medium tracking-wider text-gray-500 md:w-[12%] dark:text-gray-400"
														>Status</th
													>
													<th
														class="px-4 py-2 text-right text-[11px] font-medium tracking-wider text-gray-500 md:w-[18%] dark:text-gray-400"
														>Your Stake</th
													>
													<th
														class="px-4 py-2 text-right text-[11px] font-medium tracking-wider text-gray-500 md:w-[18%] dark:text-gray-400"
														>Total Staked</th
													>
													<th
														class="px-4 py-2 text-[11px] font-medium tracking-wider text-gray-500 md:w-[10%] dark:text-gray-400"
														>Token</th
													>
													<th
														class="px-4 py-2 text-right text-[11px] font-medium tracking-wider text-gray-500 md:w-[8%] dark:text-gray-400"
														>Action</th
													>
													<th
														class="px-4 py-2 text-right text-[11px] font-medium tracking-wider text-gray-500 md:w-[8%] dark:text-gray-400"
														>Expand</th
													>
												</tr>
											</thead>
											<tbody>
												{#if userTokens && userTokens.length === filteredMarkets.length}
													{#each filteredMarkets as market (market.marketId + '_' + market.marketType)}
														<UserClaim
															{market}
															tokens={userTokens.find(
																(o) => o.mid === market.marketId + '_' + market.marketType
															)?.tokens || []}
															stakes={userStakes.find(
																(o) => o.mid === market.marketId + '_' + market.marketType
															)?.shares || []}
														/>
													{/each}
												{/if}
											</tbody>
										</table>
									</div>
								{/key}
							{:else}
								<div
									class="rounded border border-gray-200 bg-gray-50 p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800"
								>
									<div class="mx-auto max-w-sm">
										<h3 class="text-base font-medium text-gray-900 dark:text-gray-100">
											No markets found
										</h3>
										<p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
											{#if filterText.trim()}
												Try adjusting your search or <button
													class="text-orange-500 underline"
													onclick={() => (filterText = '')}>clear filters</button
												>
											{:else}
												Start trading to see your positions here
											{/if}
										</p>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
			<div
				class="rounded border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900"
			>
				<h3 class="mb-2 text-base font-semibold text-gray-900 dark:text-white">
					Connect Your Wallet
				</h3>
				<p class="mb-4 text-xs text-gray-600 dark:text-gray-400">
					Connect to view your staking history and claims
				</p>
				<button
					type="button"
					onclick={() => connect()}
					class="w-full rounded-md bg-orange-500 px-4 py-2 text-xs font-medium text-white transition hover:bg-orange-600"
				>
					Connect Wallet
				</button>
			</div>
		</div>
	{/if}
</PageContainer>
