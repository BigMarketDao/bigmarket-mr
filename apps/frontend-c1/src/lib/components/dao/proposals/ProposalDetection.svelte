<script lang="ts">
	import { lookupContract } from '@bigmarket/bm-helpers';
	import type { FundingData } from '@bigmarket/bm-helpers';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { Banner } from '@bigmarket/bm-ui';
	import { getProposalLatest } from '../../../core/app/loaders/governance/proposals';
	import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';
	const appConfig = $derived(requireAppConfig($appConfigStore));

	let { onDetectProposal }: { onDetectProposal: (contractId: string) => void } = $props();
	let contractId: string;
	let fundingData: FundingData | undefined;
	let contract: any | undefined;
	let submission: string = '';

	let message: string | undefined;

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
		message = 'contract found: ' + contract.tx_id;
		if (contract.error) {
			message = contract.error;
		} else {
			onDetectProposal(contractId);
		}
	};

	const processProposal = async (fundedSubmission: boolean) => {
		if (!contract) {
			message = 'Contract not found - please deploy your proposal';
			return;
		}
		if (fundedSubmission) submission = 'public';
		else submission = 'core';
		message = 'Processing this proposal and adding to DAO';
		if (contract) {
			if (contract && !contract.error) {
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
		}
	};

	onMount(async () => {
		const tempId = page.url.searchParams.get('tentativeCId');
		if (tempId) {
			contractId = tempId;
			await lookup();
			processProposal(true);
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

<div class="w-full">
	<div class="flex w-full flex-col gap-y-4">
		<p>Enter proposal contract id</p>
		<input
			bind:value={contractId}
			on:keyup={() => lookup()}
			type="text"
			id="propose-contract"
			class="w-full rounded-md border p-3 text-black"
		/>
		{#if message}
			<div class="my-3">
				<Banner bannerType="info" {message} />
			</div>
		{/if}
	</div>
</div>
