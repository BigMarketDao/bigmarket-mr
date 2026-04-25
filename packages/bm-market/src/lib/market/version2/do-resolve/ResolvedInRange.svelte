<script lang="ts">
  import { selectedCurrency } from '@bigmarket/bm-common';
  import { type PredictionMarketCreateEvent } from '@bigmarket/bm-types';
  import { formatFiat, getCategoryLabel, ORACLE_MULTIPLIER } from '@bigmarket/bm-utilities';

	const { market } = $props<{
		market: PredictionMarketCreateEvent;
	}>(); 
  let winningIndex = $derived(market.marketData.outcome || -1);

  // Optional number formatting util
  function formatRange(min: number, max: number): string {
    return `${formatFiat($selectedCurrency, min / ORACLE_MULTIPLIER, false)} → ${formatFiat($selectedCurrency, max / ORACLE_MULTIPLIER, false)}`;
  }
</script>

<div class="space-y-2 bg-transparent py-4 text-gray-900 dark:text-gray-100">
  <p class="text-2xl">Resolution in progress.</p>

  {#if winningIndex !== null}
    <p class="text-sm">
      Preliminary outcome is:
      <span class="text-primary-500 font-medium">
        {#if market.marketType === 2}
          {getCategoryLabel($selectedCurrency, winningIndex, market.marketData)}
          <!-- {formatRange(categories[winningIndex].min, categories[winningIndex].max)} -->
        {:else}
          <!-- {categories[winningIndex]} -->
          {getCategoryLabel($selectedCurrency, winningIndex, market.marketData)}
        {/if}
      </span>
    </p>
  {/if}

  <!-- <div class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
		{#each categories as category, index}
			<div class={`rounded border p-3 text-sm transition ${index === winningIndex ? 'border-primary text-primary bg-blue-50 font-semibold' : 'border-gray-200 hover:border-gray-300'}`}>
				{#if marketType === 2}
					{formatRange(category.min, category.max)}
				{:else}
					{category}
				{/if}
			</div>
		{/each}
	</div> -->
</div>
