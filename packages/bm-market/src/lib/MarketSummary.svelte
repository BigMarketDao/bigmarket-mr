<script lang="ts">
  import { onMount } from 'svelte';
  import {
    ResolutionState,
    type PredictionMarketCreateEvent,
    type PredictionMarketStakeEvent,
    type Sip10Data,
  } from '@bigmarket/bm-types';
  import {
    appConfigStore,
    requireAppConfig,
    bitcoinMode,
    chainStore,
    daoOverviewStore,
    allowedTokenStore,
    requireDaoConfig,
    daoConfigStore,
    exchangeRatesStore,
    selectedCurrency,
  } from '@bigmarket/bm-common';
  import {
    dateOfResolution,
    formatFiat,
    getMarketToken,
    getRate,
    isCooling,
    isDisputable,
    isDisputeRunning,
    isResolving,
    isRunning,
    toFiat,
  } from '@bigmarket/bm-utilities';

  import { getStxAddress } from '@bigmarket/bm-common';
  import { Countdown } from '@bigmarket/bm-ui';
  import AgentResolveMarket from './market/version2/do-resolve/AgentResolveMarket.svelte';

  const appConfig = $derived(requireAppConfig($appConfigStore));
  const daoConfig = $derived(requireDaoConfig($daoConfigStore));
  const { market, marketStakes } = $props<{
    market: PredictionMarketCreateEvent;
    marketStakes: PredictionMarketStakeEvent[];
  }>();

  const cardClass =
    'flex h-full flex-col rounded-lg border border-border border-t-2 border-t-orange-500/40 bg-card p-5';
  const labelClass = 'text-xs font-medium uppercase tracking-wide text-foreground/50';
  const labelClassSoft = 'text-xs font-medium tracking-wide text-foreground/50';
  const valueClass = 'mt-2 text-3xl font-bold tabular-nums text-foreground';
  const subClass = 'mt-1 text-sm font-normal text-foreground/40';
  const iconWrapClass =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info-soft';
  const countdownValueClass = 'font-semibold text-foreground';
  const countdownSuffixClass = 'font-normal text-foreground/40';

  let blocksTillClose = $derived(
    (market.marketData?.marketStart || 0) +
      (market.marketData?.marketDuration || 0) -
      $chainStore.stacks.burn_block_height,
  );
  let preselectIndex: number | null = $state(null);
  let message: string | undefined = $state(undefined);
  let currentBurnHeight = $derived($chainStore.stacks.burn_block_height);
  let sip10Data: Sip10Data = $derived(getMarketToken(market.marketData.token, $allowedTokenStore));
  let endOfCooling = $derived(
    (market.marketData?.marketStart || 0) +
      (market.marketData?.marketDuration || 0) +
      (market.marketData?.coolDownPeriod || 0),
  );
  let endOfResolving = $derived(
    (endOfCooling || 0) + ($daoOverviewStore.contractData?.disputeWindowLength || 0),
  );
  let endOfVoting = $derived(
    (market.marketData?.resolutionBurnHeight || 0) +
      ($daoOverviewStore.contractData?.marketVotingDuration || 0),
  );
  let endOfMarket = $derived(
    (market.marketData?.marketStart || 0) + (market.marketData?.marketDuration || 0),
  );

  let currentPrice = $derived(
    market?.marketData?.stakes
      ? (
          (Number(market.marketData.stakes[0]) /
            market.marketData.stakes.reduce((sum: number, stake: number) => sum + Number(stake), 0)) *
          100
        ).toFixed(1)
      : '0.0',
  );

  const totalStakeMicro = $derived(
    market.marketData.stakeTokens?.reduce((sum: number, stake: number) => sum + Number(stake), 0) || 0,
  );

  const totalStakedDisplay = $derived(
    Number((totalStakeMicro / Math.pow(10, sip10Data.decimals ?? 6)).toFixed(2)),
  );

  const totalStakedFiatLine = $derived.by(() => {
    try {
      const rate = getRate($exchangeRatesStore, $selectedCurrency.code);
      const fiatAmount = Number(toFiat(rate, totalStakeMicro, sip10Data, undefined, 2));
      if (!Number.isFinite(fiatAmount) || fiatAmount <= 0) return null;
      const bare = formatFiat($selectedCurrency, fiatAmount, true);
      return `≈ $${bare} ${$selectedCurrency.code}`;
    } catch {
      return null;
    }
  });

  const isBinaryMarket = $derived(
    market.marketType !== 2 && market.marketData.categories.length === 2,
  );

  const marketKindLabel = $derived(
    market.marketType === 2
      ? 'Scalar market'
      : isBinaryMarket
        ? 'Yes or No market'
        : 'Multi-choice market',
  );

  const closeDateLine = $derived(
    dateOfResolution(currentBurnHeight, market)?.closeOffChain.split(',')[0]?.trim() ?? '',
  );

  const handleResolution = async (data: any) => {
    message = undefined;
    if (data.error) {
      message = data.message;
    } else {
      message = 'Market resolution begun';
    }
  };

  let cleanupFunctions: (() => void)[] = [];

  onMount(async () => {
    bitcoinMode.set(market.marketType === 3);

    try {
      const url = new URL(window.location.href);
      const p = url.searchParams.get('option');
      preselectIndex = p !== null && !Number.isNaN(Number(p)) ? Number(p) : null;
    } catch {}

    setTimeout(() => {
      if (
        typeof window !== 'undefined' &&
        window.performance &&
        (window.performance as any).memory
      ) {
        console.log(
          'Memory usage after load:',
          Math.round((window.performance as any).memory.usedJSHeapSize / 1024 / 1024) + 'MB',
        );
      }
    }, 5000);
  });
</script>

<svelte:head>
  <title>Market Volumes</title>
  <meta name="description" content="View prediction market details and participate" />
</svelte:head>

{#snippet infoTip(text: string)}
  <span class="group relative ml-1 inline-flex align-middle">
    <button
      type="button"
      class="inline-flex size-3.5 items-center justify-center text-[14px] leading-none text-foreground/30 transition-colors hover:text-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="More information"
    >
      ⓘ
    </button>
    <span
      role="tooltip"
      class="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-xs -translate-x-1/2 rounded-lg bg-zinc-800 p-3 text-xs text-white/80 opacity-0 shadow-lg transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
    >
      {text}
      <span
        class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-800"
        aria-hidden="true"
      ></span>
    </span>
  </span>
{/snippet}

<!-- Market Overview Cards -->
<div class="mb-8 grid grid-cols-2 items-stretch gap-4 lg:grid-cols-4" data-market-stats>
  <!-- Card 1 — Crowd says -->
  <div class={cardClass} data-volume-display>
    <div class="flex items-center gap-3">
      <div class={iconWrapClass}>
        <svg class="h-5 w-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      </div>
      <span class={labelClassSoft}>Crowd says</span>
    </div>
    <div class={valueClass}>{currentPrice}%</div>
    <div class="{subClass} flex flex-wrap items-center gap-1">
      <span>{marketKindLabel}</span>
      {#if isBinaryMarket}
        {@render infoTip(
          'This market has two possible outcomes — Yes or No. The percentage shows where most of the money is sitting right now.',
        )}
      {/if}
    </div>
  </div>

  <!-- Card 2 — Total staked -->
  <div class={cardClass} data-volume-display>
    <div class="flex items-center gap-3">
      <div class={iconWrapClass}>
        <svg class="h-5 w-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <span class={labelClass}>Total staked</span>
    </div>
    <div class={valueClass}>
      {totalStakedDisplay.toFixed(2)}
      <span class="text-xl font-bold">{sip10Data.symbol}</span>
    </div>
    {#if totalStakedFiatLine}
      <p class="text-sm font-normal text-foreground/50 tabular-nums">{totalStakedFiatLine}</p>
    {/if}
    <p class={subClass}>{marketStakes?.length ?? 0} people betting</p>
  </div>

  <!-- Card 3 — Fee if you win -->
  <div class={cardClass} data-volume-display>
    <div class="flex flex-wrap items-center gap-1">
      <div class="flex items-center gap-3">
        <div class={iconWrapClass}>
          <svg class="h-5 w-5 text-community" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <span class={labelClass}>Fee if you win</span>
      </div>
      {@render infoTip(
        "This fee is only taken from your winnings if you predict correctly. If you're wrong, you pay nothing extra.",
      )}
    </div>
    <div class={valueClass}>{(market.marketData.marketFeeBips / 100).toFixed(1)}%</div>
    <p class={subClass}>Only charged if you win</p>
  </div>

  <!-- Card 4 — Betting closes -->
  <div class={cardClass} data-volume-display>
    <div class="flex flex-wrap items-center gap-1">
      <div class="flex items-center gap-3">
        <div class={iconWrapClass}>
          <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <span class={labelClass}>
          {#if blocksTillClose <= 0}Betting closed{:else}Betting closes{/if}
        </span>
      </div>
      {@render infoTip(
        'After this time, no new bets can be placed. The market moves into a resolution window where the outcome is verified.',
      )}
    </div>
    <p class="mt-2 text-base font-medium text-foreground tabular-nums">
      {closeDateLine}
      {#if appConfig.VITE_NETWORK === 'devnet'}
        <br /><span class="mt-1 text-xs text-foreground/40">dates on testnet are unreliable</span>
      {/if}
    </p>
    <div class="mt-1 text-sm">
      {#if blocksTillClose > 0}
        {#if isRunning(currentBurnHeight, market)}
          <Countdown
            endBlock={endOfMarket - currentBurnHeight}
            showTilde={false}
            suffix="left"
            valueClass={countdownValueClass}
            suffixClass={countdownSuffixClass}
          />
        {:else if isResolving(market)}
          <Countdown
            endBlock={endOfResolving - currentBurnHeight}
            showTilde={false}
            suffix="left"
            valueClass={countdownValueClass}
            suffixClass={countdownSuffixClass}
          />
        {:else if isDisputeRunning(market)}
          <Countdown
            endBlock={endOfVoting - currentBurnHeight}
            showTilde={false}
            suffix="left"
            valueClass={countdownValueClass}
            suffixClass={countdownSuffixClass}
          />
        {/if}
      {:else if market.marketData.resolutionState === ResolutionState.RESOLUTION_OPEN}
        {#if isCooling(currentBurnHeight, market)}
          <span class={subClass}>Market Cooling</span>
        {:else if isDisputable(currentBurnHeight, $daoOverviewStore.contractData?.disputeWindowLength || 0, market)}
          <span class={subClass}>Dispute window open</span>
        {:else if getStxAddress() === daoConfig.VITE_DAO_RESOLUTION_COORDINATOR}
          <AgentResolveMarket {market} onResolved={handleResolution} />
          {#if message}<span class={subClass}>{message}</span>{/if}
        {/if}
        {#if market.marketType === 2}
          <span class="{subClass} block">Feed Id: {market.marketData.priceOutcome}</span>
        {/if}
      {/if}
    </div>
  </div>
</div>
