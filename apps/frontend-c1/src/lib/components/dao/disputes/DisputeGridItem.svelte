<script lang="ts">
	import { TypoHeader } from '@bigmarket/bm-ui';
	import { getStxAddress } from '@bigmarket/bm-common';
	import { stacks } from '@bigmarket/sdk';
	import { base } from '$app/paths';
	import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';
	const appConfig = $derived(requireAppConfig($appConfigStore));
	import { callContractReadOnly } from '@bigmarket/bm-helpers';
	import { BadgeCheck, ExternalLink } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { reclaimMarketVotes } from '../../../core/app/loaders/governance/dao_api';
	import { principalCV, serializeCV, uintCV } from '@stacks/transactions';
	import type { MarketDisputeRecord } from '@bigmarket/bm-common';


	let { dispute }: { dispute: MarketDisputeRecord } = $props();
	let inited = false;
	let showVotes = false;
	let errorMessage: string | undefined;

	const isPostMarketVoting = () => {
		return false;
	};

	const openDetails = async () => {
		showVotes = !showVotes;
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
					href={`${base}/dispute/${dispute.marketId}/${dispute.marketType}`}
				>
					{#if dispute.resolveVote}
						<BadgeCheck class="inline h-5 w-5 text-green-600" />
					{/if}
					{dispute.marketName}
				</a>
			</TypoHeader>
			<button onclick={() => openDetails()} class="text-sm text-gray-400">
				Details
			</button>
		</div>

		<!-- actions -->
		<div class="mt-4 flex flex-wrap gap-4 text-sm">
			<a
				class="flex items-center gap-1 rounded-md px-3 py-1 text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-800"
				href={stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, dispute.txId ?? '')}
				target="_blank"
			>
				<ExternalLink class="h-4 w-4" /> Explorer
			</a>
		</div>

		<!-- error message -->
		{#if errorMessage}
			<p class="mt-2 text-sm text-red-500">{errorMessage}</p>
		{/if}

		<!-- source modal -->
	</div>
</div>
