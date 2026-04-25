<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { bitcoinMode, chainStore, getStxAddress, appConfigStore, requireAppConfig, requireDaoConfig, daoConfigStore } from '@bigmarket/bm-common';
  import type { AuthenticatedForumContent } from '@bigmarket/sip18-forum-types';
  import type { PredictionMarketCreateEvent, PredictionMarketStakeEvent, UserStake } from '@bigmarket/bm-types';
  import { stacks } from '@bigmarket/sdk';
  import MarketCharts from './market/version2/MarketCharts.svelte';
  import { MarketHeader, MarketResolutionCriteria } from '..';
  import MarketComments from './market/version2/MarketComments.svelte';
  import MarketStakingContainer from './MarketStakingContainer.svelte';
  import MarketSummary from './MarketSummary.svelte';

	const { market, marketStakes, thread } = $props<{
		market: PredictionMarketCreateEvent;
		marketStakes: PredictionMarketStakeEvent[];
		thread: AuthenticatedForumContent | undefined;
	}>();

	const appConfig = $derived(requireAppConfig($appConfigStore));
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));

  let blocksTillClose = 0;
  let userStake: UserStake = $state({ stakes: [] });
  let preselectIndex: number | -1 = $state(-1);
  let message: string | undefined = $state(undefined);
  const currentBurnHeight = $derived($chainStore.stacks.burn_block_height);

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
    if (market) {
      bitcoinMode.set(market.marketType === 3);
      userStake = await stacks.createMarketsClient(daoConfig).fetchUserStake(
        appConfig.VITE_STACKS_API,
        market.marketId,
        market.extension.split('.')[0],
        market.extension.split('.')[1],
        getStxAddress(),
      );
      console.log('userStake: ', userStake);

      blocksTillClose =
        (market.marketData?.marketStart || 0) +
        (market.marketData?.marketDuration || 0) -
        currentBurnHeight;

      // Read query param for deep-link preselect (client-only)
      try {
        const url = new URL(window.location.href);
        const p = url.searchParams.get('option');
        preselectIndex = p !== null && !Number.isNaN(Number(p)) ? Number(p) : -1;
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
    }
  });

  onDestroy(() => {
    // Clean up any event listeners or subscriptions
    cleanupFunctions.forEach((cleanup) => cleanup());
    cleanupFunctions = [];
    // Clear any cached data to prevent memory leaks
    userStake = { stakes: [] } as UserStake;
  });
</script>

<svelte:head>
  <title>Market Volumes</title>
  <meta name="description" content="View prediction market details and participate" />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
  {#if market}
    <!-- Market Title Section -->
    <MarketHeader
      logo={market.unhashedData.logo}
      description={market.unhashedData.description}
      name={market.unhashedData.name}
    />

    <!-- Market Overview Cards -->
    <MarketSummary market={market} {marketStakes} />

    <!-- Main Content Grid -->
    <div class="flex flex-col gap-6 md:flex-row">
      <!-- Main / chart -->
      <div class="order-2 w-full md:order-1 md:w-2/3 space-y-6">
        <!-- Chart Section -->
        <div
          class="overflow-hidden rounded-lg border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-700 dark:bg-gray-800"
        >
          <MarketCharts market={market} showTvl={false} showStake={true} />
        </div>
 
        <!-- Discussion Section -->
        <MarketComments {thread} market={market} {userStake} />
      </div>

      <!-- Right Column (4 cols) -->
      <div class="order-1 w-full md:order-2 md:w-1/3">
        <MarketStakingContainer market={market} {userStake} {preselectIndex} />
      </div>
    </div>

    <!-- Collapsible Resolution Criteria -->
    <MarketResolutionCriteria {market} />
  {:else}
    <div>Loading</div>
  {/if}
</div>
