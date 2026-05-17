<script lang="ts">
  import { slide } from 'svelte/transition';
  import {
    allowedTokenStore,
    daoOverviewStore,
    exchangeRatesStore,
    selectedCurrency,
    shareCosts,
    stakeAmount,
  } from '@bigmarket/bm-common';
  import type { MarketData, Sip10Data } from '@bigmarket/bm-types';
  import { Banner } from '@bigmarket/bm-ui';
  import {
    convertFiatToNative,
    estimateMaxSpendIncludingFee,
    fmtMicroToStxNumber,
    fmtStxMicro,
    getMarketToken,
    getRate,
    toFiat,
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
    outcomeSide = 'other',
    doBuy,
    doSell,
  } = $props<{
    marketData: MarketData;
    probability: number;
    index: number;
    connected: boolean;
    totalBalanceUToken: number;
    userStakeAtIndex: number;
    outcomeSide?: 'yes' | 'no' | 'other';
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
      tokenUri: '',
    },
  );

  let feeBips = $derived($daoOverviewStore.contractData?.devFeeBips || 0);
  let errorMessage: string | undefined = $state(undefined);
  let presetSelected = $state(1);
  let inputAmount = $state(1);
  let tradeMode = $state<'buy' | 'sell'>('buy');

  let hasPosition = $derived(userStakeAtIndex > 0);
  let decimals = $derived(sip10Data?.decimals ?? 0);
  let amountMicro = $derived(fmtStxMicro(Number(inputAmount) || 0, decimals));
  let humanStakeTotal = $derived(fmtMicroToStxNumber(userStakeAtIndex, decimals));
  let humanBalanceTotal = $derived(fmtMicroToStxNumber(totalBalanceUToken, decimals));

  let fiatEquivalent = $derived(
    tradeMode === 'buy' && amountMicro > 0
      ? toFiat(getRate($exchangeRatesStore, $selectedCurrency.code), amountMicro, sip10Data)
      : '',
  );

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
    const quickSpend = estimateMaxSpendIncludingFee(marketData, index, feeBips).maxSpendIncludingFee;
    const quickBuy: Array<{ label: string; value: number }> = [];
    if (index < 0) return quickBuy;

    const oneFiatNative = roundHuman(
      fmtMicroToStxNumber(
        convertFiatToNative($exchangeRatesStore, 1, $selectedCurrency.code),
        decimals,
      ),
    );
    const fiveFiatNative = roundHuman(
      fmtMicroToStxNumber(
        convertFiatToNative($exchangeRatesStore, 5, $selectedCurrency.code),
        decimals,
      ),
    );

    if (quickSpend > 1000000 && totalBalanceUToken > 1000000 && oneFiatNative > 0) {
      quickBuy.push({ label: '$1', value: oneFiatNative });
    }
    if (quickSpend > 5000000 && totalBalanceUToken > 5000000 && fiveFiatNative > 0) {
      quickBuy.push({ label: '$5', value: fiveFiatNative });
    }

    if (totalBalanceUToken > quickSpend) {
      quickBuy.push({
        label: 'All in',
        value: roundHuman(fmtMicroToStxNumber(quickSpend, decimals)),
      });
    } else if (totalBalanceUToken > 2000000) {
      quickBuy.push({
        label: 'All in',
        value: roundHuman(fmtMicroToStxNumber(totalBalanceUToken - 1000000, decimals)),
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
      { label: 'All in', value: roundHuman(total) },
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
        : totalBalanceUToken > MIN_BALANCE_MICRO && amountMicro <= totalBalanceUToken),
  );

  let ctaLabel = $derived(
    tradeMode === 'sell'
      ? 'Sell shares'
      : outcomeSide === 'yes'
        ? 'Bet Yes'
        : outcomeSide === 'no'
          ? 'Bet No'
          : 'Place bet',
  );

  onMount(() => {
    tradeMode = 'buy';
    inputAmount = 1;
    presetSelected = 1;
    handleInput();
  });
</script>

<div
  class="mt-3 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-secondary)] p-4"
  transition:slide={{ duration: 150 }}
>
  <p class="mb-2 text-sm font-medium text-[var(--color-muted-foreground)]">
    How much do you want to stake?
  </p>

  {#if hasPosition}
    <div class="mb-3 grid grid-cols-2 gap-1">
      <button
        type="button"
        onclick={() => setTradeMode('buy')}
        class="rounded-[var(--radius-sm)] px-2 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] {tradeMode ===
        'buy'
          ? 'bg-[var(--color-card)] text-[var(--color-card-foreground)] shadow-sm'
          : 'border border-[var(--color-border)] bg-[var(--color-secondary)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'}"
      >
        Buy
      </button>
      <button
        type="button"
        onclick={() => setTradeMode('sell')}
        class="rounded-[var(--radius-sm)] px-2 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] {tradeMode ===
        'sell'
          ? 'bg-[var(--color-card)] text-[var(--color-card-foreground)] shadow-sm'
          : 'border border-[var(--color-border)] bg-[var(--color-secondary)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'}"
      >
        Sell
      </button>
    </div>
  {/if}

  <div class="mb-3 min-w-0">
    {#if tradeMode === 'buy'}
      {#if totalBalanceUToken > MIN_BALANCE_MICRO}
        <label class="sr-only" for="stake-input-{index}">Spend amount ({sip10Data.symbol})</label>
        <div class="flex min-w-0 items-stretch gap-2">
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
            class="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 font-mono text-lg tabular-nums text-[var(--color-card-foreground)] transition-colors [-moz-appearance:textfield] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <div
            title={sip10Data.symbol}
            class="flex shrink-0 items-center rounded-[var(--radius-sm)] bg-[var(--color-muted)] px-2 py-1 text-xs text-[var(--color-muted-foreground)]"
          >
            {sip10Data.symbol}
          </div>
        </div>
        {#if fiatEquivalent}
          <p class="mt-1 text-xs text-[var(--color-muted-foreground)] tabular-nums">
            ≈ {fiatEquivalent}
            {$selectedCurrency.code === 'USD' ? '' : ` ${$selectedCurrency.code}`}
          </p>
        {/if}
      {:else if connected}
        <Banner
          bannerType="warning"
          clazz="!rounded-lg !p-2 [&_span]:!text-[11px] [&_span]:!leading-snug [&_.flex]:!gap-2"
          message={`Balance too low — mint ${sip10Data.symbol}`}
        />
      {/if}
    {:else if userStakeAtIndex > 0}
      <label class="sr-only" for="sell-input-{index}">Shares to sell</label>
      <div class="flex min-w-0 items-stretch gap-2">
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
          class="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 font-mono text-lg tabular-nums text-[var(--color-card-foreground)] transition-colors [-moz-appearance:textfield] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <div
          class="flex shrink-0 items-center rounded-[var(--radius-sm)] bg-[var(--color-muted)] px-2 py-1 text-xs text-[var(--color-muted-foreground)]"
          title="Outcome shares"
        >
          shares
        </div>
      </div>
      <p class="mt-1 text-xs text-[var(--color-muted-foreground)]">
        You hold <span class="font-semibold tabular-nums text-[var(--color-card-foreground)]"
          >{roundHuman(humanStakeTotal)}</span
        > shares max
      </p>
    {:else}
      <p class="text-xs text-[var(--color-muted-foreground)]">No shares to sell for this outcome.</p>
    {/if}
  </div>

  <p class="mb-3 text-xs text-[var(--color-muted-foreground)]">
    This is {Math.round(probability)}% of the current pool
  </p>

  {#if tradeMode === 'buy' && totalBalanceUToken > MIN_BALANCE_MICRO}
    <div class="mb-3 flex min-w-0 flex-wrap gap-1">
      {#each getQuickBuyOptions() as option}
        <button
          type="button"
          onclick={() => handlePresetAmount(option.value)}
          class="rounded-[var(--radius-sm)] border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] {presetMatches(
            option.value,
          )
            ? 'border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
            : 'border-[var(--color-border)] bg-[var(--color-secondary)] text-[var(--color-muted-foreground)] hover:border-[var(--color-accent-border)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]'}"
        >
          {option.label}
        </button>
      {/each}
    </div>
  {:else if tradeMode === 'sell' && userStakeAtIndex > 0}
    <div class="mb-3 flex min-w-0 flex-wrap gap-1">
      {#each getQuickSellOptions() as option}
        <button
          type="button"
          onclick={() => handlePresetAmount(option.value)}
          class="rounded-[var(--radius-sm)] border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] {presetMatches(
            option.value,
          )
            ? 'border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
            : 'border-[var(--color-border)] bg-[var(--color-secondary)] text-[var(--color-muted-foreground)] hover:border-[var(--color-accent-border)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]'}"
        >
          {option.label}
        </button>
      {/each}
    </div>
  {/if}

  {#if errorMessage && connected}
    <div class="mb-3 min-w-0">
      <Banner
        bannerType="error"
        clazz="!rounded-lg !p-2 [&_span]:!text-[11px] [&_span]:!leading-snug [&_.flex]:!gap-2"
        message={errorMessage}
      />
    </div>
  {/if}

  <button
    type="button"
    onclick={submitTrade}
    disabled={!canSubmit}
    class="w-full rounded-[var(--radius-md)] bg-[var(--color-primary)] py-3 text-base font-semibold text-[var(--color-primary-foreground)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-50"
  >
    {ctaLabel}
  </button>
</div>
