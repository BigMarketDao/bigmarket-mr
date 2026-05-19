<script lang="ts">
	import { TypoHeader } from '@bigmarket/bm-ui';
	import { stacks } from '@bigmarket/sdk';
	import { base } from '$app/paths';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
	const appConfig = $derived(requireAppConfig($appConfigStore));
	import { BadgeCheck, ExternalLink } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import type { MarketDisputeRecord } from '@bigmarket/bm-types';

	let { dispute }: { dispute: MarketDisputeRecord } = $props();
	let showVotes = $state(false);
	let errorMessage = $state<string | undefined>(undefined);

	const openDetails = async () => {
		showVotes = !showVotes;
	};

	onMount(async () => {});
</script>

<div class="my-1 w-full">
	<div
		class="rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm"
	>
		<!-- header -->
		<div class="flex items-center justify-between">
			<TypoHeader>
				<a
					class="text-lg font-semibold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
					href={`${base}/dispute/${dispute.marketId}/${dispute.marketType}`}
				>
					{#if dispute.resolveVote}
						<BadgeCheck class="inline h-5 w-5 text-success" />
					{/if}
					{dispute.marketName}
				</a>
			</TypoHeader>
			<button
				type="button"
				onclick={() => openDetails()}
				class="text-sm text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			>
				Details
			</button>
		</div>

		<!-- actions -->
		<div class="mt-4 flex flex-wrap gap-4 text-sm">
			<a
				class="flex items-center gap-1 rounded-md px-3 py-1 text-community hover:bg-community-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
				href={stacks.explorerTxUrl(
					appConfig.VITE_NETWORK,
					appConfig.VITE_STACKS_EXPLORER,
					dispute.txId ?? ''
				)}
				target="_blank"
			>
				<ExternalLink class="h-4 w-4" /> Explorer
			</a>
		</div>

		<!-- error message -->
		{#if errorMessage}
			<p class="mt-2 text-sm text-destructive">{errorMessage}</p>
		{/if}

		<!-- source modal -->
	</div>
</div>
