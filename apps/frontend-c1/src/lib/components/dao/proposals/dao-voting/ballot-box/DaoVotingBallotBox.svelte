<script lang="ts">
	import { Banner } from '@bigmarket/bm-ui';

	import { getStxAddress, isLoggedIn, showTxModal, watchTransaction } from '@bigmarket/bm-common';
	import { onMount } from 'svelte';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
	import {
		daoConfigStore,
		requireDaoConfig,
		requireDaoGovernanceClient
	} from '@bigmarket/bm-common';
	import type { VotingEventProposeProposal } from '@bigmarket/bm-types';
	import {
		fmtMicroToStxFormatted,
		fmtMicroToStxNumber,
		fmtStxMicro
	} from '@bigmarket/bm-utilities';
	import { stacks } from '@bigmarket/sdk';
	import { fetchUserBalances } from '$lib/core/app/loaders/walletLoaders';
	const appConfig = $derived(requireAppConfig($appConfigStore));
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));
	const client = $derived(requireDaoGovernanceClient($daoConfigStore));

	function getAddressId() {
		return getStxAddress().substring(5);
	}

	let {
		onTxVote,
		proposal,
		votingPower = 0
	}: {
		onTxVote: (txId?: string) => void;
		proposal: VotingEventProposeProposal;
		votingPower?: number;
	} = $props();

	let amountStx = $state(fmtMicroToStxNumber(votingPower));
	const balanceAtHeightF = fmtMicroToStxFormatted(votingPower);
	let bigBalance = $state(0);
	let errorMessage = $state<string | undefined>(undefined);
	let txId = $state<string | undefined>(undefined);
	// let canVote = $state(true);
	const explorerUrl = $derived(
		txId ? stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, txId) : ''
	);
	const castVote = async (vfor: boolean) => {
		if (!isLoggedIn()) {
			errorMessage = 'Please connect your wallet';
			return;
		}
		if (amountStx > votingPower) {
			errorMessage = 'Maximum voting power is ' + balanceAtHeightF + ' STX';
			amountStx = votingPower;
			return;
		}
		const amountUSTX = fmtStxMicro(amountStx);
		const votingContractName = proposal.extension.split('.')[1];
		const response = await client.vote(
			votingContractName,
			proposal.proposal,
			amountUSTX,
			vfor,
			getStxAddress()
		);
		if (response.success && response.txid) {
			showTxModal(response.txid);
			watchTransaction(
				appConfig.VITE_BIGMARKET_API,
				appConfig.VITE_STACKS_API,
				`${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO}`,
				response.txid
			);
		} else {
			localStorage.setItem('VOTED_FLAG' + getAddressId(), JSON.stringify(proposal.proposal));
			localStorage.setItem('VOTED_TXID_3' + getAddressId(), JSON.stringify({ txId }));
			onTxVote(txId);
		}
	};

	// if (votingPower === 0 || votingPower < 1) {
	// 	canVote = false;
	// }
	const lookupTransaction = async (txId: string) => {
		return await getTransaction(appConfig.VITE_STACKS_API, txId);
	};

	onMount(async () => {
		if (localStorage.getItem('VOTED_TXID_3' + getAddressId())) {
			const txIdObj = localStorage.getItem('VOTED_TXID_3' + getAddressId());
			if (txIdObj) {
				const potentialTxId = JSON.parse(txIdObj).txId;
				const tx = await lookupTransaction(potentialTxId);
				if (tx && tx.tx_status === 'pending' && tx.sender_address === getStxAddress()) {
					txId = potentialTxId;
				} else {
					if (tx.sender_address === getStxAddress()) {
						localStorage.removeItem('VOTED_TXID_3' + getAddressId());
					}
				}
			}
		}
		const bals = await fetchUserBalances(
			appConfig.VITE_STACKS_API,
			appConfig.VITE_MEMPOOL_API,
			getStxAddress(),
			'',
			''
		);
		const bigContract = `${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO_GOVERNANCE_TOKEN}::bmg-token`;
		bigBalance = Number(bals?.tokenBalances?.fungible_tokens[bigContract]?.balance || 0);
		amountStx = fmtMicroToStxNumber(votingPower);
	});
</script>

<div>
	<div class="flex flex-col gap-y-4">
		{#if txId}
			<div class="mb-3 max-w-xl">
				<Banner
					bannerType="warning"
					message={'Your vote is in the mempool and should be confirmed soon. See <a href="' +
						explorerUrl +
						'" target="_blank">explorer!</a>'}
				/>
			</div>
		{:else if bigBalance > 0}
			<div class="flex w-full justify-start gap-x-4">
				<button
					onclick={() => {
						errorMessage = undefined;
						castVote(true);
					}}
					class="focus-visible:outline-primary-500/50 border-bitcoinorange w-[150px] items-center justify-center gap-x-1.5 rounded-xl border bg-black px-4 py-2 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:inline-flex"
				>
					VOTE YES
				</button>
				<button
					onclick={() => {
						errorMessage = undefined;
						castVote(false);
					}}
					class="focus-visible:outline-primary-500/50 border-bitcoinorange w-[150px] items-center justify-center gap-x-1.5 rounded-xl border bg-black px-4 py-2 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:inline-flex"
				>
					VOTE NO
				</button>
			</div>
			{#if errorMessage}
				<div class="flex w-full justify-start gap-x-4">
					{errorMessage}
				</div>
			{/if}
		{:else}
			Your $BIG balance is currently {bigBalance}
		{/if}
	</div>
</div>
