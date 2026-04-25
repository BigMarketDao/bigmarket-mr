<script lang="ts">
	import { Banner } from '@bigmarket/bm-ui';
	import { TypoHeader } from '@bigmarket/bm-ui';
	import { base } from '$app/paths';
	import { chainStore, getStxAddress, isLoggedIn } from '@bigmarket/bm-common';
	import { showTxModal } from '@bigmarket/bm-common';
	import { watchTransaction } from '@bigmarket/bm-common';
	import { onMount } from 'svelte';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
	import {
		daoConfigStore,
		requireDaoConfig,
		requireDaoGovernanceClient
	} from '@bigmarket/bm-common';
	import type { VotingEventProposeProposal } from '@bigmarket/bm-types';
	import { getProposalStatus, isVoting } from '$lib/core/app/loaders/governance/proposals';
	import { fetchUserBalances } from '$lib/core/app/loaders/walletLoaders';
	import { fmtNumber, getTransaction } from '@bigmarket/bm-utilities';
	import { stacks } from '@bigmarket/sdk';
	const appConfig = $derived(requireAppConfig($appConfigStore));
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));
	const client = $derived(requireDaoGovernanceClient($daoConfigStore));

	// ---------- Helpers for $BIG (assume 6 decimals like micro-units) ----------
	const DECIMALS = 1_000_000;
	const toHuman = (micro: number) => micro / DECIMALS;
	const toHumanStr = (micro: number) =>
		toHuman(micro).toLocaleString(undefined, { maximumFractionDigits: 6 });
	const toMicro = (human: number) => Math.round(human * DECIMALS);

	// ---------- Props ----------
	let {
		proposal
	}: {
		proposal: VotingEventProposeProposal;
		votingPower?: number;
		onTxVote: (txId?: string) => void;
	} = $props();

	// ---------- Local state ----------
	let inited = $state(false);
	let errorMessage = $state<string | undefined>(undefined);
	let txId = $state<string | undefined>(undefined);

	let proposalTitle = $derived(proposal.proposalMeta.title);
	let proposalLink = $derived(`/dao/proposals/${proposal.proposal}`);
	let votingStatus = $derived(getProposalStatus(proposal));
	let totalVotesHuman = $derived(
		toHuman(proposal.proposalData.votesFor + proposal.proposalData.votesAgainst).toFixed(6)
	);

	let canVote = $state(true);

	// User $BIG balance (micro) and selected voting power (human)
	let bigBalance = $state(0); // in micro-$BIG
	let maxHuman = $state(0); // slider max (human $BIG)
	let selectedHuman = $state(0); // chosen via slider (human $BIG)
	const selectedMicro = $derived(toMicro(selectedHuman));

	// Hide buttons if selected == 0
	const showButtons = $derived(selectedMicro > 0);

	const castVote = async (vfor: boolean) => {
		errorMessage = undefined;

		if (!isLoggedIn()) {
			errorMessage = 'Please connect your wallet.';
			return;
		}
		if (selectedMicro <= 0) {
			errorMessage = 'Please choose a positive $BIG amount to vote with.';
			return;
		}
		if (selectedMicro > bigBalance) {
			errorMessage = `Maximum voting power is ${toHumanStr(bigBalance)} $BIG.`;
			selectedHuman = toHuman(bigBalance);
			return;
		}

		const votingContractName = proposal.extension.split('.')[1];
		const response = await client.vote(
			votingContractName,
			proposal.proposal,
			selectedMicro,
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
			showTxModal('Unable to process right now');
		}
	};

	const lookupTransaction = async (txId: string) => {
		return await getTransaction(appConfig.VITE_STACKS_API, txId);
	};

	onMount(async () => {
		proposalTitle = proposal.proposalMeta.title;
		proposalLink = `/dao/proposals/${proposal.proposal}`;
		votingStatus = getProposalStatus(proposal);
		// closingBlock = proposal.proposalData.burnEndHeight;
		totalVotesHuman = toHuman(
			proposal.proposalData.votesFor + proposal.proposalData.votesAgainst
		).toFixed(6);

		if (localStorage.getItem('VOTED_TXID_3' + getStxAddress())) {
			const txIdObj = localStorage.getItem('VOTED_TXID_3' + getStxAddress());
			if (txIdObj) {
				const potentialTxId = JSON.parse(txIdObj).txId;
				const tx = await lookupTransaction(potentialTxId);
				if (tx && tx.tx_status === 'pending' && tx.sender_address === getStxAddress()) {
					txId = potentialTxId;
				} else if (tx?.sender_address === getStxAddress()) {
					localStorage.removeItem('VOTED_TXID_3' + getStxAddress());
				}
			}
		}

		// Load $BIG balance
		const bals = await fetchUserBalances(
			appConfig.VITE_STACKS_API,
			appConfig.VITE_MEMPOOL_API,
			getStxAddress(),
			'',
			''
		);
		const bigContract = `${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO_GOVERNANCE_TOKEN}::bmg-token`;
		bigBalance = Number(bals?.tokenBalances?.fungible_tokens[bigContract]?.balance || 0);
		maxHuman = toHuman(bigBalance);

		// Seed slider from incoming votingPower (prop, micro) if provided
		if (bigBalance > 0) {
			selectedHuman = Math.min(toHuman(bigBalance / 2), maxHuman);
		} else {
			selectedHuman = 0;
		}

		canVote = maxHuman > 0;
		inited = true;
	});
</script>

{#if inited}
	<div class="mx-auto max-w-3xl space-y-6 rounded-lg p-6 shadow-lg">
		<!-- Voting Status -->
		<div class="flex items-center justify-between rounded-xl border border-white/50 px-4 py-2">
			<div class="flex items-center gap-2">
				<span class={`h-3 w-3 rounded-full ${isVoting(proposal) ? 'bg-green-500' : 'bg-red-500'}`}
				></span>
				<p
					class={`font-mono text-sm tracking-wide uppercase ${isVoting(proposal) ? 'text-green-400' : 'text-red-400'}`}
				>
					{votingStatus}
				</p>
			</div>
		</div>

		<!-- Proposal Title -->
		<TypoHeader level={3}>
			Proposal:
			<a class="hover:underline" href={`${base}${proposalLink}`}>{proposalTitle}</a>
		</TypoHeader>

		<!-- Voting Information -->
		<div class="space-y-1 rounded-lg py-6">
			<p>
				Current block: <span class="font-bold"
					>{fmtNumber($chainStore.stacks.burn_block_height)}</span
				>
			</p>
			<p>
				Voting ends at block <span class="font-bold"
					>{fmtNumber(proposal.proposalData.burnEndHeight)}</span
				>
			</p>
			<p>Total votes cast: <span class="font-bold">{totalVotesHuman} $BIG</span></p>
			<p>Total voting power (you): <span class="font-bold">{toHumanStr(bigBalance)} $BIG</span></p>
			<p>
				Check <a class="font-bold underline" href="/reputation">eligibility</a> for a $BIG token claim
			</p>
		</div>

		<!-- Voting Power Slider -->
		{#if canVote}
			<div class="rounded-lg border border-white/10 p-4">
				<label for="amt-slider" class="mb-2 block text-sm opacity-80"
					>Choose your voting power in $BIG</label
				>

				<input
					id="amt-slider"
					type="range"
					min="0"
					max={maxHuman}
					step={maxHuman > 0 ? maxHuman / 1000 : 0.000001}
					bind:value={selectedHuman}
					class="w-full"
				/>

				<div class="mt-3 flex items-center gap-3">
					<input
						type="number"
						min="0"
						max={maxHuman}
						step="0.000001"
						bind:value={selectedHuman}
						class="w-40 rounded-md border border-white/10 bg-black/20 p-2"
					/>
					<span class="opacity-80">/ {toHumanStr(bigBalance)} $BIG</span>
				</div>

				<p class="mt-2 text-sm">
					Selected voting power: <span class="font-bold"
						>{selectedHuman.toLocaleString(undefined, { maximumFractionDigits: 6 })} $BIG</span
					>
				</p>
			</div>
		{:else}
			<div class="rounded-lg bg-gray-800 p-4">
				Your $BIG balance is currently {toHumanStr(bigBalance)}.
			</div>
		{/if}

		<!-- Vote Options (hidden when selected = 0) -->
		{#if isVoting(proposal)}
			{#if showButtons}
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<button
						onclick={() => castVote(true)}
						class="rounded-lg bg-green-600 p-4 text-2xl font-bold transition hover:bg-green-500"
					>
						✅ Vote Yes ({selectedHuman.toLocaleString(undefined, { maximumFractionDigits: 6 })} $BIG)
					</button>
					<button
						onclick={() => castVote(false)}
						class="rounded-lg bg-red-600 p-4 text-2xl font-bold transition hover:bg-red-500"
					>
						❌ Vote No ({selectedHuman.toLocaleString(undefined, { maximumFractionDigits: 6 })} $BIG)
					</button>
				</div>
			{:else}
				<div class="rounded-lg bg-gray-800 p-4">Slide to choose how much $BIG to vote with.</div>
			{/if}
		{:else}
			<div class="rounded-lg bg-gray-700 p-6 text-center text-xl font-semibold">
				Voting has closed.
			</div>
		{/if}

		<!-- Errors -->
		{#if errorMessage}
			<div class="rounded-lg bg-red-700/60 p-3 text-sm">{errorMessage}</div>
		{/if}

		<!-- Transaction Details -->
		{#if txId}
			<div class="mb-4 flex w-full justify-start gap-x-4">
				<Banner
					bannerType="info"
					message={'your vote is being processed. See <a href="' +
						stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, txId) +
						'" target="_blank">' +
						txId +
						'</a>'}
				/>
			</div>
		{/if}
	</div>
{/if}
