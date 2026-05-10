<script lang="ts">
  import type { PredictionMarketCreateEvent } from '@bigmarket/bm-types';
  import TvlChart from './do-charts/TVLChart.svelte';
  import StakeChart from './do-charts/StakeChart.svelte';
  import TVLChart from './do-charts/TVLChart.svelte';

  const { market, showTvl, showStake } = $props<{
		market: PredictionMarketCreateEvent;
    showTvl: boolean;
    showStake: boolean;
	}>();

</script>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-1">
  <!-- Total Staked Chart -->
  {#if showStake}
    <div class="w-full rounded-lg border border-purple-600/20 bg-zinc-100 p-5 shadow-sm dark:bg-zinc-800/80">
      <div class="space-y-2">
        {#if typeof window !== 'undefined'}
          <StakeChart height={300} simplified={false} {market} title={'Stake History'} />
        {/if}
      </div>
    </div>
  {/if}

  <!-- TVL Chart -->
  {#if showTvl}
    <div
      class="w-full rounded-lg border border-purple-600/20 bg-zinc-100 p-5 text-gray-900 shadow-sm dark:bg-zinc-800/80 dark:text-gray-100"
    >
      <div class="space-y-2">
        {#if typeof window !== 'undefined'}
          <TVLChart height={300} {market} title={'TVL'} />
        {/if}
      </div>
    </div>
  {/if}
</div>
