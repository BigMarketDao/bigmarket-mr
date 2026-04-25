<script lang="ts">
	import { browser } from '$app/environment';
	import { runBatchClaims } from '$lib/core/app/loaders/reputationLoaders';
	import { fetchUserBalances } from '$lib/core/app/loaders/walletLoaders';
	import { isCoordinator } from '$lib/core/tools/security';
	import { connectWallet, getStxAddress, isLoggedIn, showTxModal } from '@bigmarket/bm-common';
	import type { ReputationContractData, UserReputationContractData } from '@bigmarket/bm-types';
	import { Banner } from '@bigmarket/bm-ui';
	import { fmtMicroToStx, fmtNumber, truncate } from '@bigmarket/bm-utilities';
	import { stacks } from '@bigmarket/sdk';
	import { Wallet } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
	import { daoConfigStore, requireDaoConfig } from '@bigmarket/bm-common';
	const appConfig = $derived(requireAppConfig($appConfigStore));
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));

	const { reputationData, userReputationData } = $props<{
		reputationData: ReputationContractData;
		userReputationData: UserReputationContractData;
	}>();

	let claimable = $state(0n);
	let canClaim = $state(true) as boolean;
	let errorMessage: string | undefined = $state(undefined);
	let walletConnected = isLoggedIn();
	let isLoading = $state(false);
	let bigBalance = $state(0);
	let txId: string | undefined = $state(undefined);

	const connect = async () => {
		await connectWallet();
		window.location.reload();
	};

	const claimTokens = async () => {
		if (!browser) return;
		errorMessage = undefined;
		if (!isLoggedIn()) {
			errorMessage = 'Please connect your wallet';
			return;
		}
		if (
			getStxAddress() !== daoConfig.VITE_DAO_DEPLOYER &&
			getStxAddress() !== 'SP22SW60674C0V6B5E234C7ZD2YR8WXKXXVC48GZR'
		) {
			return;
		}
		//const claims = await runBatchClaims();
		//console.log('lastClaimed: ', claims);
		try {
			let result = await runBatchClaims();
			txId = result as string;
			if (!result || typeof result === 'number')
				result = 'Claims process is running. BIG will be allocated to all users soon. ';
			else result = 'Response from claims process: ' + result;
			showTxModal(result);
			// isLoading = true;
			// const postConditions: Array<PostCondition> = [];
			// const postConditionFt = Pc.principal(`${daoConfigStore.VITE_DAO_DEPLOYER}.${daoConfigStore.VITE_DAO_TREASURY}`).willSendEq(claimable).ft(`${daoConfigStore.VITE_DAO_DEPLOYER}.${daoConfigStore.VITE_DAO_GOVERNANCE_TOKEN}`, 'bmg-token');
			// const bigrPc = await getBigRPostConditionNft(CLAIMING_TIER, getStxAddress());
			// if (bigrPc) postConditions.push(bigrPc);
			// postConditions.push(postConditionFt);
			// const functionName = 'claim-big-reward';

			// const response = await requestWallet(`${daoConfigStore.VITE_DAO_DEPLOYER}.${daoConfigStore.VITE_DAO_REPUTATION_TOKEN}`, functionName, [], [], 'allow');
			// if (response?.txid) {
			// 	showTxModal(response.txid);
			// 	watchTransaction(response.txid);
			// } else {
			// 	showTxModal('Unable to process right now');
			// }
		} catch (e) {
			errorMessage = e instanceof Error ? e.message : 'Failed to initiate claim';
		} finally {
			isLoading = false;
		}
	};

	onMount(async () => {
		if (isLoggedIn()) {
			const lastClaimed = await stacks
				.createReputationClient()
				.fetchLastEpochClaimed(
					appConfig.VITE_STACKS_API,
					daoConfig.VITE_DAO_DEPLOYER,
					daoConfig.VITE_DAO_REPUTATION_TOKEN,
					getStxAddress()
				);
			console.log('lastClaimed: ', lastClaimed);
			const decimals = 6n;
			const precision = 10n ** decimals;

			const rewardPerEpoch = BigInt(reputationData?.rewardPerEpoch || 0);
			const weightedSupply = BigInt(reputationData?.weightedSupply || 1);
			const weightedReputation = BigInt(userReputationData?.weightedReputation || 0);
			claimable = (weightedReputation * rewardPerEpoch * precision) / weightedSupply;
			claimable = claimable / precision;

			const currentE = reputationData.currentEpoch;
			const hasClaimed =
				typeof userReputationData.lastClaimedEpoch === 'number' &&
				Number(userReputationData.lastClaimedEpoch) >= currentE;
			if (hasClaimed || !userReputationData.lastClaimedEpoch) claimable = 0n;
			canClaim = claimable > 0 && !hasClaimed;

			const bals = await fetchUserBalances(
				appConfig.VITE_STACKS_API,
				appConfig.VITE_MEMPOOL_API,
				getStxAddress(),
				'',
				''
			);
			const bigContract = `${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO_GOVERNANCE_TOKEN}::bmg-token`;
			bigBalance = Number(bals?.tokenBalances?.fungible_tokens[bigContract]?.balance || 0);
		}
	});
</script>

<div class="space-y-4">
	<!-- Header row: Weighted Reputation + Current Epoch -->
	<div class="flex items-start justify-between">
		<div>
			<h3 class="text-base font-semibold text-gray-900 dark:text-white">
				Your Weighted Reputation
			</h3>
			<p class="mt-1 text-sm font-bold text-orange-900 dark:text-orange-100">
				{fmtNumber(userReputationData?.weightedReputation || 0)} BIGR
			</p>
		</div>
		<div class="text-right">
			<p class="text-xs text-gray-500 dark:text-gray-400">Current Epoch</p>
			<p class="text-sm font-semibold text-gray-900 dark:text-white">
				{reputationData.currentEpoch}
			</p>
		</div>
	</div>

	<p class="text-xs text-gray-500 dark:text-gray-400">
		Claim BIG after each epoch based on your BIGR. The higher your BIGR compared to everyone else,
		the larger your share.
	</p>

	{#if !walletConnected}
		<div
			class="rounded border border-gray-200 bg-white p-4 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900"
		>
			<Wallet class="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500" />
			<h4 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">Connect Your Wallet</h4>
			<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
				Connect to claim rewards and view balances
			</p>
			<button
				on:click={() => connect()}
				class="mt-3 inline-flex items-center rounded-md bg-orange-600 px-3 py-2 text-xs font-medium text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none dark:bg-orange-500 dark:hover:bg-orange-600"
			>
				Connect Wallet
			</button>
		</div>
	{:else}
		<!-- Wallet info tiles -->
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
			<div
				class="rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
			>
				<div class="text-[11px] text-gray-500 dark:text-gray-400">Your Wallet</div>
				<div class="mt-1 font-mono text-xs text-gray-900 dark:text-gray-100">
					{truncate(getStxAddress())}
				</div>
			</div>
			<div
				class="rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
			>
				<div class="text-[11px] text-gray-500 dark:text-gray-400">Last Epoch Claimed</div>
				<div class="mt-1 text-xs font-medium text-gray-900 dark:text-gray-100">
					{userReputationData.lastClaimedEpoch || '-'}
				</div>
			</div>
			<div
				class="rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
			>
				<div class="text-[11px] text-gray-500 dark:text-gray-400">Your BIG Balance</div>
				<div class="mt-1 text-xs font-medium text-gray-900 dark:text-gray-100">
					{fmtMicroToStx(bigBalance, 6)} BIG
				</div>
			</div>
		</div>

		<!-- Rewards available -->
		<div
			class="rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
		>
			<div class="flex items-center justify-between text-xs">
				<span class="text-gray-500 dark:text-gray-400">Rewards available</span>
				<span class="font-semibold text-gray-900 dark:text-gray-100"
					>{fmtMicroToStx(Number(claimable), 6)} BIG</span
				>
			</div>
		</div>

		{#if errorMessage}
			<div
				class="rounded-md border border-red-200 bg-red-50 p-3 text-center text-xs text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
			>
				{errorMessage}
			</div>
		{/if}

		{#if txId}
			<div
				class="rounded-md border border-purple-200 bg-purple-50 p-3 text-center text-xs text-purple-700 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
			>
				<Banner
					bannerType="info"
					message={`Transaction pending. <a href="${stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, txId)}" target="_blank">Track transaction</a>`}
				/>
			</div>
		{/if}

		<button
			on:click={claimTokens}
			class="inline-flex w-full items-center justify-center rounded-md bg-orange-600 px-3 py-2 text-xs font-medium text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 dark:bg-orange-500 dark:hover:bg-orange-600"
			disabled={isLoading || !canClaim || userReputationData.weightedReputation === 0}
		>
			{#if isLoading}
				<svg class="mr-1 -ml-1 h-3 w-3 animate-spin text-white" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
			{/if}
			{#if canClaim}
				Claim BIG Tokens
			{:else}
				No claims available
			{/if}
		</button>
		{#if isCoordinator(getStxAddress())}
			<p class="text-[11px] text-gray-500 dark:text-gray-400">
				<a href="/" on:click|preventDefault={() => claimTokens()}>Claims are run automatically</a> once
				per epoch — an epoch lasts roughly 1 weeks (1,000 blocks).
			</p>
		{/if}
	{/if}
</div>
