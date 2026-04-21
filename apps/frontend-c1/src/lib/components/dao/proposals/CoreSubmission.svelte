<script lang="ts">
	import { browser } from '$app/environment';
	import { Countdown } from '@bigmarket/bm-ui';
	import { Banner } from '@bigmarket/bm-ui';
	import Holding from '$lib/components/ui/Holding.svelte';
	import { fmtNumber } from '@bigmarket/bm-common';
	import { chainStore } from '@bigmarket/bm-common';
	import { showTxModal } from '@bigmarket/bm-common';
	import { explorerTxUrl, isLoggedIn } from '@bigmarket/bm-common';
	import { watchTransaction } from '@bigmarket/bm-common';
	import { fetchStacksInfo, getStacksNetwork } from '@bigmarket/bm-helpers';
	import { onMount } from 'svelte';
	import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';
	import { daoConfigStore, requireDaoGoveranceClient } from '$lib/stores/config/daoConfigStore';
	const appConfig = $derived(requireAppConfig($appConfigStore));
	const client = $derived(requireDaoGoveranceClient($daoConfigStore));

	let {
		contractId,
		submissionContractId
	}: {
		contractId: string;
		submissionContractId: string;
	} = $props();

	let proposalDelay = 2;
	let proposalDuration = $state(10);
	let errorMessage = $state<string | undefined>(undefined);
	let inited = $state(false);
	let burnHeightNow = $state(0);
	let componentKey = $state(0);
	let txId = $state<string | undefined>(undefined);
	let fundingMet = $state(false);
	let proposalStart = $state(0);

	const submitFlexible = async () => {
		if (!browser) return;
		if (!isLoggedIn()) {
			errorMessage = 'Please connect your wallet';
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
		const response = await client.corePropose(
			submissionContractId,
			contractId,
			proposalStart,
			proposalDuration,
			5100
		);
		if (response.txid) {
			showTxModal(response.txid);
			watchTransaction(response.txid);
		} else {
			showTxModal('Unable to process right now');
		}
	};

	const refreshClocks = () => {
		componentKey++;
	};

	onMount(async () => {
		console.log('CoreSubmission: ' + submissionContractId);
		const stacksInfo = await fetchStacksInfo(appConfig.VITE_STACKS_API);
		burnHeightNow = stacksInfo.burn_block_height;
		fundingMet = false;
		proposalStart = $chainStore.stacks.burn_block_height + proposalDelay;
		inited = true;
	});

	const explorerUrl = $derived(
		appConfig.VITE_STACKS_EXPLORER + '/txid/' + txId + '?chain=' + appConfig.VITE_NETWORK
	);
	const startHeightMessage = $derived(
		'Voting starts at ' +
			proposalStart +
			' in ' +
			fmtNumber(proposalStart - burnHeightNow) +
			' bitcoin blocks'
	);
	const durationMessage = $derived(
		'The voting window is ' +
			proposalDuration +
			' blocks, roughly ' +
			(proposalDuration / 144).toFixed(2) +
			' days, after voting starts.'
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
					</div>
					<!-- <p class="text-sm font-thin">(minimum contribution is 0.5 STX)</p> -->
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
						{#key componentKey}
							<div class="w-full">
								<label class="block" for="start-block">voting will begin at block</label>
								<input
									on:change={() => refreshClocks()}
									bind:value={proposalStart}
									type="number"
									id="start-block"
									class="h-[40px] w-60 rounded-lg border border-gray-400 px-2 py-1 text-gray-900 dark:text-gray-100"
									aria-describedby="Contribution"
								/>
								<span class="text-sm text-gray-900 dark:text-gray-100"
									>approx start <Countdown
										endBlock={proposalStart - burnHeightNow}
										scaleFactor={1}
									/></span
								>
							</div>
							<div class="w-full">
								<label class="block" for="duration-block"
									>voting open for minimum {proposalDuration} blocks</label
								>
								<input
									on:change={() => refreshClocks()}
									bind:value={proposalDuration}
									type="number"
									id="duration-block"
									class="h-[40px] w-60 rounded-lg border border-gray-400 px-2 py-1 text-gray-900 dark:text-gray-100"
									aria-describedby="Contribution"
								/>
								<span class="text-sm text-gray-700 dark:text-gray-300"
									>approx end <Countdown
										endBlock={proposalStart + proposalDuration - burnHeightNow}
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
						{/key}
						{#if errorMessage}<div>{errorMessage}</div>{/if}
					</div>
				</form>
			</div>
		</div>
	{:else}
		<Holding />
	{/if}
{/if}
