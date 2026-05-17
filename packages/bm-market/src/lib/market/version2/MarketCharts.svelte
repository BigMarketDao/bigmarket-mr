<script lang="ts">
  import type { PredictionMarketCreateEvent } from '@bigmarket/bm-types';
  import StakeChart from './do-charts/StakeChart.svelte';
  import TVLChart from './do-charts/TVLChart.svelte';

  const { market, showTvl, showStake } = $props<{
		market: PredictionMarketCreateEvent;
    showTvl: boolean;
    showStake: boolean;
	}>();

</script>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-1">
  <!-- TODO: time-range tabs (5m / 1H / 6H / 1D / 1W / 1M / All) — requires new script state; tracked separately -->

  <!-- Total Staked Chart -->
  {#if showStake}
    <div class="w-full space-y-2 rounded-xl border border-border bg-card p-5 shadow-sm">
      {#if typeof window !== 'undefined'}
        <StakeChart height={300} simplified={false} {market} title={'Stake History'} />
      {/if}
    </div>
  {/if}

  <!-- TVL Chart -->
  {#if showTvl}
    <div class="space-y-2 rounded-xl border border-border bg-card p-5 text-foreground shadow-sm">
      {#if typeof window !== 'undefined'}
        <TVLChart height={300} {market} title={'TVL'} />
      {/if}
    </div>
  {/if}
</div>
