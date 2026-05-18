<script lang="ts">
	import { onMount } from 'svelte';
	import { ResolutionState, type PredictionMarketCreateEvent } from '@bigmarket/bm-types';
  import { getOutcomeMessage } from '@bigmarket/bm-utilities';
  import { chainStore, selectedCurrency } from '@bigmarket/bm-common';

	const { market } = $props<{
		market: PredictionMarketCreateEvent;
	}>();

	const bannerClass = $derived.by(() => {
		const state = market.marketData.resolutionState;
		if (state === ResolutionState.RESOLUTION_RESOLVED) {
			return 'border-success-border bg-success-soft text-success';
		}
		if (state === ResolutionState.RESOLUTION_DISPUTED) {
			return 'border-destructive-border bg-destructive-soft text-destructive';
		}
		return 'border-warning-border bg-warning-soft text-warning';
	});

	onMount(async () => {});
</script>

{#if market.marketData.resolutionState !== ResolutionState.RESOLUTION_OPEN}
	<div>
		<div class="flex items-start rounded-md border p-4 font-medium {bannerClass}">
			<svg
				class="h-6 w-6 shrink-0"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M13 16h-1v-4h-1m1-4h.01M12 8v.01M9 12h6m-6 4h6m-4-8h2m4 12H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2z"
				></path>
			</svg>
			<div class="flex flex-col">
				{#if market.marketData.resolutionState === ResolutionState.RESOLUTION_RESOLVING}
					<p class="ml-4 text-sm">
						Predictions are closed. The market is in the resolution process. Final results will be
						available soon.
					</p>
				{:else if market.marketData.resolutionState === ResolutionState.RESOLUTION_DISPUTED}
					<p class="ml-4 text-sm">
						Market resolution is disputed. The outcome will be determined by a Community Vote.
					</p>
				{:else if market.marketData.resolutionState === ResolutionState.RESOLUTION_RESOLVED}
					<p class="ml-4 text-sm tabular-nums">
						Market is resolved. The outcome is {@html getOutcomeMessage($chainStore.stacks.burn_block_height, $selectedCurrency, market)}.
					</p>
				{/if}
			</div>
		</div>
	</div>
{/if}
