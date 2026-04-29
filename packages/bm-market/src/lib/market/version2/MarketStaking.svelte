<script lang="ts">
  import { Banner, Panel } from '@bigmarket/bm-ui';
  import { ConnectButton } from '@bigmarket/bm-ui';
  import { appConfigStore, requireAppConfig, daoConfigStore, requireDaoConfig, daoOverviewStore, chainStore, selectedCurrency, stakeAmount, getStxAddress, userWalletStore, bitcoinMode } from '@bigmarket/bm-common';
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import AgentResolveMarket from './do-resolve/AgentResolveMarket.svelte';
  import SlippageSlider from './do-stake/SlippageSlider.svelte';
  import StakingCoolDown from './do-stake/StakingCoolDown.svelte';
  import { showTxModal, shareCosts, allowedTokenStore} from '@bigmarket/bm-common';
  import { Countdown } from '@bigmarket/bm-ui';
  import { watchTransaction, exchangeRatesStore, isLoggedIn } from '@bigmarket/bm-common';
  import type { Payout, PredictionMarketCreateEvent, ShareCost, MaxBuyable, Sip10Data, UserStake, MaxSellable } from '@bigmarket/bm-types';
  import { calculatePayoutCategorical, convertFiatToNative, estimateMaxSpendIncludingFee, fmtMicroToStx, fmtMicroToStxNumber, fmtStxMicro, getCategoryLabel, getMarketToken, getRate, getTierBalance, getTokenBalanceMicro, isCooling, isPostCooling, isResolvable, isStaking, isSTX, STAKING_TIER, toFiat, validatePurchaseAgainstMax } from '@bigmarket/bm-utilities';
  import { stacks } from '@bigmarket/sdk';
  import { getSip10PostConditions } from '@bigmarket/sdk/dist/chains/stacks';
  import MarketStakingPurchaseAmount from './market-staking-components/MarketStakingPurchaseAmount.svelte';

  const { market, userStake, preselectIndex } = $props<{
		market: PredictionMarketCreateEvent;
		userStake: UserStake;
		preselectIndex: number | -1;
	}>();

  const appConfig = $derived(requireAppConfig($appConfigStore));
  const daoConfig = $derived(requireDaoConfig($daoConfigStore));

  let feeBips = $derived($daoOverviewStore.contractData?.devFeeBips || 0);
  let componentKey = 0;
  let sip10Data: Sip10Data = $derived(getMarketToken(market.marketData.token, $allowedTokenStore) || { symbol: '', decimals: 0, name: '', balance: 0, totalSupply: 0, tokenUri: '' } as Sip10Data);
  let totalBalanceUToken: number = $state(0);
  let resolutionAgent: boolean=$derived(getStxAddress() === $daoOverviewStore.contractData?.resolutionAgent);
  let maxSpend = $state(1);
  let costs: Array<ShareCost> = $state([]);
  let showSlippage = $state(false);
  let showInput = $state(false);
  let currentIndex = $state(-1);
  let connected = $state(false);
  let presetSelected = $state(1);

  let endOfMarket = $derived(
    (market.marketData?.marketStart || 0) + (market.marketData?.marketDuration || 0)
  );
  let currentBurnHeight = $derived($chainStore.stacks.burn_block_height);

  let errorMessage: string | undefined = $state(undefined);
  let successMessage: string | undefined = $state(undefined);

  let txId: string | undefined = $state(undefined);
  const hundredNative = convertFiatToNative($exchangeRatesStore, 100, $selectedCurrency.code);
  let payouts = $derived(calculatePayoutCategorical(
    $exchangeRatesStore,
    hundredNative,
    sip10Data?.decimals || 0,
    userStake,
    market.marketData,
    $selectedCurrency,
  ));

  const handleConnect = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // showOnRampModal.set(!$showOnRampModal);
  };

  const getUserStakeAtIndex = (index: number):number => {
    return userStake?.stakes[index] || 0;
  };
  const hasPosition = (index: number):number => {
    return userStake && userStake.stakes[index] > 0;
  };

  const handleSetSlippage = (s: number) => {
    const newsShareCosts = $shareCosts;
    newsShareCosts.slippage = s;
    shareCosts.set(newsShareCosts);
  };
  const setCurrentIndex = async (index: number) => {
    currentIndex = index;
    showInput = isStaking($chainStore.stacks.burn_block_height, market);
  };

  const doBuy = async (index: number) => {
    if (typeof window === 'undefined') return false;
    errorMessage = undefined;
    if (!isLoggedIn()) {
      errorMessage = 'Please connect your wallet';
      return;
    }
    if ($shareCosts.userCostMicro <= 0) {
      errorMessage = `Amount is required`;
      return;
    }
    if (appConfig.VITE_NETWORK !== 'devnet' && $shareCosts.userCostMicro > totalBalanceUToken) {
      errorMessage = 'Amount exceeds your balance';
      return;
    }

    let mult = isSTX(market.marketData.token) ? 1_000_000 : Number(`1e${sip10Data?.decimals || 0}`);

    const purchaseInfo = validatePurchaseAgainstMax(
      {
        index,
        totalCost: $shareCosts.userCostMicro,
        feeBips: $daoOverviewStore.contractData?.devFeeBips || 0,
        slippage: $shareCosts.slippage,
      },
      market.marketData,
    );
    const maxShares = await stacks.createMarketsClient(daoConfig).fetchMaxShares(
      appConfig.VITE_STACKS_API,
      market.marketId,
      index,
      $shareCosts.userCostMicro,
      market.extension.split('.')[0],
      market.extension.split('.')[1],
    );
    const token = $allowedTokenStore.find((t) => t.token === market.marketData.token)!;
    const tierBalance = await getTierBalance(appConfig.VITE_BIGMARKET_API, STAKING_TIER, getStxAddress());

    const response = await stacks.createMarketsClient(daoConfig).buyShares(
      getStxAddress(),
      market,
      token,
      index,
      $shareCosts.userCostMicro,
      purchaseInfo.minShares,
      tierBalance
    );
    if (response.success) {
      showTxModal(response.txid);
      watchTransaction(appConfig.VITE_BIGMARKET_API, appConfig.VITE_STACKS_API, `${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO_MARKET_VOTING}`, response.txid);
    } else {
      showTxModal('Unable to process right now');
    }

  };

  const doSell= async (index: number) => {
    if (typeof window === 'undefined') return false;
    errorMessage = undefined;
    if (!isLoggedIn()) {
      errorMessage = 'Please connect your wallet';
      return;
    }
    if ($shareCosts.userCostMicro <= 0) {
      errorMessage = `Amount is required`;
      return;
    }
    const purchaseInfo = validatePurchaseAgainstMax(
      {
        index,
        totalCost: $shareCosts.userCostMicro,
        feeBips: $daoOverviewStore.contractData?.devFeeBips || 0,
        slippage: $shareCosts.slippage,
      },
      market.marketData,
    );
    const maxSellable: MaxSellable = await stacks.createMarketsClient(daoConfig).fetchSellRefund(
      appConfig.VITE_STACKS_API,
      market.marketId,
      index,
      $shareCosts.userCostMicro,
      market.extension.split('.')[0],
      market.extension.split('.')[1],
    );
    const token = $allowedTokenStore.find((t) => t.token === market.marketData.token)!;
    const tierBalance = await getTierBalance(appConfig.VITE_BIGMARKET_API, STAKING_TIER, getStxAddress());
    const minRefund = Math.floor(maxSellable.refund * $shareCosts.slippage) // 1% slippage tolerance

    const response = await stacks.createMarketsClient(daoConfig).sellShares(
      getStxAddress(),
      market,
      token,
      index,
      maxSellable.sharesIn,
      minRefund,
    );
    if (response.success) {
      showTxModal(response.txid);
      watchTransaction(appConfig.VITE_BIGMARKET_API, appConfig.VITE_STACKS_API, `${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO_MARKET_VOTING}`, response.txid);
    } else {
      showTxModal('Unable to process right now');
    }

  };

  const handleResolution = async (data: any) => {
    errorMessage = undefined;
    if (data.error) {
      errorMessage = data.message;
    } else {
      successMessage = 'Market resolution begun';
    }
  };

  onMount(async () => {
    errorMessage = undefined;
    connected = isLoggedIn();
    const costs: Array<MaxBuyable> = [];
    // const netSpend = maxSpend * (1 - devFeeBips / 10000); // e.g. *0.98

    const numberShares = Number(`1e${sip10Data.decimals}`);
    for (let i = 0; i < market.marketData.categories.length; i++) {
      //costs.push(await getCostPerShare(appConfig.VITE_STACKS_API, market.marketId, i, maxSpend * numberShares, market.extension.split('.')[0], market.extension.split('.')[1]));
      const maxShares = await stacks.createMarketsClient(daoConfig).fetchMaxShares(
        appConfig.VITE_STACKS_API,
        market.marketId,
        i,
        100000000,
        market.extension.split('.')[0],
        market.extension.split('.')[1],
      );
      costs.push(maxShares);
      console.log('maxShares: ', maxShares); 
    }
    let slippage = 0.3;
    shareCosts.set({ userCostMicro: 0, costs, sip10Data, slippage });
    if (isLoggedIn()) {
      const tokenBalances = $userWalletStore.tokenBalances;
      totalBalanceUToken = getTokenBalanceMicro(market.marketData.token, tokenBalances!);
      resolutionAgent =
        getStxAddress() === $daoOverviewStore.contractData?.resolutionAgent;
    } else {
      totalBalanceUToken = 0;
    }

    // Preselect option and focus amount if deep-linked
    if (
      preselectIndex >= 0 &&
      preselectIndex < market.marketData.categories.length
    ) {
      setCurrentIndex(preselectIndex);
      showInput = true;
      // Focus stake input as soon as it exists in DOM
      setTimeout(() => {
        const input = document.getElementById('stake-input') as HTMLInputElement | null;
        if (input) {
          input.focus();
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 0);
    }
  });
</script>

{#if isCooling($chainStore.stacks.burn_block_height, market) && userStake}
  <Panel>
    <StakingCoolDown userShares={userStake!.stakes} {market} />
  </Panel>
{:else if isPostCooling($chainStore.stacks.burn_block_height, market)}
  <Panel>
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Market Closed</h3>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Market resolution is in progress.</p>
    {#if isLoggedIn()}
      {#if isResolvable($chainStore.stacks.burn_block_height, market) && getStxAddress() === $daoOverviewStore.contractData?.resolutionAgent}
        <AgentResolveMarket {market} onResolved={handleResolution} />
        {errorMessage ? errorMessage : ''}
      {/if}
    {/if}
  </Panel>
{:else}
  <Panel>
    <!-- Header -->
    <div class="mb-1">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Trade Shares</h3>
    </div>
    {#if !connected}
      <div class="my-3 flex flex-col items-center gap-4 text-center">
        <p class="text-gray-500 dark:text-gray-400">Web2 friendly version coming soon.</p>
        <p class="text-gray-500 dark:text-gray-400">Want to participate now - with crypto?</p>
        <ConnectButton label={'CONNECT WALLET'} onConnectWallet={handleConnect} />
      </div>
    {/if}

    <!-- Stats Bar -->
    <div class="mb-4 grid grid-cols-1 gap-1">
      <div class="rounded">
        <span class="text-xs">{sip10Data.symbol} Balance</span>
        <span class="text-xs font-medium text-gray-900 dark:text-white">
          {fmtMicroToStx(totalBalanceUToken, sip10Data.decimals)}
        </span>
        <span class="text-xs">
          ≈ {toFiat(getRate($exchangeRatesStore, $selectedCurrency.code), totalBalanceUToken, sip10Data)}
          {$selectedCurrency.code}
        </span>
      </div>
      <div class="mt-0 text-xs">
        <Countdown endBlock={endOfMarket - currentBurnHeight} /> left to buy ...
      </div>
    </div>

    <!-- Transaction Messages -->

    <!-- Options List -->
    {#key componentKey}
      {#if $shareCosts.costs?.length === market.marketData.categories.length && userStake}
        <div class="space-y-3">
          {#each market.marketData.categories as category, index}
            {@const totalStakes = market.marketData.stakes.reduce(
              (sum: number, stake: number) => sum + Number(stake),
              0,
            )}
            {@const probability =
              totalStakes > 0 ? (Number(market.marketData.stakes[index]) / totalStakes) * 100 : 0}
            {@const isSelected = currentIndex === index}
            {@const isBinary = market.marketData.categories.length === 2}
            {@const isYes = isBinary && index === 1}
            {@const isNo = isBinary && index === 0}

            <!-- Simple Button Design -->
            <div class={`
              min-w-0 max-w-full rounded-lg border p-3
              ${
                isYes
                  ? 'border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/30'
                  : isNo
                    ? 'border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/30'
                    : 'border-orange-200 bg-orange-50 hover:bg-orange-100 dark:border-orange-700 dark:bg-orange-900/20 dark:hover:bg-orange-900/30'
              }
              ${!connected ? 'cursor-not-allowed opacity-50' : ''}
            `}>
              <div                 class={`
                text-right text-sm font-bold
                ${isYes ? 'text-green-600 dark:text-green-400' : isNo ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}
              `}
          >

                <div>            
                  {#if hasPosition(index)}
                    <div class="mt-1 inline-flex items-center rounded-full border border-green-200 bg-green-100/70 px-2.5 py-1 text-xs font-medium text-green-800 dark:border-green-900/70 dark:bg-green-900/30 dark:text-green-300">
                      You own {fmtMicroToStx(getUserStakeAtIndex(index), sip10Data.decimals)} shares
                    </div>
                  {/if}
                </div>
              </div>

            <button
            class={`
              flex w-full cursor-pointer items-center justify-between p-3 uppercase transition-all
              ${!connected ? 'cursor-not-allowed opacity-50' : ''}
            `}
              type="button"
              disabled={!connected}
              onclick={() => connected && setCurrentIndex(isSelected ? -1 : index)}
            >
              <div class="flex items-center gap-3">
                <div
                  class={`
                      flex h-5 w-5 items-center justify-center rounded text-xs font-bold text-white
                      ${isYes ? 'bg-green-500' : isNo ? 'bg-red-500' : 'bg-orange-500'}
                    `}
                >
                  {isYes ? '↑' : isNo ? '↓' : index + 1}
                </div>
                <div class="text-left">
                  <div
                    class={`
                        text-sm font-medium
                        ${isYes ? 'text-green-700  dark:text-green-300' : isNo ? 'text-red-700 dark:text-red-300' : 'text-orange-700 dark:text-orange-300'}
                      `}
                  >
                    {#if isBinary}
                    <span class="text-white">{@html getCategoryLabel($selectedCurrency, index, market.marketData)}</span>
                    {:else}
                      <span class="text-white"
                        >{@html getCategoryLabel($selectedCurrency, index, market.marketData)}</span
                      >
                    {/if}
                    <!-- {isBinary ? (isYes ? 'Yes' : 'No') : getCategoryLabel(index, market.marketData)} -->
                  </div>
                  <!-- <div class="text-xs text-gray-500 dark:text-gray-400">
										${outcomeVolume.toFixed(2)} volume
									</div> -->
                </div>
              </div>

              <div
                class={`
                    text-right text-sm font-bold
                    ${isYes ? 'text-green-600 dark:text-green-400' : isNo ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}
                  `}
              >
                {probability.toFixed(1)}%
                <div class="text-xs font-normal text-gray-500 dark:text-gray-400">chance</div>
              </div>
            </button>

            <!-- Purchase Panel - Slides Open -->
            {#if isSelected && showInput && connected}
              <MarketStakingPurchaseAmount marketData={market.marketData} probability={probability} index={index} connected={connected} totalBalanceUToken={totalBalanceUToken} userStakeAtIndex={getUserStakeAtIndex(index)} doBuy={doBuy} doSell={doSell} />
            {/if}
          </div>
          {/each}
          {#if $bitcoinMode && txId}
            <div class="mb-4 text-white">
              <Banner
                bannerType="info"
                message={`Your shares are on the way - <a href=${stacks.explorerBtcTxUrl(appConfig.VITE_MEMPOOL_API, (txId || ''))} target="_blank">track transaction</a>`}
              />
            </div>
          {:else if txId}
            <div class="mb-4 text-white">
              <Banner
                bannerType="info"
                message={`Your shares are on the way - <a href=${stacks.explorerBtcTxUrl(appConfig.VITE_MEMPOOL_API, txId)} target="_blank">track transaction</a>`}
              />
            </div>
          {/if}
          {#if errorMessage && connected}
            <div class="mb-4 text-white">
              <Banner bannerType="error" message={errorMessage} />
            </div>
          {/if}
        </div>
      {/if}
    {/key}

    <!-- Slippage Settings -->
    {#if showSlippage}
      <div class="mt-4 border-t border-gray-200 pt-3 dark:border-gray-700">
        <SlippageSlider slippage={$shareCosts.slippage} setSlippage={handleSetSlippage} />
      </div>
    {/if}

    <!-- Footer Links -->
    <div class="mt-4 border-t border-gray-200 pt-3 text-center dark:border-gray-700">
      <button
        onclick={() => (showSlippage = !showSlippage)}
        class="mr-3 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        ⚙️ Settings
      </button>
      <a href="/docs" class="text-xs text-orange-500 hover:text-orange-600">
        How does prediction work?
      </a>
    </div>

    <!-- Keep existing Agent Resolution section exactly as is -->
    {#if resolutionAgent && (market.marketType === 1 || isPostCooling($chainStore.stacks.burn_block_height, market))}
      <div class="mt-4">
        <AgentResolveMarket {market} onResolved={handleResolution} />
      </div>
    {/if}
  </Panel>
{/if}
