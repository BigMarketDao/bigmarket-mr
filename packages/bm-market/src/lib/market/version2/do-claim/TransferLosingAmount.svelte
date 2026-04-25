<script lang="ts">
  import { onMount } from 'svelte';
  import type { PredictionMarketCreateEvent } from '@bigmarket/bm-types';
  import { Banner } from '@bigmarket/bm-ui';
  import { allowedTokenStore, appConfigStore, requireAppConfig, daoConfigStore, requireDaoConfig, showTxModal } from '@bigmarket/bm-common';
  import { watchTransaction } from '@bigmarket/bm-common';
  import { getMarketToken } from '@bigmarket/bm-utilities';
  import { stacks } from '@bigmarket/sdk';

  const { market } = $props<{
		market: PredictionMarketCreateEvent;
	}>();
	const appConfig = $derived(requireAppConfig($appConfigStore));
  const daoConfig = $derived(requireDaoConfig($daoConfigStore));

  let sip10Data = getMarketToken(market.marketData.token, $allowedTokenStore);

  let errorMessage: string | undefined=$state(undefined);
  let txId: string | undefined;
  let winningPool: number=$state(0);

  const transferBalance = async () => {
    const contractAddress = market.extension.split('.')[0];
    const contractName = market.extension.split('.')[1];
    let functionName = 'transfer-losing-stakes';
    const postConditions: Array<PostCondition> = [];
    const amount = totalPoolSum(market.marketData.stakes);
    if (!isSTX(market.marketData.token)) {
      const formattedToken = (market.marketData.token.split('.')[0] +
        '.' +
        market.marketData.token.split('.')[1]) as `${string}.${string}`;
      const postConditionFt = Pc.principal(`${contractAddress}.${contractName}`)
        .willSendLte(amount)
        .ft(formattedToken, sip10Data.symbol);
      postConditions.push(postConditionFt);
    } else {
      postConditions.push(
        Pc.principal(`${contractAddress}.${contractName}`).willSendLte(amount).ustx(),
      );
    }
    const functionArgs = [uintCV(market.marketId), Cl.principal(market.marketData.token)];
    const response = await requestWallet(
      `${contractAddress}.${contractName}`,
      functionName,
      functionArgs,
      postConditions,
      'deny',
    );
    if (response?.txid) {
      showTxModal(response.txid);
      watchTransaction(appConfig.VITE_BIGMARKET_API, appConfig.VITE_STACKS_API, `${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO_MARKET_VOTING}`, response.txid);
    } else {
      showTxModal('Unable to process right now');
    }
  };

  onMount(async () => {
    winningPool = market.marketData.stakes[market.marketData.outcome!];
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
      {#if winningPool === 0}
        <button
          onclick={() => {
            errorMessage = undefined;
            transferBalance();
          }}
          class="mt-4 rounded bg-green-700 px-4 py-2 text-white hover:bg-green-600"
        >
          TRANSFER BALANCE
        </button>
        <p class="my-3 text-sm">
          There were no winners of this market. The funds can be safely transferred to the DAO
          treasury
        </p>
      {/if}
    </div>
  </div>
</div>
