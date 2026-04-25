<script lang="ts">
  import { onMount } from 'svelte';
  import type { PredictionMarketCreateEvent } from '@bigmarket/bm-types';
	import { getTransaction } from '@bigmarket/bm-utilities';
  import { appConfigStore, getStxAddress, requireAppConfig, requireDaoConfig, daoConfigStore } from '@bigmarket/bm-common';
  import { Banner } from '@bigmarket/bm-ui';
  import { showTxModal } from '@bigmarket/bm-common';
  import { watchTransaction } from '@bigmarket/bm-common';
  import { stacks } from '@bigmarket/sdk';
  
  const appConfig = $derived(requireAppConfig($appConfigStore));
  const daoConfig = $derived(requireDaoConfig($daoConfigStore));
  
	const { market } = $props<{
		market: PredictionMarketCreateEvent;
	}>(); 

  let errorMessage: string | undefined;
  let txId: string | undefined;

  const resolveMarket = async () => {
    const contractAddress = market.extension.split('.')[0];
    const contractName = market.extension.split('.')[1];
    let functionName = 'resolve-market-undisputed';
    const response = await requestWallet(
      `${contractAddress}.${contractName}`,
      functionName,
      [uintCV(market.marketId)],
      [],
      'deny',
    );
    if (response?.txid) {
      showTxModal(response.txid);
      watchTransaction(appConfig.VITE_BIGMARKET_API, appConfig.VITE_STACKS_API, `${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO_MARKET_VOTING}`, response.txid);
    } else {
      showTxModal('Unable to process right now');
    }
  };

  const lookupTransaction = async (txId: string) => {
    return await getTransaction(appConfig.VITE_STACKS_API, txId);
  };

  onMount(async () => {
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
    {#if txId}
      <div class="mt-5">
        <Banner
          bannerType={'warning'}
          message={'your request is being processed. See <a href="' +
            stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, txId) +
            '" target="_blank">explorer!</a>'}
        />
      </div>
    {/if}
    {#if errorMessage}
      <div class="my-4">
        {errorMessage}
      </div>
    {/if}
    <div class="">
      <button
        onclick={() => {
          errorMessage = undefined;
          resolveMarket();
        }}
        class="mt-4 rounded bg-green-700 px-4 py-2 text-white hover:bg-green-600"
      >
        OPEN CLAIMS
      </button>
    </div>
  </div>
</div>
