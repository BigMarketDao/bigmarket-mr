<script lang="ts">
  import { onMount } from 'svelte';
  import {
    ResolutionState,
    type PredictionMarketCreateEvent,
    type PredictionMarketStakeEvent,
    type Sip10Data,
  } from '@bigmarket/bm-types';
  import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
  import { bitcoinMode, chainStore, daoOverviewStore, allowedTokenStore, requireDaoConfig, daoConfigStore} from '@bigmarket/bm-common';
  import {
    dateOfResolution,
    fmtNumber,
    getMarketToken,
    isCooling,
    isDisputable,
    isDisputeRunning,
    isResolving,
    isRunning,
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

  let blocksTillClose = $derived(
    (market.marketData?.marketStart || 0) +
    (market.marketData?.marketDuration || 0) -
    $chainStore.stacks.burn_block_height);
  let preselectIndex: number | null = $state(null);
  let message: string | undefined = $state(undefined);
  let currentBurnHeight = $derived($chainStore.stacks.burn_block_height);
  let sip10Data: Sip10Data = $derived(getMarketToken(market.marketData.token, $allowedTokenStore));
  let endOfCooling = $derived(
    (market.marketData?.marketStart || 0) +
    (market.marketData?.marketDuration || 0) +
    (market.marketData?.coolDownPeriod || 0));
  let endOfResolving = $derived(
    (endOfCooling || 0) + ($daoOverviewStore.contractData?.disputeWindowLength || 0));
  let endOfVoting = $derived(
    (market.marketData?.resolutionBurnHeight || 0) +
    ($daoOverviewStore.contractData?.marketVotingDuration || 0));
  let endOfMarket = $derived(
    (market.marketData?.marketStart || 0) + (market.marketData?.marketDuration || 0));

  // Calculate current price and change
  let currentPrice = $derived(market?.marketData?.stakes
    ? (
        (Number(market.marketData.stakes[0]) /
          market.marketData.stakes.reduce((sum: number, stake: number) => sum + Number(stake), 0)) *
        100
      ).toFixed(1)
    : '0.00');

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

    blocksTillClose =
      (market.marketData?.marketStart || 0) +
      (market.marketData?.marketDuration || 0) -
      currentBurnHeight;

    // Read query param for deep-link preselect (client-only)
    try {
      const url = new URL(window.location.href);
      const p = url.searchParams.get('option');
      preselectIndex = p !== null && !Number.isNaN(Number(p)) ? Number(p) : null;
    } catch {}

    // Performance optimization: Clear unused data after initial load
    setTimeout(() => {
      // Clear any unused market data to free memory
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

<!-- Market Overview Cards -->
<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" data-market-stats>
  <!-- Current Price Card -->
  <div
    class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
    data-volume-display
  >
    <div class="mb-2 flex items-center gap-3">
      <div
        class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30"
      >
        <svg
          class="h-4 w-4 text-green-600 dark:text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      </div>
      <div class="text-sm text-gray-500 dark:text-gray-400">Current Probability</div>
    </div>
    <div class="text-lg font-semibold text-gray-900 dark:text-white">
      {currentPrice}%
    </div>
    <div
      class="flex justify-between w-full text-left text-[11px] font-bold text-gray-600 tabular-nums dark:text-gray-400"
    >
      <span class="">
        {market.marketType === 2
          ? 'Scalar Market'
          : market.marketData.categories.length === 2
            ? 'Binary Market'
            : 'Multi-choice Market'}
      </span>
    </div>
  </div>

  <!-- Total Volume Card -->
  <div
    class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
    data-volume-display
  >
    <div class="mb-2 flex items-center gap-3">
      <div
        class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30"
      >
        <svg
          class="h-4 w-4 text-blue-600 dark:text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div class="text-sm text-gray-500 dark:text-gray-400">Total Volume</div>
    </div>
    <div class="text-lg font-semibold text-gray-900 dark:text-white">
      {(
        (market.marketData.stakeTokens?.reduce((sum: number, stake: number) => sum + Number(stake), 0) || 0) /
        1000000
      ).toFixed(2)}
      <span class="text-sm">{sip10Data.symbol}</span>
    </div>
    <div
      class="flex justify-between w-full text-left text-[11px] font-bold text-gray-600 tabular-nums dark:text-gray-400"
    >
      {marketStakes.length} traders
    </div>
  </div>

  <!-- Market Fee Card -->
  <div
    class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
    data-volume-display
  >
    <div class="mb-2 flex items-center gap-3">
      <div
        class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30"
      >
        <svg
          class="h-4 w-4 text-purple-600 dark:text-purple-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      </div>
      <div class="text-sm text-gray-500 dark:text-gray-400">Market Fee</div>
    </div>
    <div class="text-lg font-semibold text-gray-900 dark:text-white">
      {(market.marketData.marketFeeBips / 100).toFixed(1)}%
    </div>
    <div
      class="flex justify-between w-full text-left text-[11px] font-bold text-gray-600 tabular-nums dark:text-gray-400"
    >
      Paid by winners only
    </div>
  </div>

  <!-- Market Closes Card -->
  <div
    class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
    data-volume-display
  >
    <div class="mb-2 flex items-center gap-3">
      <div
        class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30"
      >
        <svg
          class="h-4 w-4 text-orange-600 dark:text-orange-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div class="text-sm text-gray-500 dark:text-gray-400">
        {#if blocksTillClose <= 0}Closed{:else}Closes{/if}
      </div>
    </div>
    <div class="text-base font-medium text-gray-900 dark:text-white">
      ~ {dateOfResolution(currentBurnHeight, market)?.closeOffChain.split(',')[0]}
      {#if appConfig.VITE_NETWORK === 'devnet'}<br /><span
          class="mt-1 text-xs text-gray-500 dark:text-gray-400"
          >dates on testnet are unreliable</span
        >{/if}
      <div
        class="flex justify-between w-full text-left text-[11px] font-bold text-gray-600 tabular-nums dark:text-gray-400"
      >
        <div class="order-2">
          {#if isRunning(currentBurnHeight, market)}
            <!-- {estimateBitcoinBlockTime(endOfMarket, currentBurnHeight)} -->
            ~ <Countdown endBlock={endOfMarket - currentBurnHeight} />
          {:else if isResolving(market)}
            <!-- {estimateBitcoinBlockTime(endOfMarket, currentBurnHeight)} -->
            ~ <Countdown endBlock={endOfResolving - currentBurnHeight} />
          {:else if isDisputeRunning(market)}
            <!-- {estimateBitcoinBlockTime(endOfMarket, currentBurnHeight)} -->
            ~ <Countdown endBlock={endOfVoting - currentBurnHeight} />
          {/if}
        </div>
        <div class="order-1">
          <!-- {getResolutionMessage(market)} -->
          {#if blocksTillClose <= 0}
            {#if market.marketData.resolutionState === ResolutionState.RESOLUTION_OPEN}
              {#if isCooling(currentBurnHeight, market)}Market Cooling
              {:else if isDisputable(currentBurnHeight, $daoOverviewStore.contractData?.disputeWindowLength || 0, market)}Dispute window open
              {:else if getStxAddress() === daoConfig.VITE_DAO_RESOLUTION_COORDINATOR}
                <AgentResolveMarket {market} onResolved={handleResolution} />
                {message ? message : ''}
              {/if}
            {:else}{/if}
            {#if market.marketType === 2}Feed Id: {market.marketData.priceOutcome}{/if}
          {:else}
            {fmtNumber(blocksTillClose)} btc blocks
          {/if}
          <!-- {dateOfResolution(market).closeOffChain.split(', ')[1] || '00:00'} blocks -->
        </div>
      </div>
    </div>
  </div>
</div>
