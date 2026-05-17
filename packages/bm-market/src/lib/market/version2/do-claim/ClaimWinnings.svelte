<script lang="ts">
  import { onMount } from 'svelte';
  import type { PredictionMarketCreateEvent, Sip10Data, UserStake } from '@bigmarket/bm-types';
	import { canUserClaim, fmtMicroToStx, getMarketToken, getOutcomeMessage, getTransaction, getWinningClaimAmounts, totalPoolSum } from '@bigmarket/bm-utilities';
  import { allowedTokenStore, appConfigStore, chainStore, getStxAddress, requireAppConfig, selectedCurrency } from '@bigmarket/bm-common';
  import { Banner } from '@bigmarket/bm-ui';
  import { showTxModal } from '@bigmarket/bm-common';
  import { stacks } from '@bigmarket/sdk';

  const appConfig = $derived(requireAppConfig($appConfigStore));

  const { market, userStake } = $props<{
		market: PredictionMarketCreateEvent;
    userStake: UserStake;
	}>(); 

  let sip10Data: Sip10Data | undefined = $state(undefined);
  let winnings: { grossRefund: bigint; marketFee: bigint; netAmount: bigint } | undefined = $state(undefined);

  let errorMessage: string | undefined=$state(undefined);
  let txId: string | undefined=$state(undefined);
  let staked: number;
  let userShareNet: number=$state(0);
  let daoFee: number=$state(0);
  let devFee: number=$state(0);
  let totalPool: number;
  let winningPool: number=$state(0);

  const claimWinningsInt = async () => {
    txId = await claimWinnings(
      market.extension,
      market.marketData,
      market.marketId,
      sip10Data,
      userStake,
    );
    showTxModal(txId || 'Unable to process right now');
  };

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
    winnings = getWinningClaimAmounts(market.marketData, userStake);
  });
</script>

<div>
  <div class="text-foreground">
    <div class="flex flex-col gap-y-4">
      <h2 class="text-lg font-semibold">Claim Winnings</h2>
      <p class="font-semibold">{@html getOutcomeMessage($chainStore.stacks.burn_block_height, $selectedCurrency, market)}</p>
      <div class="text-sm font-extralight">
        {#if winnings}
          <p class="font-semibold">
            Market Fee: {fmtMicroToStx(Number(winnings.marketFee), 6)} ({market.marketData
              .marketFeeBips / 100}%)
          </p>
          <p class="font-semibold text-success tabular-nums">
            Winnings: {fmtMicroToStx(Number(winnings.netAmount), 6)}
          </p>
        {/if}
      </div>

      {#if canUserClaim(market.marketData.outcome!, userStake.stakes)}
        <div class="">
          <button
            onclick={() => {
              errorMessage = undefined;
              claimWinningsInt();
            }}
            class="mt-4 h-11 cursor-pointer rounded-md bg-success px-4 text-sm font-semibold text-success-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-10"
          >
            CLAIM WINNINGS
          </button>
        </div>
      {/if}
      {#if txId}
        <div class="my-5">
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
      {#if sip10Data}
        <!-- <table class="w-full table-auto border-collapse border border-border">
					<thead>
						<tr class="bg-muted">
							<th class="border border-border px-4 py-2 text-left text-sm font-medium text-muted-foreground">Label</th>
							<th class="border border-border px-4 py-2 text-left text-sm font-medium text-muted-foreground">Value</th>
						</tr>
					</thead>
					<tbody>
						<tr class="bg-muted">
							<td class="border border-border px-4 py-2 text-sm text-foreground">Total Pool</td>
							<td class="border border-border px-4 py-2 text-sm text-foreground">
								{fmtMicroToStx(totalPool, sip10Data.decimals)}
							</td>
						</tr>
						<tr class="bg-muted">
							<td class="border border-border px-4 py-2 text-sm text-foreground">Winning Pool</td>
							<td class="border border-border px-4 py-2 text-sm text-foreground">
								{fmtMicroToStx(winningPool, sip10Data.decimals)}
							</td>
						</tr>
						<tr class="bg-muted">
							<td class="border border-border px-4 py-2 text-sm text-foreground">Dev Fee</td>
							<td class="border border-border px-4 py-2 text-sm text-foreground">
								{fmtMicroToStx(devFee, sip10Data.decimals)}
							</td>
						</tr>
						<tr class="bg-muted">
							<td class="border border-border px-4 py-2 text-sm text-foreground">Dao Fee</td>
							<td class="border border-border px-4 py-2 text-sm text-foreground">
								{fmtMicroToStx(daoFee, sip10Data.decimals)}
							</td>
						</tr>
						<tr class="bg-muted">
							<td class="border border-border px-4 py-2 text-sm text-foreground">Staked</td>
							<td class="border border-border px-4 py-2 text-sm text-foreground">
								{fmtMicroToStx(staked, sip10Data.decimals)}
							</td>
						</tr>
						<tr class="bg-muted">
							<td class="border border-border px-4 py-2 text-sm text-foreground">Net Share</td>
							<td class="border border-border px-4 py-2 text-sm text-foreground">
								{fmtMicroToStx(userShareNet, sip10Data.decimals)}
							</td>
						</tr>
					</tbody>
				</table> -->
      {/if}
    </div>
  </div>
</div>
