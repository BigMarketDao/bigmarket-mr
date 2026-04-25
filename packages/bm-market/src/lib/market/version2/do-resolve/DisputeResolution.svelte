<script lang="ts">
  import { onMount } from 'svelte';
  import type { MarketData, PredictionMarketCreateEvent } from '@bigmarket/bm-types';
	import { getTransaction } from '@bigmarket/bm-utilities';
  import { appConfigStore, getStxAddress, requireAppConfig, requireDaoConfig, daoConfigStore } from '@bigmarket/bm-common';
  import { Banner } from '@bigmarket/bm-ui';
  import { isLoggedIn } from '@bigmarket/bm-common';
  import { showTxModal } from '@bigmarket/bm-common';
  import { watchTransaction } from '@bigmarket/bm-common';
  import { stacks } from '@bigmarket/sdk';

  const { market, onDispute } = $props<{
		market: PredictionMarketCreateEvent;
    onDispute: (data: any) => void;
	}>(); 
  const appConfig = $derived(requireAppConfig($appConfigStore));
  const daoConfig = $derived(requireDaoConfig($daoConfigStore));

  let merkelRoot: string | undefined;

  let errorMessage: string | undefined = $state(undefined);
  let txId: string | undefined = $state(undefined);

  const disputeResolution = async (outcome: boolean) => {
    if (!isLoggedIn()) {
      errorMessage = 'Please connect your wallet';
      return;
    }
    // 	(market-data-hash (buff 32))               ;; market metadata hash
    // (data {market-id: uint, start-burn-height: uint, end-burn-height: uint})
    // (merkle-root (optional (buff 32)))      ;; Optional Merkle root for gating
    const merkle = merkelRoot ? someCV(bufferCV(hexToBytes(merkelRoot))) : noneCV();
    const contractAddress = market.extension.split('.')[0];
    const contractName = daoConfig.VITE_DAO_MARKET_VOTING;
    let functionName = 'create-market-vote';
    const functionArgs = [
      Cl.contractPrincipal(
        daoConfig.VITE_DAO_DEPLOYER,
        daoConfig.VITE_DAO_MARKET_PREDICTING,
      ),
      Cl.uint(market.marketId),
      listCV(Array(market.marketData.categories.length).fill(uintCV(0))),
      uintCV(market.marketData.categories.length),
    ];

    const response = await requestWallet(
      `${contractAddress}.${contractName}`,
      functionName,
      functionArgs,
      [],
      'deny',
    );
    if (response?.txid) {
      showTxModal(response.txid);
      watchTransaction(appConfig.VITE_BIGMARKET_API, appConfig.VITE_STACKS_API, `${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO_MARKET_VOTING}`, response.txid);
    } else {
      showTxModal('Unable to process right now');
    }
    onDispute({ txId, error: false, message: 'vote sent to contract' });
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
    <div class="flex w-full justify-start gap-x-4">
      {#if isLoggedIn()}
        <button
          onclick={() => {
            errorMessage = undefined;
            disputeResolution(true);
          }}
          class="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          DISPUTE OUTCOME
        </button>
      {:else}
        <button
          class="mt-6 w-full rounded-lg bg-purple-500 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-purple-600"
        >
          Connect Wallet
        </button>
      {/if}
    </div>
  </div>
</div>
