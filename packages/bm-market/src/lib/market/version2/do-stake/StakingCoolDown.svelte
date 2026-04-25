<script lang="ts">
  import { allowedTokenStore, chainStore } from '@bigmarket/bm-common';
  import type {
    PredictionMarketCreateEvent,
    ScalarMarketDataItem,
    Sip10Data,
  } from '@bigmarket/bm-types';
  import { BlockHeightProgressBar } from '@bigmarket/bm-ui';
  import { fmtNumber, getMarketToken } from '@bigmarket/bm-utilities';

  let { market, userShares } = $props<{
    market: PredictionMarketCreateEvent;
    userShares: Array<number>;
	}>(); 

  let currentBlock = $derived($chainStore.stacks.burn_block_height);
  let categories = $derived(market.marketData.categories as ScalarMarketDataItem[]);
  let marketEndsBlock = $derived(
    (market.marketData.marketStart || 0) + (market.marketData.marketDuration || 0));
  let coolDownBlock = $derived(
    (market.marketData.marketStart || 0) +
    (market.marketData.marketDuration || 0) +
    (market.marketData.coolDownPeriod || 0));
  let sip10Data: Sip10Data = $derived(getMarketToken(market.marketData.token, $allowedTokenStore));

  const setCurrentIndex = async (index: number) => {};
</script>

<div class="mb-5">
  {#if currentBlock <= coolDownBlock}
    <p class="mb-5"> 
      Cool down is in progress (current block height {fmtNumber(currentBlock)}). The market will be
      resolved by the oracle at he end of this phase.
    </p>
    <p class="mb-5">
      A dispute window will then open for stakers to challenge the outcome before the claims process
      starts.
    </p>
    <!-- <ul class="w-1/5 text-sm">
			<li class="flex justify-between"><span>Market start:</span><span>{fmtNumber(market.marketData.marketStart || 0)}</span></li>
			<li class="flex justify-between"><span>Market end:</span><span>{fmtNumber(marketEndsBlock)}</span></li>
			<li class="flex justify-between"><span>Cool down end:</span><span>{fmtNumber(coolDownBlock)}</span></li>
		</ul> -->
    <div class="mt-0">
      <BlockHeightProgressBar
        startBurnHeight={(market.marketData.marketStart || 0) +
          (market.marketData.marketDuration || 0)}
        stopBurnHeight={(market.marketData.marketStart || 0) +
          (market.marketData.marketDuration || 0) +
          (market.marketData.coolDownPeriod || 0)}
        currentBurnHeight={$chainStore.stacks.burn_block_height || 0}
      />
    </div>
  {:else}
    <p>Market is closed and will resolve shortly.</p>
  {/if}
</div>
<div class="mt-0">
  {#each categories as category, index}
    <!-- <StakingButton currentIndex={-1} {sip10Data} slippage={$shareCosts.slippage} {userShares} {market} {setCurrentIndex} {index} /> -->
  {/each}
</div>
