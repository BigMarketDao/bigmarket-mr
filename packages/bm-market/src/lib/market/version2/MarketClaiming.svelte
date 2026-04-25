<script lang="ts">
  import { onMount } from 'svelte';
  import type { PredictionMarketCreateEvent, Sip10Data, UserStake } from '@bigmarket/bm-types';
	import { canUserClaim, getMarketToken, getOutcomeMessage, getTransaction, totalPoolSum } from '@bigmarket/bm-utilities';
  import { appConfigStore, requireAppConfig, allowedTokenStore, getStxAddress, chainStore, selectedCurrency } from '@bigmarket/bm-common';
  import { Banner, Panel } from '@bigmarket/bm-ui';
  import ClaimWinnings from './do-claim/ClaimWinnings.svelte';
  import TransferLosingAmount from './do-claim/TransferLosingAmount.svelte';
  import { ParaContainer } from '@bigmarket/bm-ui';
  import { stacks } from '@bigmarket/sdk';

  const appConfig = $derived(requireAppConfig($appConfigStore));

  const { market, userStake } = $props<{
		market: PredictionMarketCreateEvent;
		userStake: UserStake;
	}>();


  let sip10Data: Sip10Data;

  let errorMessage: string | undefined;
  let txId: string | undefined = $state(undefined);
  let staked: number = $state(0);
  let userShareNet: number = $state(0);
  let daoFee: number = $state(0);
  let devFee: number = $state(0) ;
  let totalPool: number = $state(0);
  let winningPool: number = $state(0);

  const lookupTransaction = async (txId: string) => {
    return await getTransaction(appConfig.VITE_STACKS_API, txId);
  };

  onMount(async () => {
    sip10Data = getMarketToken(market.marketData.token, $allowedTokenStore);
    console.log('CW: marketData.outcome: ' + market.marketData.outcome);
    console.log('CW: marketData: ', market.marketData);
    staked = userStake?.stakes[market.marketData.outcome!] || 0;
    const princ = Math.floor((10000 * staked) / 9800);
    devFee = princ - staked;
    totalPool = totalPoolSum(market.marketData.stakes);
    winningPool = market.marketData.stakes[market.marketData.outcome!];
    const userShare = Math.floor((staked * totalPool) / winningPool);
    daoFee = Math.floor((userShare * 200) / 10000);
    userShareNet = userShare - daoFee;
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      if (localStorage.getItem('claim-winnings-' + market.marketId)) {
        const txIdObj = localStorage.getItem('claim-winnings-' + market.marketId);
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
              localStorage.removeItem('claim-winnings-' + market.marketId);
            }
          }
        }
      }
    }
  });
</script>

<div id="claiming"> 
  <Panel interactive={true} accent="emerald" as="section" ariaLabel="Claim Winnings" clazz="bg-white/90 backdrop-blur shadow-lg ring-1 ring-black/5 focus-within:outline-none focus-within:ring-2 focus-within:ring-emerald-500 dark:border-gray-700/70 dark:bg-gray-800/90 dark:ring-white/10 text-gray-900 dark:text-white" forceTheme="auto">
  {#snippet children()}
    
    <!-- Claim Winnings if Eligible -->
    {#if userStake && canUserClaim(market.marketData.outcome!, userStake.stakes)}
      <ClaimWinnings {market} {userStake} />
    {:else}
      <div class="text-gray-900 dark:text-gray-100">
        <div class="flex flex-col gap-y-4">
          <h2 class="text-lg font-semibold">Claim Winnings</h2>
          <p class="font-semibold">{@html getOutcomeMessage($chainStore.stacks.burn_block_height, $selectedCurrency, market)}</p>
        </div>
      </div>
      <ParaContainer>No claims available</ParaContainer>
    {/if}

    <!-- Prompt Transfer if No Stakes in Winning Pool -->
    {#if market.marketData.stakes[market.marketData.outcome!] === 0 && !market.transferLosingStakes}
      <TransferLosingAmount {market} />
    {/if}

    <!-- Banner if Transaction Pending -->
    {#if txId}
      <Banner
        bannerType="info"
        message={`Claim submitted. <a href="${stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, txId)}" target="_blank">Track transaction</a>`}
      />
    {/if}

    <!-- Optional Debug Info -->
    <!--
		<p class="text-sm text-gray-500">
			Staked: {staked}<br />
			Total Pool: {totalPool}<br />
			Winning Pool: {winningPool}<br />
			User Net Share: {fmtMicroToStx(userShareNet, sip10Data.decimals)}<br />
			DAO Fee: {fmtMicroToStx(daoFee, sip10Data.decimals)}<br />
			Dev Fee: {fmtMicroToStx(devFee, sip10Data.decimals)}
		</p>
		-->
    {/snippet}

  </Panel>
</div>
