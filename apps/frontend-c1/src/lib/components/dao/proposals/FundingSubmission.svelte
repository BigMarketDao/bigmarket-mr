<script lang="ts">
	import { Countdown } from '@bigmarket/bm-ui';
	import Placeholder from '$lib/components/common/Placeholder.svelte';
	import { Banner } from '@bigmarket/bm-ui';
	import Holding from '$lib/components/ui/Holding.svelte';
	import { explorerTxUrl, fmtMicroToStx, fmtNumber } from '@bigmarket/bm-common';
	import { sessionStore } from '@bigmarket/bm-common';
	import { getStxAddress, isLoggedIn } from '@bigmarket/bm-common';
	import type { FundingData } from '@bigmarket/bm-helpers';
	import { fetchStacksInfo } from '@bigmarket/bm-helpers';
	import { onMount } from 'svelte';
	import { getCurrentProposalLink } from '../../../core/app/loaders/governance/proposals';
	import { showTxModal } from '@bigmarket/bm-common';
	import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';
	import { daoConfigStore, requireDaoGoveranceClient } from '$lib/stores/config/daoConfigStore';

	const appConfig = $derived(requireAppConfig($appConfigStore));
	const client = $derived(requireDaoGoveranceClient($daoConfigStore));

	let {
		fundingData,
		contractId,
		submissionContractId
	}: {
		fundingData: FundingData;
		contractId: string;
		submissionContractId: string;
	} = $props();

	let errorMessage = $state<string | undefined>(undefined);
	let inited = $state(false);
	const account = $sessionStore.keySets[appConfig.VITE_NETWORK];

	let amount = $state(500000);
	let txId = $state<string | undefined>(undefined);
	let fundingMet = $state(false);
	let proposalDuration = $state(0);
	let proposalStartDelay = $state(0);
	let startHeightMessage = $state('');
	let durationMessage = $state('');

	const submitOriginal = async () => {
		if (amount < 500000) return;
		const simpleContract = `${submissionContractId.split('.')[0]}.ede008-funded-proposal-submission-v5`;
		const response = await client.fundProposalSimple(
			simpleContract,
			contractId,
			amount,
			6600,
			getStxAddress()
		);
		showTxModal(response.txid || 'Unable to process right now');
	};

	const submitFlexible = async () => {
		if (!isLoggedIn()) {
			errorMessage = 'Please connect your wallet';
			return;
		}
		if (proposalStartDelay < 2) {
			errorMessage = 'Start delay minimum is 2 blocks';
			return;
		}
		if (proposalStartDelay > 500) {
			errorMessage = 'Start delay maximum is 500 blocks';
			return;
		}
		if (proposalDuration < 3) {
			errorMessage = 'Duration minimum is 3 blocks';
			return;
		}
		if (proposalDuration > 15000) {
			errorMessage = 'Duration maximum is 5000 blocks';
			return;
		}
		if (amount < 500000) {
			errorMessage = 'Half a STX required to fund';
			return;
		}
		const response = await client.fundProposal(
			submissionContractId,
			contractId,
			amount,
			proposalStartDelay,
			proposalDuration,
			6600,
			getStxAddress()
		);
		showTxModal(response.txid || 'Unable to process right now');
	};

	onMount(async () => {
		const stacksInfo = await fetchStacksInfo(appConfig.VITE_STACKS_API);
		const burnHeightNow = stacksInfo.burn_block_height;

		fundingMet = false;
		proposalDuration = fundingData.parameters.proposalDuration;
		proposalStartDelay = fundingData.parameters.proposalStartDelay;
		startHeightMessage =
			'The earliest start for voting is in ' +
			proposalStartDelay +
			' bitcoin blocks at ' +
			fmtNumber(burnHeightNow + proposalStartDelay);
		durationMessage =
			'The voting window is ' +
			proposalDuration +
			' blocks, roughly ' +
			(proposalDuration / 144).toFixed(2) +
			' days, after voting starts.';
		inited = true;
	});

	const explorerUrl = $derived(
		appConfig.VITE_STACKS_EXPLORER + '/txid/' + txId + '?chain=' + appConfig.VITE_NETWORK
	);
</script>

{#if inited}
	{#if !fundingMet}
		<div class="flex flex-col gap-y-2">
			<div class="mt-6 flex w-full flex-col gap-y-4">
				<div>
					<div>
						<p>{startHeightMessage}</p>
						<p>{durationMessage}</p>
						<p class="text-1xl">
							Fund proposal : {fmtMicroToStx(
								fundingData.parameters.fundingCost - fundingData.funding
							)} STX needed!
						</p>
					</div>
					<div class="my-3">
						<Banner bannerType="info" message="minimum contribution is 0.5 STX" />
					</div>
					{#if txId}
						<div>
							<Banner
								bannerType="info"
								message={`Transaction pending. <a href="${explorerTxUrl(txId)}" target="_blank">Track transaction</a>`}
							/>
						</div>
					{/if}
				</div>
				<form on:submit|preventDefault class="form-inline">
					<div class="flex w-full flex-col gap-y-4">
						<div class="w-full">
							<label class="block" for="start-block">voting will begin after</label>
							<input
								bind:value={proposalStartDelay}
								type="number"
								id="start-block"
								class="h-[40px] w-60 rounded-lg border border-gray-400 px-2 py-1 text-black"
								aria-describedby="Contribution"
							/>
							<span class="text-sm text-[#131416]/[0.64]"
								><Countdown endBlock={proposalStartDelay} scaleFactor={1} /></span
							>
						</div>
						<div class="w-full">
							<label class="block" for="duration-block"
								>voting open for minimum {proposalDuration} blocks</label
							>
							<input
								bind:value={proposalDuration}
								type="number"
								id="duration-block"
								class="h-[40px] w-60 rounded-lg border border-gray-400 px-2 py-1 text-black"
								aria-describedby="Contribution"
							/>
							<span class="text-sm text-[#131416]/[0.64]"
								><Countdown
									endBlock={proposalStartDelay + proposalDuration}
									scaleFactor={1}
								/></span
							>
						</div>
						<div>
							<button
								on:click={() => {
									submitFlexible();
								}}
								class="bg-success-01 border-success-600 focus-visible:outline-primary-500/50 w-52 shrink-0 items-center justify-center gap-x-1.5 rounded-xl border px-4 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
							>
								Submit proposal
							</button>
						</div>
						{#if errorMessage}<div>{errorMessage}</div>{/if}
					</div>
				</form>
			</div>
		</div>
	{:else}
		<Holding />
	{/if}
{:else}
	<Placeholder message="Vote info loading" link={getCurrentProposalLink('Not Found')} />
{/if}
