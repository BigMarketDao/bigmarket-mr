<script lang="ts">
	import { page } from '$app/state';
	import { Banner } from '@bigmarket/bm-ui';
	import type { FundingData } from '@bigmarket/bm-types';
	import { onMount } from 'svelte';
	// import FundingSubmission from './FundingSubmission.svelte';
	import { InputField } from '@bigmarket/bm-ui';
	import { ParaContainer } from '@bigmarket/bm-ui';
	import CoreSubmission from './CoreSubmission.svelte';
	import { getProposalLatest } from '../../../core/app/loaders/governance/proposals';
	import { lookupContract } from '../../../core/app/loaders/governance/dao_api';
	import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';
	import { daoConfigStore, requireDaoConfig } from '$lib/stores/config/daoConfigStore';

	const appConfig = $derived(requireAppConfig($appConfigStore));
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));

	let contractId = $state('');
	let fundingData = $state<FundingData | undefined>(undefined);
	let contract = $state<Record<string, unknown> | undefined>(undefined);
	let submission = $state('core');
	let coreSubmissionContractId = $state('');
	let txId = $state<string | undefined>(undefined);
	let message = $state<string | undefined>(undefined);

	const lookup = async () => {
		message = undefined;
		if (!contractId) return;
		const potentialProp = await getProposalLatest(contractId);
		if (potentialProp && potentialProp.proposal) {
			message = 'This proposal has already been proposed.';
			return;
		}
		message = 'Processing this proposal and adding to DAO';
		contract = await lookupContract(appConfig.VITE_STACKS_API, contractId);
		message = 'contract found: ' + String(contract?.tx_id ?? '');
		processProposal();
		if (contract && (contract.statusCode as number) > 200) {
			contract = undefined;
			message = 'contract not found';
			processProposal();
		}
	};

	const processProposal = async () => {
		if (!contract) {
			message = 'Contract not found - please deploy your proposal';
			return;
		}
		submission = 'core';
		message = 'Processing this proposal and adding to DAO';
		if (!contract.error) {
			fundingData = {
				funding: 0,
				parameters: {
					fundingCost: 500000,
					proposalDuration: 72,
					proposalStartDelay: 6
				}
			};
			message = undefined;
		} else {
			message = 'Contract not found';
		}
	};

	const explorerUrl = $derived(
		appConfig.VITE_STACKS_EXPLORER + '/txid/' + txId + '?chain=' + appConfig.VITE_NETWORK
	);

	$effect(() => {
		if (contractId) lookup();
	});

	onMount(async () => {
		const tempId = page.url.searchParams.get('tentativeCId');
		coreSubmissionContractId = `${daoConfig.VITE_DAO_DEPLOYER}.bme003-0-core-proposals`;
		if (tempId) {
			contractId = tempId;
		}
	});
</script>

<svelte:head>
	<title>BigMarket DAO</title>
	<meta
		name="description"
		content="Governance of the Stacks Blockchain, Smart Contracts on Bitcoin"
	/>
</svelte:head>

<div class="max-w-4xl text-gray-900 dark:text-gray-100">
	<!-- Main Hero -->
	<div class="">
		<h1 class="text-5xl leading-tight font-bold text-gray-900 lg:text-6xl dark:text-white">
			Propose a
			<span class="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent"
				>change!</span
			>
		</h1>
		<ParaContainer
			>Deploy your proposal contract using stacks explorer sandbox - then paste the full name below</ParaContainer
		>
	</div>

	<!-- Modern Sale Timeline -->
	<div class="flex w-full flex-col gap-y-4">
		<InputField
			id="proposal"
			label="Proposal contract id"
			placeholder="Proposal contract id"
			bind:value={contractId}
		/>
		{#if message}
			<div class="my-3">
				<Banner bannerType="info" {message} />
			</div>
		{/if}
		{#if contract && contractId && fundingData && coreSubmissionContractId}
			{#if submission === 'public'}
				<!-- <FundingSubmission {contractId} {fundingData} submissionContractId={fundedSubmissionContractId} /> -->
			{:else if submission === 'core'}
				<CoreSubmission {contractId} submissionContractId={coreSubmissionContractId} />
			{/if}
		{/if}
	</div>

	{#if txId}
		<Banner
			bannerType="info"
			message={`<a href=${explorerUrl} target="_blank">View on explorer</a>`}
		/>
	{/if}
</div>
