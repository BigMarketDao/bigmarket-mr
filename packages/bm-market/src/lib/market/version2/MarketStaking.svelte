<script lang="ts">
  import { Banner } from '@bigmarket/bm-ui';
  import { ConnectButton } from '@bigmarket/bm-ui';
  import { appConfigStore, requireAppConfig, daoConfigStore, requireDaoConfig, daoOverviewStore, chainStore, selectedCurrency, stakeAmount, getStxAddress, userWalletStore, bitcoinMode } from '@bigmarket/bm-common';
  import { onMount } from 'svelte';
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

  const PANEL_SHELL =
    'rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 text-[var(--color-card-foreground)]';

  let isBinary = $derived(market.marketData.categories.length === 2);

  let balanceHuman = $derived(
    fmtMicroToStxNumber(totalBalanceUToken, sip10Data.decimals).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  );

  let balanceFiat = $derived(
    toFiat(getRate($exchangeRatesStore, $selectedCurrency.code), totalBalanceUToken, sip10Data),
  );

  function getProbability(index: number): number {
    const totalStakes = market.marketData.stakes.reduce(
      (sum: number, stake: number) => sum + Number(stake),
      0,
    );
    return totalStakes > 0 ? (Number(market.marketData.stakes[index]) / totalStakes) * 100 : 0;
  }

  function outcomeSide(index: number): 'yes' | 'no' | 'other' {
    if (!isBinary) return 'other';
    return index === 1 ? 'yes' : 'no';
  }

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
        const input = document.getElementById(`stake-input-${preselectIndex}`) as HTMLInputElement | null;
        if (input) {
          input.focus();
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 0);
    }
  });
</script>

{#if isCooling($chainStore.stacks.burn_block_height, market) && userStake}
  <section class={PANEL_SHELL} aria-label="Trade panel">
    <StakingCoolDown userShares={userStake!.stakes} {market} />
  </section>
{:else if isPostCooling($chainStore.stacks.burn_block_height, market)}
  <section class={PANEL_SHELL} aria-label="Trade panel">
    <h3 class="text-xl font-bold" style="font-family: var(--font-heading)">Market Closed</h3>
    <p class="mt-1 text-sm text-[var(--color-muted-foreground)]">Market resolution is in progress.</p>
    {#if isLoggedIn()}
      {#if isResolvable($chainStore.stacks.burn_block_height, market) && getStxAddress() === $daoOverviewStore.contractData?.resolutionAgent}
        <AgentResolveMarket {market} onResolved={handleResolution} />
        {errorMessage ? errorMessage : ''}
      {/if}
    {/if}
  </section>
{:else}
  <section class={PANEL_SHELL} aria-label="Trade panel">
    <div class="mb-4">
      <h3 class="text-xl font-bold" style="font-family: var(--font-heading)">Place your bet</h3>
    </div>
    {#if !connected}
      <div class="my-3 flex flex-col items-center gap-4 text-center">
        <p class="text-[var(--color-muted-foreground)]">Web2 friendly version coming soon.</p>
        <p class="text-[var(--color-muted-foreground)]">Want to participate now - with crypto?</p>
        <ConnectButton label={'CONNECT WALLET'} onConnectWallet={handleConnect} />
      </div>
    {/if}

    <div class="mb-4 space-y-1">
      <p class="text-sm text-[var(--color-muted-foreground)]">
        Your balance:
        <span class="tabular-nums text-[var(--color-card-foreground)]">{balanceHuman}</span>
        {sip10Data.symbol} ≈ {balanceFiat}
        {$selectedCurrency.code === 'USD' ? '' : ` ${$selectedCurrency.code}`}
      </p>
      <p class="text-sm text-[var(--color-muted-foreground)]">
        Closes in <Countdown endBlock={endOfMarket - currentBurnHeight} showTilde={false} suffix="" />
      </p>
    </div>

    <!-- Transaction Messages -->

    <!-- Options List -->
    {#key componentKey}
      {#if $shareCosts.costs?.length === market.marketData.categories.length && userStake}
        <div class="space-y-3">
          {#if isBinary && currentIndex >= 0}
            {@const selectedIndex = currentIndex}
            {@const otherIndex = selectedIndex === 0 ? 1 : 0}
            {@const selectedProb = getProbability(selectedIndex)}
            {@const otherProb = getProbability(otherIndex)}
            {@const selectedYes = selectedIndex === 1}

            {#if hasPosition(selectedIndex)}
              <div class="text-right">
                <div
                  class="inline-flex items-center rounded-full border border-[var(--color-success-border)] bg-[var(--color-success-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-success)]"
                >
                  You own <span class="tabular-nums"
                    >{fmtMicroToStx(getUserStakeAtIndex(selectedIndex), sip10Data.decimals)}</span
                  > shares
                </div>
              </div>
            {/if}

            <button
              type="button"
              disabled={!connected}
              class="flex w-full cursor-pointer items-center justify-between rounded-[var(--radius-md)] border-2 p-4 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] {selectedYes
                ? 'border-[var(--color-success-border)] bg-[var(--color-price-up-soft)]'
                : 'border-[var(--color-destructive-border)] bg-[var(--color-price-down-soft)]'} {!connected
                ? 'cursor-not-allowed opacity-50'
                : ''}"
              onclick={() => connected && setCurrentIndex(-1)}
            >
              <div class="flex items-center gap-3">
                <span
                  class="text-lg font-bold {selectedYes
                    ? 'text-[var(--color-success)]'
                    : 'text-[var(--color-destructive)]'}"
                >
                  {selectedYes ? '↑' : '↓'}
                </span>
                <span
                  class="font-bold {selectedYes
                    ? 'text-[var(--color-success)]'
                    : 'text-[var(--color-destructive)]'}"
                >
                  {selectedYes ? 'Yes' : 'No'}
                </span>
              </div>
              <span
                class="text-sm font-semibold tabular-nums {selectedYes
                  ? 'text-[var(--color-success)]'
                  : 'text-[var(--color-destructive)]'}"
              >
                {Math.round(selectedProb)}% think {selectedYes ? 'Yes' : 'No'}
              </span>
            </button>

            {#if showInput && connected}
              <MarketStakingPurchaseAmount
                marketData={market.marketData}
                probability={selectedProb}
                index={selectedIndex}
                {connected}
                {totalBalanceUToken}
                userStakeAtIndex={getUserStakeAtIndex(selectedIndex)}
                outcomeSide={outcomeSide(selectedIndex)}
                doBuy={doBuy}
                doSell={doSell}
              />
            {/if}

            <p class="text-xs text-[var(--color-muted-foreground)]">Or switch to:</p>
            <button
              type="button"
              disabled={!connected}
              class="flex w-full cursor-pointer items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 transition-colors duration-150 hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] {!connected
                ? 'cursor-not-allowed opacity-50'
                : ''}"
              onclick={() => connected && setCurrentIndex(otherIndex)}
            >
              <span class="text-sm font-semibold text-[var(--color-card-foreground)]">
                {otherIndex === 1 ? 'Yes' : 'No'}
              </span>
              <span class="text-xs tabular-nums text-[var(--color-muted-foreground)]">
                {Math.round(otherProb)}% think {otherIndex === 1 ? 'Yes' : 'No'}
              </span>
            </button>
          {:else if isBinary}
            {#each [0, 1] as index}
              {@const probability = getProbability(index)}
              {@const isYes = index === 1}
              {@const label = isYes ? 'Yes' : 'No'}
              <button
                type="button"
                disabled={!connected}
                class="flex w-full cursor-pointer items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-secondary)] p-4 transition-colors duration-150 hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] {!connected
                  ? 'cursor-not-allowed opacity-50'
                  : ''}"
                onclick={() => connected && setCurrentIndex(index)}
              >
                <div class="flex items-center gap-3">
                  <span class="text-lg text-[var(--color-card-foreground)]">{isYes ? '↑' : '↓'}</span>
                  <span class="font-semibold text-[var(--color-card-foreground)]">{label}</span>
                </div>
                <span class="text-sm tabular-nums text-[var(--color-muted-foreground)]">
                  {Math.round(probability)}% think {label}
                </span>
              </button>
              {#if hasPosition(index)}
                <div class="text-right">
                  <div
                    class="inline-flex items-center rounded-full border border-[var(--color-success-border)] bg-[var(--color-success-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-success)]"
                  >
                    You own <span class="tabular-nums"
                      >{fmtMicroToStx(getUserStakeAtIndex(index), sip10Data.decimals)}</span
                    > shares
                  </div>
                </div>
              {/if}
            {/each}
          {:else}
            {#each market.marketData.categories as category, index}
              {@const probability = getProbability(index)}
              {@const isSelected = currentIndex === index}
              <div class="space-y-2">
                {#if hasPosition(index)}
                  <div class="text-right">
                    <div
                      class="inline-flex items-center rounded-full border border-[var(--color-success-border)] bg-[var(--color-success-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-success)]"
                    >
                      You own <span class="tabular-nums"
                        >{fmtMicroToStx(getUserStakeAtIndex(index), sip10Data.decimals)}</span
                      > shares
                    </div>
                  </div>
                {/if}
                <button
                  type="button"
                  disabled={!connected}
                  class="flex w-full cursor-pointer items-center justify-between rounded-[var(--radius-md)] border p-4 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] {isSelected
                    ? 'border-2 border-[var(--color-warning-border)] bg-[var(--color-warning-soft)]'
                    : 'border-[var(--color-border)] bg-[var(--color-secondary)] hover:bg-[var(--color-muted)]'} {!connected
                    ? 'cursor-not-allowed opacity-50'
                    : ''}"
                  onclick={() => connected && setCurrentIndex(isSelected ? -1 : index)}
                >
                  <span class="font-semibold text-[var(--color-card-foreground)]">
                    {@html getCategoryLabel($selectedCurrency, index, market.marketData)}
                  </span>
                  <span
                    class="text-sm tabular-nums {isSelected
                      ? 'font-semibold text-[var(--color-warning)]'
                      : 'text-[var(--color-muted-foreground)]'}"
                  >
                    {Math.round(probability)}%
                  </span>
                </button>
                {#if isSelected && showInput && connected}
                  <MarketStakingPurchaseAmount
                    marketData={market.marketData}
                    {probability}
                    {index}
                    {connected}
                    {totalBalanceUToken}
                    userStakeAtIndex={getUserStakeAtIndex(index)}
                    outcomeSide="other"
                    doBuy={doBuy}
                    doSell={doSell}
                  />
                {/if}
              </div>
            {/each}
          {/if}

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
      <div class="mt-4 border-t border-[var(--color-border)] pt-3">
        <SlippageSlider slippage={$shareCosts.slippage} setSlippage={handleSetSlippage} />
      </div>
    {/if}

    <div
      class="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-4"
    >
      <button
        onclick={() => (showSlippage = !showSlippage)}
        class="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-card-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
      >
        ⚙ Advanced
      </button>
      <p class="text-sm text-[var(--color-muted-foreground)]">
        New to this?
        <a href="/docs" class="font-medium text-[var(--color-accent)]">Start here →</a>
      </p>
    </div>

    {#if resolutionAgent && (market.marketType === 1 || isPostCooling($chainStore.stacks.burn_block_height, market))}
      <div class="mt-4">
        <AgentResolveMarket {market} onResolved={handleResolution} />
      </div>
    {/if}
  </section>
{/if}
