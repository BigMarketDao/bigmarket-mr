<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { chainStore, appConfigStore, requireAppConfig, requireDaoConfig, daoConfigStore } from '@bigmarket/bm-common';
  import type { AuthenticatedForumContent } from '@bigmarket/sip18-forum-types';
  import type {
    PredictionMarketAccounting,
    PredictionMarketCreateEvent,
    PredictionMarketStakeEvent,
    UserLPShares,
    UserStake,
    UserTokens,
  } from '@bigmarket/bm-types';
  import { ResolutionState } from '@bigmarket/bm-types';
  import MarketCharts from './market/version2/MarketCharts.svelte';
  import { MarketHeader, MarketResolutionCriteria } from '..';
  import MarketComments from './market/version2/MarketComments.svelte';
  import MarketStakingContainer from './MarketStakingContainer.svelte';
  import MarketLiquidityContainer from './MarketLiquidityContainer.svelte';
  import MarketSummary from './MarketSummary.svelte';
  import ResolutionBanner from './market/version2/do-resolve/ResolutionBanner.svelte';

	const {
    market,
    marketStakes,
    marketAccounting,
    userStake,
    userLPTokensShares,
    thread,
    onRefreshUserData,
  } = $props<{
		market: PredictionMarketCreateEvent;
		marketStakes: PredictionMarketStakeEvent[];
		marketAccounting: PredictionMarketAccounting;
		userStake: UserStake | { stakes: [] };
		userLPTokensShares: UserLPShares | null;
		thread: AuthenticatedForumContent | undefined;
    onRefreshUserData?: () => void | Promise<void>;
	}>();

	const appConfig = $derived(requireAppConfig($appConfigStore));
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));

  let blocksTillClose = 0;
  let preselectIndex: number | -1 = $state(-1);
  /** Trade vs liquidity panel when market is open */
  let sidePanelTab = $state<'trade' | 'liquidity'>('trade');
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
    cleanupFunctions.forEach((cleanup) => cleanup());
    cleanupFunctions = [];
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

    <ResolutionBanner {market} />

    <div class="mt-6 grid gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
      <aside class="space-y-4 lg:sticky lg:top-16 lg:col-start-2 lg:row-start-1 lg:self-start">
        {#if market.marketData.resolutionState === ResolutionState.RESOLUTION_OPEN}
          <div
            class="flex rounded-[var(--radius-md)] bg-[var(--color-secondary)] p-1"
            role="tablist"
            aria-label="Market actions"
          >
            <button
              type="button"
              role="tab"
              aria-selected={sidePanelTab === 'trade'}
              class="flex-1 rounded-[var(--radius-sm)] py-2 text-center text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] {sidePanelTab ===
              'trade'
                ? 'bg-[var(--color-card)] font-semibold text-[var(--color-card-foreground)] shadow-sm'
                : 'font-normal text-[var(--color-muted-foreground)] hover:text-[var(--color-card-foreground)]'}"
              onclick={() => {
                sidePanelTab = 'trade';
              }}
            >
              Trade
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={sidePanelTab === 'liquidity'}
              class="flex-1 rounded-[var(--radius-sm)] py-2 text-center text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] {sidePanelTab ===
              'liquidity'
                ? 'bg-[var(--color-card)] font-semibold text-[var(--color-card-foreground)] shadow-sm'
                : 'font-normal text-[var(--color-muted-foreground)] hover:text-[var(--color-card-foreground)]'}"
              onclick={() => {
                sidePanelTab = 'liquidity';
              }}
            >
              Liquidity
            </button>
          </div>
          {#if sidePanelTab === 'trade'}
            <MarketStakingContainer market={market} {userStake} {preselectIndex} />
          {:else}
            <MarketLiquidityContainer
              market={market}
              {marketAccounting}
              userLPTokensShares={userLPTokensShares}
              onRefreshUserData={onRefreshUserData}
            />
          {/if}
        {:else}
          <MarketStakingContainer market={market} {userStake} {preselectIndex} />
        {/if}
      </aside>

      <main class="min-w-0 space-y-6 lg:col-start-1 lg:row-start-1">
        <div class="overflow-hidden rounded-md border border-border bg-card p-4 sm:p-6">
          <MarketCharts market={market} showTvl={false} showStake={true} />
        </div>
        <MarketComments {thread} market={market} {userStake} />
      </main>

    </div>

    <!-- Collapsible Resolution Criteria -->
    <MarketResolutionCriteria {market} />
  {:else}
    <div>Loading</div>
  {/if}
</div>
