<script lang="ts">
	import { onMount } from 'svelte';
	import { Banner } from '@bigmarket/bm-ui';
	import { getStxAddress } from '@bigmarket/bm-common';
	import {
		getDomain,
		newVoteMessage,
		postVoteMessage
	} from '../../../../../core/app/loaders/governance/voting_sip18';
	import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';
	import { stacks } from '@bigmarket/sdk';
	import type { SignatureData, VoteMessage, VotingEventProposeProposal } from '@bigmarket/bm-types';
	import { getTransaction } from '$lib/core/app/loaders/walletLoaders';
	const appConfig = $derived(requireAppConfig($appConfigStore));

	let {
		proposal,
		votingPower = 0,
		onSip18Vote
	}: {
		proposal: VotingEventProposeProposal;
		votingPower?: number;
		onSip18Vote: (data: unknown) => void;
	} = $props();
	let errorMessage = $state<string | undefined>(undefined);
	let txId = $state('');
	// let canVote = $state(true);
	const explorerUrl = $derived(
		stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, txId)
	);
	const amountStx = $derived(votingPower);

	const castVote = async (forVote: boolean) => {
		const voteMessage: VoteMessage = await newVoteMessage(
			proposal,
			forVote,
			amountStx,
			getStxAddress()
		);
		const domain = getDomain(appConfig);
		const signature: SignatureData | null = await stacks.requestVoteMessageSignature(
			voteMessage,
			domain
		);
		if (signature) {
			const hash = stacks.dataHashSip18(domain, voteMessage);
			const result = await postVoteMessage(hash, {
				message: voteMessage,
				signature: signature
			});
			console.log('Post result:', result);
			onSip18Vote({ result, voteMessage });
		}
	};

	// if (votingPower === 0 || votingPower < 1) {
	// 	canVote = false;
	// }
	const lookupTransaction = async (txId: string) => {
		return await getTransaction(appConfig.VITE_STACKS_API, txId);
	};

	onMount(async () => {
		if (localStorage.getItem('VOTED_TXID_3' + getStxAddress())) {
			const txIdObj = localStorage.getItem('VOTED_TXID_3' + getStxAddress());
			if (txIdObj) {
				const potentialTxId = JSON.parse(txIdObj).txId;
				const tx = await lookupTransaction(potentialTxId);
				if (tx && tx.tx_status === 'pending' && tx.sender_address === getStxAddress()) {
					txId = potentialTxId;
				} else {
					if (tx.sender_address === getStxAddress()) {
						localStorage.removeItem('VOTED_TXID_3' + getStxAddress());
					}
				}
			}
		}
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
		{:else}
			<div class="flex w-full justify-start gap-x-4">
				<button
					onclick={() => {
						errorMessage = undefined;
						castVote(true);
					}}
					class="border-bitcoinorange focus-visible:outline-primary-500/50 w-[150px] items-center justify-center gap-x-1.5 rounded-xl border bg-black px-4 py-2 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:inline-flex"
				>
					VOTE YES
				</button>
				<button
					onclick={() => {
						errorMessage = undefined;
						castVote(false);
					}}
					class="border-bitcoinorange focus-visible:outline-primary-500/50 w-[150px] items-center justify-center gap-x-1.5 rounded-xl border bg-black px-4 py-2 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:inline-flex"
				>
					VOTE NO
				</button>
			</div>
			{#if errorMessage}
				<div class="flex w-full justify-start gap-x-4">
					{errorMessage}
				</div>
			{/if}
		{/if}
	</div>
</div>
