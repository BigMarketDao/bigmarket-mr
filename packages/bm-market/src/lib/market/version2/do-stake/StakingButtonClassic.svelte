<script lang="ts">
  import type {
    MarketData,
    PredictionMarketCreateEvent,
    PurchaseInfoResponse,
    Sip10Data,
  } from '@bigmarket/bm-types';
  import { Bulletin } from '@bigmarket/bm-ui';
  import { calculateExpectedPayout, fmtMicroToStx, fmtMicroToStxFormatted, getCategoryLabel, getMarketToken, validatePurchaseAgainstMax } from '@bigmarket/bm-utilities';
  import { allowedTokenStore, selectedCurrency, shareCosts } from '@bigmarket/bm-common';
  import { daoOverviewStore } from '@bigmarket/bm-common';

	let { doPrediction, sip10Data, index, market, userShares, slippage, marketActive } = $props<{
		doPrediction: (index: number) => void;
    sip10Data: Sip10Data;
    index: number;
    market: PredictionMarketCreateEvent;
    userShares: Array<number>;
      slippage: number; 
      marketActive: boolean;
	}>(); 

  let marketData: MarketData = market.marketData;

  let purchaseInfoResponse: PurchaseInfoResponse = $derived(validatePurchaseAgainstMax(
    {
      index,
      totalCost: $shareCosts.userCostMicro,
      feeBips: $daoOverviewStore.contractData?.devFeeBips || 0,
      slippage,
    },
    marketData,
  ));

  const getlabel = () => {
    return getCategoryLabel($selectedCurrency, index, marketData);
  };
</script>

<div class="flex flex-col gap-2">
  <!-- Stake Button -->
  <button
    onclick={() => !purchaseInfoResponse.willFail && marketActive && doPrediction(index)}
    class={`inline-flex w-full min-w-[120px] cursor-pointer items-center justify-center rounded border px-4 py-2 text-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2
		${purchaseInfoResponse.willFail || !marketActive ? 'cursor-not-allowed border border-gray-300 bg-gray-800 ' : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-400  focus:ring-2 focus:ring-offset-2 focus:outline-none'}`}
    disabled={purchaseInfoResponse.willFail || !marketActive}
  >
    <span>{@html getlabel()}</span>
  </button>

  <!-- Trade Details -->
  <div class="rounded-lg bg-zinc-100 px-4 py-3 text-sm dark:bg-zinc-800/80">
    {#if purchaseInfoResponse.willFail}
      <div class="font-semibold text-red-500">❌ {purchaseInfoResponse.reason}</div>
    {:else if marketActive}
      <div class="mb-1 text-[0.9rem] font-semibold text-gray-900 dark:text-gray-100">
        Trade Details
      </div>
      <div class="flex justify-between py-1">
        <span>Likely shares</span>
        <span>{fmtMicroToStxFormatted(purchaseInfoResponse.idealShares)} {sip10Data.symbol}</span>
      </div>
      <div class="flex justify-between py-1">
        <div class="relative inline-block">
          <Bulletin message="Slippage should be set high while market has low liquidity.">
            <span
              class="inline-flex items-center gap-1 align-middle whitespace-nowrap"
            >
              Min shares ({($shareCosts.slippage * 100).toFixed(1)}%)
            </span>
          </Bulletin>
        </div>
        <span>{fmtMicroToStxFormatted(purchaseInfoResponse.minShares)} {sip10Data.symbol}</span>
      </div>
      <div class="flex justify-between py-1">
        <span>Max spend</span>
        <span
          >{fmtMicroToStxFormatted(purchaseInfoResponse.maxSpendIncludingFee)}
          {sip10Data.symbol}</span
        >
      </div>
    {:else}
      <div class="mb-1 text-[0.9rem] font-semibold text-gray-900 dark:text-gray-100">
        Your Payout
      </div>
      <div class="flex justify-between py-1">
        <span>Refund</span>
        <span>
          {fmtMicroToStx(
            calculateExpectedPayout(market.marketData, userShares, index)?.netRefund || 0,
            getMarketToken(market.marketData.token, $allowedTokenStore).decimals,
          )}
        </span>
      </div>
    {/if}
  </div>
</div>
