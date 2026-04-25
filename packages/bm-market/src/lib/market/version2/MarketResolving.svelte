<script lang="ts">
  import {
    type PredictionMarketCreateEvent,
    type Sip10Data,
    type UserStake,
  } from '@bigmarket/bm-types';
  import { onMount } from 'svelte';
  import DisputeResolution from './do-resolve/DisputeResolution.svelte';
  import { BlockHeightProgressBar } from '@bigmarket/bm-ui';
  import {
    blocksLeftForDispute,
    coolDownBlock,
    getOutcomeMessage,
    hasUserStaked,
    isCooling,
    isDisputable,
    isFinalisable,
    startBlockForDispute,
    stopBlockForDispute,
  } from '@bigmarket/bm-utilities';
  import {
    estimateBitcoinBlockTime,
    fmtMicroToStx,
    mapToMinMaxStrings,
    mapToMinMaxStringsFormatted,
  } from '@bigmarket/bm-utilities';
  import ResolvedInRange from './do-resolve/ResolvedInRange.svelte';
  import FinaliseMarket from './do-resolve/FinaliseMarket.svelte';
  import { getMarketToken, userStakeSum } from '@bigmarket/bm-utilities';
  import {
    getStxAddress,
    isLoggedIn, chainStore, daoOverviewStore, allowedTokenStore, selectedCurrency
  } from '@bigmarket/bm-common';
  import { Panel } from '@bigmarket/bm-ui';
  import { Countdown } from '@bigmarket/bm-ui';

  const { market, userStake, isCoordinator } = $props<{
		market: PredictionMarketCreateEvent;
		userStake: UserStake | undefined;
    isCoordinator: boolean;
	}>();


  let successMessage: string | undefined;
  let errorMessage: string | undefined;
  let disputable = $derived(isDisputable($chainStore.stacks.burn_block_height, $daoOverviewStore.contractData?.disputeWindowLength || 0, market));
  let sip10Data: Sip10Data = $derived(getMarketToken(market.marketData.token, $allowedTokenStore));
  let endOfDispute = $derived(
    (market.marketData?.marketStart || 0) +
    (market.marketData?.marketDuration || 0) +
    (market.marketData?.coolDownPeriod || 0) +
    ($daoOverviewStore.contractData?.disputeWindowLength || 0));
  let currentBurnHeight = $derived($chainStore.stacks.burn_block_height);

  const login = async () => {
    //loginStacksFromHeader(document);
  };

  const handleDispute = async (data: any) => {
    if (data.error) {
      errorMessage = data.message;
    } else {
      successMessage = 'Market resolution dispute begun';
    }
  };

  onMount(() => {
    console.log('MarketResolving: ', market);
  });
</script>

<Panel>
  {#if disputable}
    <!-- Disputable Resolution Summary -->
    <ResolvedInRange {market} />

    <!-- User stake state -->
    {#if hasUserStaked(userStake)}
      <p class="text-base font-medium">
        You have a stake in this market of
        <span class="font-bold"
          >{fmtMicroToStx(userStakeSum(userStake), sip10Data.decimals).substring(0, 10)}
          {sip10Data.symbol}</span
        >
      </p>
      <DisputeResolution {market} onDispute={handleDispute} />
    {:else if userStakeSum(userStake) === 0}
      <p class="text-sm">You need a stake in markets to be able to raise a dispute.</p>
    {/if}

    <!-- Block height progress -->
    <BlockHeightProgressBar
      startBurnHeight={market.marketData.resolutionBurnHeight}
      stopBurnHeight={endOfDispute}
      currentBurnHeight={$chainStore.stacks.burn_block_height || 0}
    />

    <!-- Dispute explanation -->
    <div class="text-sm leading-relaxed text-gray-900 dark:text-gray-100">
      If no challenge is made, the market will close and claims will become available.

      <br /><br />
      If someone challenges the outcome voting will begin - only those with a stake in the market are
      entitled to vote.

      <ul class="mt-2 list-inside list-disc space-y-1">
        <li>
          <a href="/dao?tab=token-sale" class="link link-primary">Get voting tokens</a>
        </li>
        <li>
          <a href="/docs" class="link link-primary">Read the docs</a> for full details.
        </li>
      </ul>
    </div>
  {:else if isCooling($chainStore.stacks.burn_block_height, market)}
    <!-- Finalisable State -->
    <p class="text-gray-900 dark:text-gray-100">
      {@html getOutcomeMessage($chainStore.stacks.burn_block_height, $selectedCurrency, market)}<br />
      <span class="font-medium"
        >Market is cooling down - claims start it {coolDownBlock(market)}.</span
      >
    </p>
  {:else if isFinalisable($chainStore.stacks.burn_block_height, $daoOverviewStore.contractData?.disputeWindowLength || 0, market)}
    <!-- Finalisable State -->
    <p class="text-gray-900 dark:text-gray-100">
      {@html getOutcomeMessage($chainStore.stacks.burn_block_height, $selectedCurrency, market)}<br />
      <span class="font-medium">Market can now be concluded to start claims.</span>
    </p>
    {#if isCoordinator}
      <p class="text-gray-900 dark:text-gray-100">
        coolDownBlock = {coolDownBlock(market)}
      </p>
      <p class="text-gray-900 dark:text-gray-100">
        current block = {$chainStore.stacks.burn_block_height}
      </p>
      <p class="text-gray-900 dark:text-gray-100">
        resolutionBurnHeight = {market.marketData.resolutionBurnHeight}
      </p>
      <p class="text-gray-900 dark:text-gray-100">
        disputeWindowLength = {$daoOverviewStore.contractData.disputeWindowLength}
      </p>
    {/if}
    <FinaliseMarket {market} />
  {:else}
    <!-- Not disputable, not finalisable -->
    <p class="text-gray-900 dark:text-gray-100">
      {@html getOutcomeMessage($chainStore.stacks.burn_block_height, $selectedCurrency, market)}<br />
      <span class="font-medium">Market closed.</span>
    </p>

    {#if isLoggedIn()}
      <FinaliseMarket {market} />
    {:else}
      <button
        class="btn btn-primary w-full sm:w-auto"
        on:click={() => {
          errorMessage = '';
          login();
        }}
      >
        Connect Wallet
      </button>
    {/if}
  {/if}
</Panel>
