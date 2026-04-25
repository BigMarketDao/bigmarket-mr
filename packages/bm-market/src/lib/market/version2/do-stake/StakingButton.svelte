<script lang="ts">
  import type {
    MarketData,
    PredictionMarketCreateEvent,
    PurchaseInfoResponse,
    ScalarMarketDataItem,
    Sip10Data,
  } from '@bigmarket/bm-types';
  import { Bulletin } from '@bigmarket/bm-ui';
  import { formatFiat, getCategoryLabel, validatePurchaseAgainstMax } from '@bigmarket/bm-utilities';
  import { chainStore, daoOverviewStore, selectedCurrency } from '@bigmarket/bm-common';
  import { shareCosts as shareCostsStore } from '@bigmarket/bm-common';

	let { setCurrentIndex, sip10Data, index, currentIndex, market, userShares, marketActive, slippage } = $props<{
		setCurrentIndex: (index: number) => void;
    sip10Data: Sip10Data;
    index: number;
    currentIndex: number;
    market: PredictionMarketCreateEvent;
    userShares: Array<number>;
    marketActive: boolean;
    slippage: number;
	}>(); 

  let marketData: MarketData = $derived(market.marketData);
  const totalStake = $derived(marketData.stakes.reduce((a, b) => a + b, 0));
  const outcomeStake = $derived(marketData.stakes[index] ?? 0);
  const tokenStake = $derived(marketData.stakeTokens[index] ?? 0);
  const probability = $derived(totalStake > 0 ? outcomeStake / totalStake : 0);
  const buyPrice = $derived((probability * 100).toFixed(1)); // cents
  const buyNoPrice = $derived((100 - parseFloat(buyPrice)).toFixed(1));
  const marketVolume = $derived(formatFiat($selectedCurrency, tokenStake / Number(`1e${sip10Data.decimals}`))); // assuming uSTX

  let purchaseInfoResponse: PurchaseInfoResponse = $derived(validatePurchaseAgainstMax(
    {
      index,
      totalCost: $shareCostsStore.userCostMicro,
      feeBips: $daoOverviewStore.contractData?.devFeeBips || 0,
      slippage,
    },
    marketData,
  ));

  // let purchaseInfoResponseClassic: PurchaseInfoResponse = $derived(validatePurchaseAgainstMax(
  //   {
  //     index,
  //     totalCost: $shareCostsStore.userCostMicro,
  //     feeBips: $daoOverviewStore.contractData?.devFeeBips || 0,
  //     slippage,
  //   },
  //   marketData,
  // ));

  const getlabel = $derived(() => {
    return getCategoryLabel($selectedCurrency, index, marketData);
  });
</script>

<div class="flex justify-between">
  <div>
    <div class="flex flex-col">
      <div class="">{@html getCategoryLabel($selectedCurrency, index, market.marketData)}</div>
      <div class="text-sm text-gray-600">${marketVolume}</div>
    </div>
  </div>
  <div>{buyPrice}%</div>
</div>
<div>
  <button
    on:click={() => setCurrentIndex(index)}
    class={`btn w-full min-w-[120px] justify-center rounded-full px-4 py-2 text-lg font-semibold transition-colors duration-200
      ${currentIndex === index ? 'border-secondary-600 bg-secondary-100 text-secondary-800 hover:bg-primary border hover:text-white' : 'border-primary bg-primary hover:bg-primary-700 border text-white'}`}
  >
    <span>BUY {@html getlabel()}</span>
  </button>
</div>
