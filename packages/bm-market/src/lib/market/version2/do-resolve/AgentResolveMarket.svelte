<script lang="ts">
  import { onMount } from 'svelte';
  import type { PredictionMarketCreateEvent } from '@bigmarket/bm-types';
	import { getTransaction, mapToMinMaxStrings, resolveMarketAI } from '@bigmarket/bm-utilities';
  import { appConfigStore, getStxAddress, requireAppConfig, requireDaoConfig, daoConfigStore } from '@bigmarket/bm-common';
  import { Banner } from '@bigmarket/bm-ui';
  import { TypoHeader } from '@bigmarket/bm-ui';
  import { isLoggedIn } from '@bigmarket/bm-common';
  import { showTxModal } from '@bigmarket/bm-common';
  import { watchTransaction } from '@bigmarket/bm-common';
  import { stacks } from '@bigmarket/sdk';
  const appConfig = $derived(requireAppConfig($appConfigStore));
  const daoConfig = $derived(requireDaoConfig($daoConfigStore));


  const { market, onResolved } = $props<{
		market: PredictionMarketCreateEvent;
    onResolved: (data: any) => void;
	}>(); 

  let errorMessage: string | undefined = $state(undefined);
  let txId: string | undefined = $state(undefined);
  let stacksHeight = 0;
  let resolverAI = false;

  const resolveMarket = async (outcome: string | number) => {
    if (!isLoggedIn()) {
      errorMessage = 'Please connect your wallet';
      return;
    }
    if (resolverAI) {
      const result = await resolveMarketAI(appConfig.VITE_BIGMARKET_API, market.marketId, market.marketType);
      console.log('resolveMarket: ', result);
      return;
    }
    const response = await stacks.createMarketsClient(daoConfig).resolveMarket(outcome, market);
    if (response.success && response.txid) {
      showTxModal(response.txid);
      watchTransaction(appConfig.VITE_BIGMARKET_API, appConfig.VITE_STACKS_API, `${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO_MARKET_VOTING}`, response.txid);
    } else {
      showTxModal('Unable to process right now');
    }
    onResolved({ txId, error: false, message: 'vote sent to contract' });
  };

  const lookupTransaction = async (txId: string) => {
    return await getTransaction(appConfig.VITE_STACKS_API, txId);
  };

  onMount(async () => {
    if (market.marketType === 2) {
      const burnHeight =
        (market.marketData.marketStart || 0) +
        (market.marketData.marketDuration || 0) +
        (market.marketData.coolDownPeriod || 0);
      //const stacksBlock = await getFirstStacksBlock(appConfig.VITE_STACKS_API, burnHeight);
      //stacksHeight = stacksBlock?.stacksHeight;
    }
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      if (localStorage.getItem('resolve-market-' + market.marketId)) {
        const txIdObj = localStorage.getItem('resolve-market-' + market.marketId);
        if (txIdObj) {
          const potentialTxId = JSON.parse(txIdObj).txId;
          const tx = await lookupTransaction(potentialTxId);
          if (
            tx &&
            tx.tx_status === 'pending' &&
            tx.sender_address === getStxAddress()
          ) {
            txId = potentialTxId;
          } else {
            if (tx.sender_address === getStxAddress()) {
              localStorage.removeItem('resolve-market-' + market.marketId);
            }
          }
        }
      }
    }
  });
</script>

<div>
  <div class="flex flex-col gap-y-4">
    <TypoHeader>Resolution</TypoHeader>
    {#if txId}
      <div class="">
        <Banner
          bannerType={'warning'}
          message={'your request is being processed. See <a href="' +
            stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, txId) +
            '" target="_blank">explorer!</a>'}
        />
      </div>
    {/if}
    {#if errorMessage}
      <div class="flex w-full justify-start gap-x-4">
        {errorMessage}
      </div>
    {/if}
    {#if market.marketType === 1}
      <div class="flex w-full flex-col gap-2">
        {#each mapToMinMaxStrings(market.marketData.categories) as category, index}
          <button
            onclick={() => {
              errorMessage = undefined;
              resolveMarket(category);
            }}
            class="w-full flex-1 rounded bg-red-700 px-4 py-2 text-white transition-all duration-300 hover:bg-red-500 sm:w-auto"
          >
            RESOLVE <span class="uppercase">{category}</span>
          </button>
        {/each}
      </div>
    {:else}
      <div class="flex w-full flex-col gap-2">
        <button
          onclick={() => {
            errorMessage = undefined;
            resolveMarket(stacksHeight);
          }}
          class="w-full flex-1 rounded bg-red-700 px-4 py-2 text-white transition-all duration-300 hover:bg-red-500 sm:w-auto"
        >
          RESOLVE <span class="uppercase">{stacksHeight}</span>
        </button>
      </div>
    {/if}
  </div>
</div>
