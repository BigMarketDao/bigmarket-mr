<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import ClaritySytaxHighlighter from '$lib/components/common/ClaritySytaxHighlighter.svelte';
	import { TypoHeader } from '@bigmarket/bm-ui';
	import { stacks } from '@bigmarket/sdk';
	import { type VotingEventProposeProposal } from '@bigmarket/bm-types';
	import { BadgeCheck, CheckCircle, CodeXml, ExternalLink, Recycle } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { isConcluded, isPostVoting } from '../../../core/app/loaders/governance/proposals';
	import { lookupContract, reclaimVotes } from '../../../core/app/loaders/governance/dao_api';
	import { Bulletin } from '@bigmarket/bm-ui';
	import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';
	const appConfig = $derived(requireAppConfig($appConfigStore));

	let {
		proposal,
		admin
	}: {
		proposal: VotingEventProposeProposal;
		admin: boolean;
	} = $props();
	let contract: any;
	let showSource = false;
	let inited = false;
	let errorMessage: string | undefined;

	const reclaimVotingTokens = async () => {
		const lockedVotes = await stacks.callContractReadOnly(appConfig.VITE_STACKS_API, data);
		const numbLocked = Number(lockedVotes.value);
		// warning - this is naive as the event is always present so leads to repeat claims
		// const lockedVotes = await getVotesByVoterAndProposal(getStxAddress(), proposal.proposal);
		if (numbLocked > 0) {
			await reclaimVotes(proposal, numbLocked);
		} else {
			errorMessage = 'nothing to recalim';
		}
	};

	const openSesame = async () => {
		if (showSource) {
			showSource = false;
			return;
		}
		contract = await lookupContract(appConfig.VITE_STACKS_API, proposal.proposal);
		showSource = true;
	};

	const openResults = async () => {
		if (admin) goto('/dao/proposals/sip18/' + proposal.proposal);
		goto('/dao/proposals/' + proposal.proposal);
	};

	onMount(async () => {
		inited = true;
	});
</script>

<div class="my-1 w-full">
	<div
		class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900"
	>
		<!-- header -->
		<div class="flex items-center justify-between">
			<TypoHeader>
				<a
					class="text-primary-600 text-lg font-semibold hover:underline"
					href={`${base}/dao/proposals/${proposal.proposal}`}
				>
					{#if proposal.proposalData.concluded}
						<BadgeCheck class="inline h-5 w-5 text-green-600" />
					{/if}
					{proposal.proposal.split('.')[1]}
				</a>
			</TypoHeader>
			<span class="text-sm text-gray-400">
				{isConcluded(proposal) ? 'Concluded' : isPostVoting(proposal) ? 'Voting finished' : 'Open'}
			</span>
		</div>

		<!-- actions -->
		<div class="mt-4 flex flex-wrap gap-4 text-sm">
			<button
				class="flex items-center gap-1 rounded-md px-3 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800"
				on:click|preventDefault={() => openSesame()}
			>
				<CodeXml class="h-4 w-4" /> Code
			</button>

			<a
				class="flex items-center gap-1 rounded-md px-3 py-1 text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-800"
				href={stacks.explorerAddressUrl(
					appConfig.VITE_NETWORK,
					appConfig.VITE_STACKS_EXPLORER,
					`${proposal.proposal.split('.')[0]}.${proposal.proposal.split('.')[1]}`
				)}
				target="_blank"
			>
				<ExternalLink class="h-4 w-4" /> Explorer
			</a>

			<button
				class="flex items-center gap-1 rounded-md px-3 py-1 text-green-600 hover:bg-green-50 dark:hover:bg-gray-800"
				onclick={(e) => {
					openResults();
					e.preventDefault();
				}}
			>
				{isPostVoting(proposal) ? 'Results' : 'Cast vote'}
				<CheckCircle class="h-4 w-4" />
			</button>

			{#if isConcluded(proposal)}
				<Bulletin message="Click to check for locked governance tokens for this proposal">
					<span slot="title" class="text-sm font-medium hover:underline">
						<!-- <Icon src={AlertCircle} mini class="ml-2 inline-flex " /> -->
						<button
							class="flex cursor-pointer items-center gap-1 rounded-md px-3 py-1 text-orange-600 hover:bg-orange-50 dark:hover:bg-gray-800"
							on:click|preventDefault={() => reclaimVotingTokens()}
						>
							<Recycle class="h-4 w-4" /> Check Reclaim ?
						</button>
					</span>
				</Bulletin>
			{/if}
		</div>

		<!-- error message -->
		{#if errorMessage}
			<p class="mt-2 text-sm text-red-500">{errorMessage}</p>
		{/if}

		<!-- source modal -->
		{#if showSource}
			<div
				class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
			>
				<ClaritySytaxHighlighter sourceCode={contract.source_code} />
			</div>
		{/if}
	</div>
</div>
{#if showSource}
	<div class="flex w-full">
		<div class="source-modal">
			<ClaritySytaxHighlighter sourceCode={contract.source_code} />
		</div>
	</div>
{/if}
