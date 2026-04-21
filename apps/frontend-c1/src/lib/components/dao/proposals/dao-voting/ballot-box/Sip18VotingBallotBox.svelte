<script lang="ts">
	import { onMount } from 'svelte';

	import { getTransaction, type SignatureData } from '@bigmarket/bm-helpers';
	import { Banner } from '@bigmarket/bm-ui';
	import { fmtMicroToStxFormatted } from '@bigmarket/bm-common';
	import { verifySignature } from '$lib/components/dao/dao_api';
	import {
		dataHashSip18,
		verifySip18VoteSignature,
		voteMessageToTupleCV,
		type VoteMessage,
		type VotingEventProposeProposal
	} from '@bigmarket/bm-helpers';
	import { explorerTxUrl, getAddressId, getStxAddress } from '@bigmarket/bm-common';
	import { domain } from '@bigmarket/sip18-forum';
	import {
		newVoteMessage,
		postVoteMessage,
		signProposal
	} from '../../../../../core/app/loaders/governance/voting_sip18';
	import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';
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
	let progress = $state(0);
	let errorMessage = $state<string | undefined>(undefined);
	let txId = $state('');
	let canVote = $state(true);
	const explorerUrl = $derived(explorerTxUrl(txId));
	const amountStx = $derived(votingPower);
	const balanceAtHeightF = fmtMicroToStxFormatted(votingPower);

	const castVote = async (forVote: boolean) => {
		const voteMessage: VoteMessage = await newVoteMessage(
			proposal,
			forVote,
			amountStx,
			getStxAddress()
		);
		await signProposal(voteMessage, async function (signature: SignatureData) {
			console.log('Signature of the message', signature.signature);
			const hash = dataHashSip18(
				appConfig.VITE_NETWORK,
				appConfig.VITE_PUBLIC_APP_NAME,
				appConfig.VITE_PUBLIC_APP_VERSION,
				voteMessageToTupleCV(voteMessage)
			);
			console.log('domain:', domain);
			console.log('hash:' + hash);
			const sigres = verifySip18VoteSignature(
				appConfig.VITE_NETWORK,
				appConfig.VITE_PUBLIC_APP_NAME,
				appConfig.VITE_PUBLIC_APP_VERSION,
				voteMessage,
				signature.publicKey,
				signature.signature
			);
			if (!sigres) {
				//throw new Error('Signature is not valid');
			}
			const valid = await verifySignature(
				voteMessage,
				hash,
				signature.signature,
				proposal.extension
			);
			//voteMessage.timestamp = new Date().getTime(); - proove false is returned!
			const result = await postVoteMessage(hash, { message: voteMessage, signature });

			console.log('Post result:', result);
			onSip18Vote({ result, voteMessage });
		});
	};

	if (votingPower === 0 || votingPower < 1) {
		canVote = false;
	}
	const lookupTransaction = async (txId: string) => {
		return await getTransaction(appConfig.VITE_STACKS_API, txId);
	};

	onMount(async () => {
		if (localStorage.getItem('VOTED_TXID_3' + getAddressId())) {
			const txIdObj = localStorage.getItem('VOTED_TXID_3' + getAddressId());
			if (txIdObj) {
				const potentialTxId = JSON.parse(txIdObj).txId;
				const tx = await lookupTransaction(potentialTxId);
				if (
					tx &&
					tx.tx_status === 'pending' &&
					tx.sender_address === getStxAddress()
				) {
					txId = potentialTxId;
				} else {
					if (tx.sender_address === getStxAddress()) {
						localStorage.removeItem('VOTED_TXID_3' + getAddressId());
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
					on:click={() => {
						errorMessage = undefined;
						castVote(true);
					}}
					class="border-bitcoinorange focus-visible:outline-primary-500/50 w-[150px] items-center justify-center gap-x-1.5 rounded-xl border bg-black px-4 py-2 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:inline-flex"
				>
					VOTE YES
				</button>
				<button
					on:click={() => {
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
