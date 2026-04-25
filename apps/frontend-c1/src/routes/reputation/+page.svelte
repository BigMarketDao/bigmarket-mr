<script lang="ts">
	import { getReputationContractData } from '$lib/core/app/loaders/reputationLoaders';
	import { getUserReputation } from '$lib/core/server/loaders/reputationLoaders';
	import { getStxAddress, isLoggedIn, userReputationStore } from '@bigmarket/bm-common';
	import type {
		ReputationContractData,
		UserReputation,
		UserReputationContractData
	} from '@bigmarket/bm-types';
	import { PageContainer } from '@bigmarket/bm-ui';
	import { ParaContainer } from '@bigmarket/bm-ui';
	import { onMount } from 'svelte';
	import { fmtAmount, fmtMicroToStxNumber, fmtNumber } from '@bigmarket/bm-utilities';
	import ReputationClaims from '$lib/components/reputation/ReputationClaims.svelte';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';

	const appConfig = $derived(requireAppConfig($appConfigStore));

	let reputationData: ReputationContractData | undefined = $state(undefined);
	let userReputationData: UserReputationContractData | undefined = $state(undefined);

	/** Rows in the reputation breakdown table (static copy + on-chain balances by index). */
	type RepActionMeta = {
		id: number;
		name: string;
		code: string;
		/** Display weight; some rows use a formula label instead of a number. */
		weight: number | string;
		desc: string;
		tier: number;
	};

	type MergedRepItem = RepActionMeta & { balance: number };

	let mergedRepData: MergedRepItem[] = $state([]);

	const meta: RepActionMeta[] = [
		{
			id: 1,
			name: 'Claim winnings',
			code: 'u1',
			weight: 10,
			desc: 'Highest signal quality: foresight proven.',
			tier: 1
		},
		{
			id: 2,
			name: 'Create market',
			code: 'u2',
			weight: 8,
			desc: 'Drives platform growth, essential.',
			tier: 1
		},
		{
			id: 3,
			name: 'Dispute vote',
			code: 'u3',
			weight: 7,
			desc: 'Vote to resolve disputes',
			tier: 1
		},
		{
			id: 4,
			name: 'Liquidity contribution',
			code: 'u4',
			weight: 'sqrt(amt)',
			desc: 'Funds the DAO; compressed scale.',
			tier: 1
		},
		{
			id: 5,
			name: 'Predict category',
			code: 'u5',
			weight: 6,
			desc: 'Core participation, takes risk.',
			tier: 1
		},
		{
			id: 6,
			name: 'User comments (future)',
			code: 'u6',
			weight: 5,
			desc: 'Direct engagement, visible activity.',
			tier: 1
		},
		{
			id: 7,
			name: 'Transfer shares (buyer)',
			code: 'u7',
			weight: 4,
			desc: 'Supports secondary market activity.',
			tier: 1
		},
		{
			id: 8,
			name: 'Transfer shares (seller)',
			code: 'u8',
			weight: 4,
			desc: 'Same as above, mirrors buyer side.',
			tier: 1
		},
		{
			id: 9,
			name: 'Fill Share Order',
			code: 'u9',
			weight: 4,
			desc: 'Safeguards integrity, checks bad outcomes.',
			tier: 1
		},
		{
			id: 10,
			name: 'Proposal voting (internal)',
			code: 'u10',
			weight: 3,
			desc: 'Routine governance participation.',
			tier: 1
		},
		{
			id: 11,
			name: 'Proposal conclusion',
			code: 'u11',
			weight: 3,
			desc: 'Important, but execution-level task.',
			tier: 1
		},
		{
			id: 12,
			name: 'Reclaim votes',
			code: 'u12',
			weight: 2,
			desc: 'Cleanup action, limited impact.',
			tier: 1
		},
		{
			id: 13,
			name: 'Conclude market vote',
			code: 'u13',
			weight: 2,
			desc: 'Lower value compared to active market actions.',
			tier: 1
		},
		{
			id: 14,
			name: 'First wallet connect (future)',
			code: 'u14',
			weight: 1,
			desc: 'Onboarding incentive, one-time only.',
			tier: 1
		},
		{
			id: 20,
			name: 'Early contributor',
			code: 'u20',
			weight: 1,
			desc: 'Participation on testnet and pre-release, one-time only.',
			tier: 10
		}
		// continue up to 20 with placeholders if needed
	];

	onMount(async () => {
		const address = getStxAddress();
		reputationData = await getReputationContractData();
		if (!$userReputationStore) {
			userReputationData = await getUserReputation(appConfig.VITE_BIGMARKET_API, address!);
		} else {
			userReputationData = $userReputationStore.userReputationData;
		}
		// merge balances with meta
		const balances = userReputationData?.balances ?? [];
		mergedRepData = meta.map(
			(m, idx): MergedRepItem => ({
				...m,
				balance: balances[idx] ?? 0
			})
		);

		console.log(mergedRepData);

		userReputationStore.update((conf: UserReputation) => {
			conf.userReputationData = userReputationData;
			return conf;
		});
	});
</script>

<svelte:head>
	<title>BigMarket - Reputation & BIG Token Claims</title>
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
						Reputation Hub
					</h1>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Build your reputation, claim BIG, and view tier weights
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="grid gap-8 lg:grid-cols-1">
			<!-- Stats -->
			<div class="space-y-6">
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<!-- Current Epoch -->
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
											d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								</div>
								<div class="ml-4 w-0 flex-1">
									<dl>
										<dt class="truncate text-xs font-medium text-gray-500 dark:text-gray-400">
											Current Epoch
										</dt>
										<dd class="text-xl font-semibold text-gray-900 dark:text-white">
											{reputationData?.currentEpoch ?? '-'}
										</dd>
									</dl>
								</div>
							</div>
						</div>
						<p class="px-4 pb-4 text-xs text-gray-500 dark:text-gray-400">
							Epochs are 4000 bitcoin blocks - roughly monthly. Current epoch is bitcoin block
							height divided by this number.
						</p>
					</div>

					<!-- Rewards per Epoch -->
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
											Total Reward per Epoch
										</dt>
										<dd class="text-xl font-semibold text-gray-900 dark:text-white">
											{fmtNumber(
												Number(fmtMicroToStxNumber(reputationData?.rewardPerEpoch || 0).toFixed(2))
											)} BIG
										</dd>
									</dl>
								</div>
							</div>
						</div>
						<p class="px-4 pb-4 text-xs text-gray-500 dark:text-gray-400">
							The total $BIG awarded per epoch.
						</p>
					</div>

					<!-- Weighted Supply -->
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
											Weighted Supply
										</dt>
										<dd class="text-xl font-semibold text-gray-900 dark:text-white">
											{fmtAmount(reputationData?.weightedSupply || 0, 'stx') || '?'}
										</dd>
									</dl>
								</div>
							</div>
						</div>
						<p class="px-4 pb-4 text-xs text-gray-500 dark:text-gray-400">
							Sum of everyones weighted reputation score at each tier.
						</p>
					</div>

					<!-- Your Weighted Reputation -->
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
											d="M5 13l4 4L19 7"
										/>
									</svg>
								</div>
								<div class="ml-4 w-0 flex-1">
									<dl>
										<dt class="truncate text-xs font-medium text-gray-500 dark:text-gray-400">
											Your Weighted Reputation
										</dt>
										{#if typeof window !== 'undefined' && isLoggedIn() && userReputationData}
											<dd class="text-xl font-semibold text-orange-900 dark:text-orange-100">
												{fmtAmount(userReputationData?.weightedReputation, 'stx')}
											</dd>
										{:else}
											Connect wallet
										{/if}
									</dl>
								</div>
							</div>
						</div>
						<p class="px-4 pb-4 text-xs text-gray-500 dark:text-gray-400">
							Your weighted reputation - the weighted sum of your scores at each tier determines
							your $BIG share.
						</p>
					</div>
				</div>
			</div>

			<!-- Claims Card (moved above tiers) -->
			<div class="grid grid-cols-1 gap-4">
				<div
					class="rounded border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
				>
					<div class="px-4 py-4">
						{#if userReputationData && reputationData}
							<ReputationClaims {reputationData} {userReputationData} />
						{/if}
					</div>
				</div>
			</div>

			<!-- Tiers Table -->
			<div class="grid grid-cols-1 gap-4">
				<div
					class="rounded border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
				>
					<div class="px-4 py-3">
						<div class="flex items-center justify-between">
							<h2
								id="reputation-breakdown"
								class="text-base font-semibold text-gray-900 dark:text-white"
							>
								Reputation Breakdown
							</h2>
						</div>
						<ParaContainer
							>Table show how many points you have earned at each level. The tier weights are set by
							the DAO and reflect the relative importance of each tier.</ParaContainer
						>
					</div>
					<div>
						{#if reputationData}
							<div class="overflow-x-auto">
								<table
									class="w-full text-xs md:table-fixed"
									border="1"
									cellpadding="6"
									cellspacing="0"
								>
									<thead class="border-b border-gray-100 text-left dark:border-gray-800">
										<tr>
											<th
												class="px-4 py-2 text-[11px] font-medium tracking-wider text-gray-500 dark:text-gray-400"
												>Token Id</th
											>
											<th
												class="px-4 py-2 text-[11px] font-medium tracking-wider text-gray-500 dark:text-gray-400"
												>Points Earned</th
											>
											<th
												class="px-4 py-2 text-[11px] font-medium tracking-wider text-gray-500 dark:text-gray-400"
												>Tier Weight</th
											>
											<th
												class="px-4 py-2 text-[11px] font-medium tracking-wider text-gray-500 dark:text-gray-400"
												>Action</th
											>
											<th
												class="px-4 py-2 text-[11px] font-medium tracking-wider text-gray-500 dark:text-gray-400"
												>Reward</th
											>
											<th
												class="px-4 py-2 text-[11px] font-medium tracking-wider text-gray-500 dark:text-gray-400"
												>Description</th
											>
										</tr>
									</thead>
									<tbody>
										{#each mergedRepData as item (item.id)}
											<tr
												class="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/40"
											>
												<td>{item.id}</td>
												<td class="font-extrabold text-orange-900 dark:text-orange-100"
													>{item.balance}</td
												>
												<td>{1}</td>
												<td>{item.name}</td>
												<td>{item.weight}</td>
												<td>{item.desc}</td>
											</tr>
										{/each}
									</tbody>
								</table>

								<!-- <table class="w-full text-xs md:table-fixed">
                                      <thead class="border-b border-gray-100 text-left dark:border-gray-800">
                                          <tr>
                                              <th class="px-4 py-2 text-[11px] font-medium tracking-wider text-gray-500 dark:text-gray-400">Tier</th>
                                              <th class="px-4 py-2 text-right text-[11px] font-medium tracking-wider text-gray-500 dark:text-gray-400">Tier Weight</th>
                                              <th class="px-4 py-2 text-right text-[11px] font-medium tracking-wider text-gray-500 dark:text-gray-400">Total Supply</th>
                                              {#if typeof window !== 'undefined' && isLoggedIn()}<th class="px-4 py-2 text-right text-[11px] font-medium tracking-wider text-gray-500 dark:text-gray-400">Your Balance</th>{/if}
                                          </tr>
                                      </thead>
                                      <tbody>
                                          {#each reputationData.totalSupplies! as supply, index}
                                              <tr class="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/40">
                                                  <td class="px-4 py-3 align-middle text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                                                      {reputationData.tierMetaData[(index + 1) as BigRepTier].label}
                                                  </td>
                                                  <td class="px-4 py-3 text-right align-middle font-mono text-[11px] text-gray-900 tabular-nums dark:text-gray-100">
                                                      {reputationData.tierMetaData[(index + 1) as BigRepTier].weight}
                                                  </td>
                                                  <td class="px-4 py-3 text-right align-middle font-mono text-[11px] text-gray-900 tabular-nums dark:text-gray-100">{supply}</td>
                                                  {#if typeof window !== 'undefined' && isLoggedIn() && userReputationData}
                                                      <td class="px-4 py-3 text-right align-middle font-mono text-[11px] text-gray-900 tabular-nums dark:text-gray-100">{userReputationData.balances[index]}</td>
                                                  {/if}
                                              </tr>
                                          {/each}
                                      </tbody>
                                  </table> -->
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Claims Card moved above -->
		</div>
	</div>
</PageContainer>

<style>
	td {
		padding-left: 20px;
	}
</style>
