<script lang="ts">
  import type {
    PredictionMarketAccounting,
    PredictionMarketCreateEvent,
    UserLPShares,
  } from '@bigmarket/bm-types';
  import MarketLiquidity from './market/version2/MarketLiquidity.svelte';

  const {
    market,
    marketAccounting,
    userLPTokensShares,
    onRefreshUserData,
  } = $props<{
    market: PredictionMarketCreateEvent;
    marketAccounting: PredictionMarketAccounting;
    userLPTokensShares: UserLPShares | null;
    onRefreshUserData?: () => void | Promise<void>;
  }>();
</script>

<div class="space-y-6 lg:sticky lg:top-4">
  <MarketLiquidity {market} {marketAccounting} {userLPTokensShares} onTxSubmitted={onRefreshUserData} />
</div>
