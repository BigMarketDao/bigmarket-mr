<script lang="ts">
  import { slide } from 'svelte/transition';
  import {
    allowedTokenStore,
    daoOverviewStore,
    shareCosts,
    stakeAmount
  } from '@bigmarket/bm-common';
  import type { MarketData, Sip10Data } from '@bigmarket/bm-types';
  import { Banner } from '@bigmarket/bm-ui';
  import {
    estimateMaxSpendIncludingFee,
    fmtMicroToStxNumber,
    fmtStxMicro,
    getMarketToken
  } from '@bigmarket/bm-utilities';
  import { onMount } from 'svelte';

  const MIN_BALANCE_MICRO = 2000000;

  const {
    marketData,
    probability,
    index,
    connected,
    totalBalanceUToken,
    userStakeAtIndex,
    doBuy,
    doSell
  } = $props<{
    marketData: MarketData;
    probability: number;
    index: number;
    connected: boolean;
    totalBalanceUToken: number;
    userStakeAtIndex: number;
    doBuy: (index: number) => void;
    doSell: (index: number) => void;
  }>();

  let sip10Data: Sip10Data = $derived(
    getMarketToken(marketData.token, $allowedTokenStore) || {
      symbol: '',
      decimals: 0,
      name: '',
      balance: 0,
      totalSupply: 0,
      tokenUri: ''
    }
  );

  let feeBips = $derived($daoOverviewStore.contractData?.devFeeBips || 0);
  let errorMessage: string | undefined = $state(undefined);
  let presetSelected = $state(1);
  /** Human-readable amount: token units when buying, share units when selling */
  let inputAmount = $state(1);

  /** When user has a position, choosing Sell switches the amount field to shares */
  let tradeMode = $state<'buy' | 'sell'>('buy');

  let hasPosition = $derived(userStakeAtIndex > 0);

  let decimals = $derived(sip10Data?.decimals ?? 0);

  let panelClasses = $derived(
    hasPosition
      ? 'border-green-200/80 bg-green-50/60 dark:border-green-900/60 dark:bg-green-950/20'
      : 'border-gray-200/80 bg-white/90 dark:border-gray-800 dark:bg-gray-900/70'
  );

  let amountMicro = $derived(fmtStxMicro(Number(inputAmount) || 0, decimals));

  let humanStakeTotal = $derived(fmtMicroToStxNumber(userStakeAtIndex, decimals));

  let humanBalanceTotal = $derived(fmtMicroToStxNumber(totalBalanceUToken, decimals));

  function roundHuman(n: number): number {
    if (!Number.isFinite(n) || n <= 0) return 0;
    const d = Math.min(Math.max(decimals, 0), 18);
    return Number(n.toFixed(d));
  }

  $effect(() => {
    if (!hasPosition) tradeMode = 'buy';
  });

  function setTradeMode(mode: 'buy' | 'sell'): void {
    if (!hasPosition && mode === 'sell') return;
    if (tradeMode === mode) return;
    tradeMode = mode;
    errorMessage = undefined;
    if (mode === 'sell') {
      inputAmount = roundHuman(humanStakeTotal) || 0;
      presetSelected = inputAmount;
    } else {
      inputAmount = 1;
      presetSelected = 1;
    }
    handleInput();
  }

  function handlePresetAmount(val: number): void {
    inputAmount = roundHuman(val) || (tradeMode === 'sell' ? 0 : 1);
    presetSelected = inputAmount;
    handleInput();
  }

  function handleInput(): void {
    const micro = fmtStxMicro(Number(inputAmount) || 0, decimals);

    if (tradeMode === 'sell') {
      if (micro <= 0) {
        errorMessage = 'Enter shares to sell';
      } else if (micro > userStakeAtIndex) {
        errorMessage = 'Cannot sell more shares than you own';
      } else {
        errorMessage = undefined;
      }
    } else {
      if (micro <= 0) {
        errorMessage = 'Enter an amount';
      } else if (micro > totalBalanceUToken) {
        errorMessage = 'Amount exceeds your balance';
      } else {
        errorMessage = undefined;
      }
    }

    const newShareCosts = $shareCosts;
    newShareCosts.userCostMicro = micro;
    stakeAmount.set(micro);
    shareCosts.set(newShareCosts);
  }

  function getQuickBuyOptions(): Array<{ label: string; value: number }> {
    const quickSpend = estimateMaxSpendIncludingFee(
      marketData,
      index,
      feeBips
    ).maxSpendIncludingFee;

    const quickBuy: Array<{ label: string; value: number }> = [];

    if (index < 0) return quickBuy;

    if (quickSpend > 1000000 && totalBalanceUToken > 1000000) {
      quickBuy.push({ label: `1 ${sip10Data.symbol}`, value: 1 });
    }

    if (quickSpend > 5000000 && totalBalanceUToken > 5000000) {
      quickBuy.push({ label: `5 ${sip10Data.symbol}`, value: 5 });
    }

    if (quickSpend > 100000000 && totalBalanceUToken > 100000000) {
      quickBuy.push({ label: `100 ${sip10Data.symbol}`, value: 100 });
    }

    if (totalBalanceUToken > quickSpend) {
      quickBuy.push({
        label: 'MAX',
        value: roundHuman(fmtMicroToStxNumber(quickSpend, decimals))
      });
    } else if (totalBalanceUToken > 2000000) {
      quickBuy.push({
        label: 'MAX',
        value: roundHuman(fmtMicroToStxNumber(totalBalanceUToken - 1000000, decimals))
      });
    }

    return quickBuy;
  }

  function getQuickSellOptions(): Array<{ label: string; value: number }> {
    const total = humanStakeTotal;
    if (total <= 0 || index < 0) return [];

    const pct = (p: number) => roundHuman(total * p);

    return [
      { label: '25%', value: pct(0.25) },
      { label: '50%', value: pct(0.5) },
      { label: '75%', value: pct(0.75) },
      { label: 'MAX', value: roundHuman(total) }
    ];
  }

  function presetMatches(optionVal: number): boolean {
    return Math.abs(optionVal - presetSelected) < 1e-10;
  }

  function submitTrade(): void {
    if (tradeMode === 'sell') doSell(index);
    else doBuy(index);
  }

  let canSubmit = $derived(
    connected &&
      amountMicro > 0 &&
      (tradeMode === 'sell'
        ? userStakeAtIndex > 0 && amountMicro <= userStakeAtIndex
        : totalBalanceUToken > MIN_BALANCE_MICRO && amountMicro <= totalBalanceUToken)
  );

  onMount(() => {
    tradeMode = 'buy';
    inputAmount = 1;
    presetSelected = 1;
    handleInput();
  });
</script>

<div
  class={`mt-2 min-w-0 max-w-full overflow-hidden rounded-lg border p-2.5 shadow-sm transition-colors sm:p-3 ${panelClasses}`}
  transition:slide={{ duration: 150 }}
>
  <div class="mb-2 flex min-w-0 items-center justify-between gap-2 border-b border-gray-200/80 pb-2 dark:border-gray-700/80">
    <span class="truncate text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
      {#if tradeMode === 'sell'}
        Shares to sell
      {:else}
        Tokens to spend
      {/if}
    </span>
    <span class="shrink-0 tabular-nums text-[10px] text-gray-400 dark:text-gray-500">{probability.toFixed(1)}%</span>
  </div>

  {#if hasPosition}
    <div class="mb-2 grid min-w-0 grid-cols-2 gap-1">
      <button
        type="button"
        onclick={() => setTradeMode('buy')}
        class={`rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 ${
          tradeMode === 'buy'
            ? 'bg-orange-500 text-white shadow-sm ring-1 ring-orange-600/30 dark:bg-orange-600'
            : 'border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
        }`}
      >
        Buy
      </button>
      <button
        type="button"
        onclick={() => setTradeMode('sell')}
        class={`rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40 ${
          tradeMode === 'sell'
            ? 'bg-green-600 text-white shadow-sm ring-1 ring-green-700/30 dark:bg-green-700'
            : 'border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
        }`}
      >
        Sell
      </button>
    </div>
  {/if}

  <div class="mb-2 min-w-0">
    {#if tradeMode === 'buy'}
      {#if totalBalanceUToken > MIN_BALANCE_MICRO}
        <label class="sr-only" for="stake-input-{index}">Spend amount ({sip10Data.symbol})</label>
        <div class="flex min-w-0 items-stretch gap-1.5">
          <input
            id="stake-input-{index}"
            type="number"
            bind:value={inputAmount}
            oninput={handleInput}
            placeholder="Amount"
            min="0"
            max={humanBalanceTotal || undefined}
            step="any"
            inputmode="decimal"
            class="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs tabular-nums text-gray-900 transition-colors [-moz-appearance:textfield] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <div
            title={sip10Data.symbol}
            class="flex max-w-[38%] shrink-0 items-center truncate rounded-md border border-gray-300 bg-gray-50 px-2 py-1.5 text-[10px] font-semibold uppercase leading-none tracking-tight text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            {sip10Data.symbol}
          </div>
        </div>
      {:else if connected}
        <Banner
          bannerType="warning"
          clazz="!rounded-lg !p-2 [&_span]:!text-[11px] [&_span]:!leading-snug [&_.flex]:!gap-2"
          message={`Balance too low — mint ${sip10Data.symbol}`}
        />
      {/if}
    {:else if userStakeAtIndex > 0}
      <label class="sr-only" for="sell-input-{index}">Shares to sell</label>
      <div class="flex min-w-0 items-stretch gap-1.5">
        <input
          id="sell-input-{index}"
          type="number"
          bind:value={inputAmount}
          oninput={handleInput}
          placeholder="Shares"
          min="0"
          max={humanStakeTotal || undefined}
          step="any"
          inputmode="decimal"
          class="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs tabular-nums text-gray-900 transition-colors [-moz-appearance:textfield] focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-500/30 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <div
          class="flex max-w-[38%] shrink-0 items-center truncate rounded-md border border-green-200 bg-green-50 px-2 py-1.5 text-[10px] font-semibold uppercase leading-none tracking-tight text-green-900 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200"
          title="Outcome shares"
        >
          shares
        </div>
      </div>
      <p class="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
        You hold <span class="font-semibold tabular-nums text-gray-700 dark:text-gray-300">{roundHuman(humanStakeTotal)}</span> shares max
      </p>
    {:else}
      <p class="text-[11px] text-gray-500 dark:text-gray-400">No shares to sell for this outcome.</p>
    {/if}
  </div>

  {#if tradeMode === 'buy' && totalBalanceUToken > MIN_BALANCE_MICRO}
    <div class="mb-2 flex min-w-0 flex-wrap gap-1">
      {#each getQuickBuyOptions() as option}
        <button
          type="button"
          onclick={() => handlePresetAmount(option.value)}
          class={`max-w-full truncate rounded-md px-2 py-1 text-[10px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 sm:text-[11px]
            ${
              presetMatches(option.value)
                ? hasPosition
                  ? 'bg-green-700 text-white hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-500'
                  : 'bg-gray-800 text-white hover:bg-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white'
                : hasPosition
                  ? 'border border-green-200/90 bg-white text-green-800 hover:bg-green-50/80 dark:border-green-900/60 dark:bg-green-950/20 dark:text-green-300 dark:hover:bg-green-950/30'
                  : 'border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
        >
          {option.label}
        </button>
      {/each}
    </div>
  {:else if tradeMode === 'sell' && userStakeAtIndex > 0}
    <div class="mb-2 flex min-w-0 flex-wrap gap-1">
      {#each getQuickSellOptions() as option}
        <button
          type="button"
          onclick={() => handlePresetAmount(option.value)}
          class={`max-w-full truncate rounded-md px-2 py-1 text-[10px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40 sm:text-[11px]
            ${
              presetMatches(option.value)
                ? 'bg-green-700 text-white hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-500'
                : 'border border-green-200/90 bg-white text-green-800 hover:bg-green-50/80 dark:border-green-900/60 dark:bg-green-950/20 dark:text-green-300 dark:hover:bg-green-950/30'
            }`}
        >
          {option.label}
        </button>
      {/each}
    </div>
  {/if}

  {#if errorMessage && connected}
    <div class="mb-2 min-w-0">
      <Banner
        bannerType="error"
        clazz="!rounded-lg !p-2 [&_span]:!text-[11px] [&_span]:!leading-snug [&_.flex]:!gap-2"
        message={errorMessage}
      />
    </div>
  {/if}

  {#if hasPosition}
    <button
      type="button"
      onclick={submitTrade}
      disabled={!canSubmit}
      class="w-full rounded-md px-2 py-2 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 {tradeMode === 'sell'
        ? 'border border-green-700 bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500/40 dark:border-green-800 dark:bg-green-700 dark:hover:bg-green-600'
        : 'border border-orange-400 bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-orange-500/40 dark:border-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500'}"
    >
      {#if tradeMode === 'sell'}
        Sell shares
      {:else}
        Buy tokens
      {/if}
    </button>
  {:else}
    <button
      type="button"
      onclick={submitTrade}
      disabled={!canSubmit}
      class="w-full rounded-md border border-orange-400 bg-orange-500 px-2 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 disabled:cursor-not-allowed disabled:opacity-50 dark:border-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500"
    >
      Buy tokens
    </button>
  {/if}
</div>
