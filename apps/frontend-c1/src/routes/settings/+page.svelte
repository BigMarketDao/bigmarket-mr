<script lang="ts">
	import { signAdminMessage } from '$lib/core/app/loaders/governance/voting_sip18';
	import type { ContractBalances, PredictionContractData } from '@bigmarket/bm-types';
	import { onMount } from 'svelte';
	import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';
	import {
		daoConfigStore,
		requireContractViewDataClient,
		requireDaoConfig
	} from '$lib/stores/config/daoConfigStore';
	import { daoOverviewStore, getStxAddress, readBaseDaoEvents } from '@bigmarket/bm-common';
	import { Bulletin, PageContainer } from '@bigmarket/bm-ui';
	import DaoHero from '$lib/components/dao/DaoHero.svelte';
	import { stacks } from '@bigmarket/sdk';
	import { isCoordinator } from '$lib/core/tools/security';
	import ContractBalanceTable from '$lib/components/settings/ContractBalanceTable.svelte';
	import {
		resolveMarketsCategorical,
		resolveMarketsScalar,
		resolveMarketsUndisputed
	} from '$lib/core/app/loaders/settingsLoader';

	let data: PredictionContractData = $daoOverviewStore.contractData;
	let contractBalances: ContractBalances | null = $state(null);
	let scalarBalances: ContractBalances | null = $state(null);
	let treasuryBalances: ContractBalances | null = $state(null);
	let inited = $state(false);

	const appConfig = $derived(requireAppConfig($appConfigStore));
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));

	const readEvents = async () => {
		await signAdminMessage();
		await readBaseDaoEvents(
			appConfig.VITE_BIGMARKET_API,
			`${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO}`
		);
	};

	const rows = [
		{
			label: '# Markets',
			value: data.marketCounter,
			message: 'The total number of markets created on BigMarket'
		},
		{
			label: 'Market gating',
			value: data.creationGated,
			message: 'If gating is on, markets can only be created by known accounts.'
		},
		{
			label: 'Dispute Window',
			value: data.disputeWindowLength,
			message: 'The period (in Bitcoin blocks)...'
		},
		{
			label: 'Voting Window',
			value: data.marketVotingDuration,
			message: 'The voting window (in bitcoin blocks)...'
		},
		{
			label: 'Dispute voting majority',
			value: String(data.customMajority || '50%'),
			message: 'Voting to resolve disputes must be carried by at least this majority of votes'
		},
		{
			label: 'Resolution',
			value: data.resolutionAgent,
			message: 'The AI agent account. Agents are able to create and resolve markets.',
			isAddress: true
		},
		{
			label: 'Dev Fund',
			value: data.devFund,
			message: 'Account controlling the development fund',
			isAddress: true
		},
		{
			label: 'DAO Treasury',
			value: data.daoTreasury,
			message: 'The DAO treasury contract - see below for balance info',
			isAddress: true
		}
	];
	onMount(async () => {
		data.marketInitialLiquidity = 100000000; // minimum market liquidity in STX
		contractBalances = $daoOverviewStore.contractBalances;
		scalarBalances = $daoOverviewStore.scalarBalances;
		treasuryBalances = $daoOverviewStore.treasuryBalances;

		const client = requireContractViewDataClient();
		const t = await client.getPredictionContractData(
			appConfig.VITE_STACKS_API,
			daoConfig.VITE_DAO_DEPLOYER,
			daoConfig.VITE_DAO_MARKET_PREDICTING
		);
		console.log('readPredictionContractData: ', t);
		inited = true;
	});
</script>

<svelte:head>
	<title>BigMarket Settings</title>
	<meta name="description" content="BigMarketDAO and prediction market settings" />
</svelte:head>

<PageContainer>
	<DaoHero
		title="Settings and Balances"
		subtitle="Up to date market fees and treasury balances are displayed here"
	/>
	<div class="mx-auto max-w-4xl rounded-lg p-6 shadow-lg">
		<h1 class="my-6 border-b-2 border-gray-200 pb-2 text-2xl font-bold text-gray-300">
			Prediction Market Settings
		</h1>
		{#if !data}
			<div class="place-content-start self-start align-top">Loading settings from contracts</div>
		{:else}
			<div class="mb-8 overflow-x-auto">
				<table
					class="min-w-full table-fixed border-collapse border border-gray-300 text-sm shadow-md"
				>
					<thead class="bg-gray-200 text-left">
						<tr>
							<th class="w-[30%] border border-gray-300 px-4 py-2">Field</th>
							<th class="w-[70%] border border-gray-300 px-4 py-2">Value</th>
						</tr>
					</thead>
					<tbody class="bg-white dark:bg-gray-900">
						{#each rows as row (row.label)}
							<tr
								class="border-b border-gray-300 transition hover:bg-gray-100 dark:hover:bg-gray-800"
							>
								<td
									class="border border-gray-300 px-4 py-2 font-medium text-gray-700 dark:text-gray-300"
								>
									{row.label}
								</td>
								<td class="border border-gray-300 px-4 py-2 text-gray-900 dark:text-gray-100">
									<div class="max-w-full whitespace-normal">
										<Bulletin message={row.message}>
											{#snippet title()}
												<span class="text-sm font-medium hover:underline">
													{#if row.isAddress}
														<a
															href={stacks.explorerAddressUrl(
																appConfig.VITE_NETWORK,
																appConfig.VITE_STACKS_EXPLORER,
																row.value as string
															)}
															target="_blank"
															class="inline-block"
														>
															{row.value}</a
														>
													{:else}
														{row.value}
													{/if}
												</span>
											{/snippet}
										</Bulletin>

										<!-- <Bulletin message={row.message} trigger={row.label.replace(/\s+/g, '')}>
											<span slot="title" class="items-center gap-2 contain-inline-size">
												{row.value}
												<Icon src={AlertCircle} mini class="ml-2 inline-flex " />
												{#if row.isAddress}
													<a href={explorerAddressUrl(row.value)} target="_blank" class="inline-block"> </a>
												{/if}
											</span>
										</Bulletin> -->
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<h1 class="my-6 border-b-2 border-gray-200 pb-2 text-2xl font-bold text-gray-300">
				Fee Structure
			</h1>
			<div class="mb-8 flex flex-col gap-y-5 overflow-x-auto">
				<table class="min-w-full table-auto border-collapse border border-gray-300 shadow-lg">
					<thead>
						<tr class="bg-gray-200 text-left">
							<th class="border border-gray-300 px-4 py-2">Fee</th>
							<th class="border border-gray-300 px-4 py-2">Amount</th>
							<th class="border border-gray-300 px-4 py-2">Notes</th>
						</tr>
					</thead>
					<tbody>
						<tr class="border-b transition hover:bg-gray-700">
							<td class="border border-gray-300 px-4 py-2 text-gray-900 dark:text-gray-100"
								>Dev Fees</td
							>
							<td class="border border-gray-300 px-4 py-2 text-gray-900 dark:text-gray-100"
								>{data.devFeeBips / 100} %</td
							>
							<td class="border border-gray-300 px-4 py-2 text-gray-900 dark:text-gray-100"
								>Taken up front and used to build BigMarket</td
							>
						</tr>
						<tr class="border-b transition hover:bg-gray-700">
							<td class="border border-gray-300 px-4 py-2 text-gray-900 dark:text-gray-100"
								>Market Fees Max</td
							>
							<td class="border border-gray-300 px-4 py-2 text-gray-900 dark:text-gray-100"
								>0 to {data.marketFeeBipsMax / 100} %</td
							>
							<td class="border border-gray-300 px-4 py-2 text-gray-900 dark:text-gray-100"
								>Discretionary fee charged by market creators paid by winners</td
							>
						</tr>
					</tbody>
				</table>
			</div>
			<h1 class="my-6 border-b-2 border-gray-200 pb-2 text-2xl font-bold text-gray-300">
				Contracts & Balances
			</h1>
			<div class="mb-8 flex flex-col gap-y-5 overflow-x-auto text-gray-900 dark:text-gray-100">
				{#if inited && contractBalances && scalarBalances && treasuryBalances}
					<ContractBalanceTable
						contracts={[
							{ contract: daoConfig.VITE_DAO_TREASURY, balances: treasuryBalances },
							{ contract: daoConfig.VITE_DAO_MARKET_SCALAR, balances: scalarBalances },
							{ contract: daoConfig.VITE_DAO_MARKET_PREDICTING, balances: contractBalances }
							// { contract: daoConfig.VITE_DAO_MARKET_BITCOIN, balances: contractBalances }
						]}
					/>
				{/if}
			</div>
		{/if}
		{#if isCoordinator(getStxAddress())}
			<h1 class="my-6 border-b-2 border-gray-200 pb-2 text-2xl font-bold text-gray-300">
				Market Resolutions
			</h1>
			<div class="mb-8 flex flex-col gap-y-5 overflow-x-auto">
				<table class="min-w-full table-auto border-collapse border border-gray-300 shadow-lg">
					<thead>
						<tr class="bg-gray-200 text-left">
							<th class="border border-gray-300 px-4 py-2">Type</th>
							<th class="border border-gray-300 px-4 py-2">Resolve</th>
						</tr>
					</thead>
					<tbody>
						<tr class="border-b transition hover:bg-gray-700">
							<td class="border border-gray-300 px-4 py-2 text-gray-900 dark:text-gray-100"
								>Categorical</td
							>
							<td class="border border-gray-300 px-4 py-2 text-gray-900 dark:text-gray-100"
								><a
									href="/"
									onclick={(e) => {
										e.preventDefault();
										resolveMarketsCategorical();
									}}>resolve</a
								></td
							>
						</tr>
						<tr class="border-b transition hover:bg-gray-700">
							<td class="border border-gray-300 px-4 py-2 text-gray-900 dark:text-gray-100"
								>Scalar</td
							>
							<td class="border border-gray-300 px-4 py-2 text-gray-900 dark:text-gray-100"
								><a
									href="/"
									onclick={(e) => {
										e.preventDefault();
										resolveMarketsScalar();
									}}>resolve</a
								></td
							>
						</tr>
						<tr class="border-b transition hover:bg-gray-700">
							<td class="border border-gray-300 px-4 py-2 text-gray-900 dark:text-gray-100"
								>Undisputed</td
							>
							<td class="border border-gray-300 px-4 py-2 text-gray-900 dark:text-gray-100"
								><a
									href="/"
									onclick={(e) => {
										e.preventDefault();
										resolveMarketsUndisputed();
									}}>resolve</a
								></td
							>
						</tr>
						<tr class="border-b transition hover:bg-gray-700">
							<td class="border border-gray-300 px-4 py-2 text-gray-900 dark:text-gray-100"
								>Read events</td
							>
							<td class="border border-gray-300 px-4 py-2 text-gray-900 dark:text-gray-100"
								><a
									href="/"
									onclick={(e) => {
										e.preventDefault();
										readEvents();
									}}>read</a
								></td
							>
						</tr>
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</PageContainer>
