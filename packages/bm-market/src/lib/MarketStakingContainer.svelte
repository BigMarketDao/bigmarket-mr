<script lang="ts">
  import {
    ResolutionState,
    type UserStake,
    type PredictionMarketCreateEvent,
  } from '@bigmarket/bm-types';
  import MarketClaiming from './market/version2/MarketClaiming.svelte';
  import MarketVoting from './market/version2/MarketVoting.svelte';
  import MarketResolving from './market/version2/MarketResolving.svelte';
  import MarketStaking from './market/version2/MarketStaking.svelte';

  const { market, preselectIndex, userStake } = $props<{
		market: PredictionMarketCreateEvent;
		preselectIndex: number | -1;
		userStake: UserStake;
	}>();

</script>

<svelte:head>
  <title>Market Volumes</title>
  <meta name="description" content="View prediction market details and participate" />
</svelte:head>

<div class="space-y-6 lg:sticky lg:top-4">
  <!-- Trading Panel -->
  {#if market.marketData.resolutionState === ResolutionState.RESOLUTION_OPEN}
    <MarketStaking {market} {userStake} {preselectIndex} />
  {:else if market.marketData.resolutionState === ResolutionState.RESOLUTION_RESOLVING}
    <MarketResolving {market} {userStake} isCoordinator={false} />
  {:else if market.marketData.resolutionState === ResolutionState.RESOLUTION_DISPUTED}
    <MarketVoting {market} />
  {:else if userStake && market.marketData.resolutionState === ResolutionState.RESOLUTION_RESOLVED}
    <MarketClaiming {market} {userStake} />
  {/if}
</div>
