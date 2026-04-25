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
  import type { Payout, PredictionMarketCreateEvent, ShareCost, SharesPerCost, Sip10Data, UserStake } from '@bigmarket/bm-types';
  import { calculatePayoutCategorical, convertFiatToNative, estimateMaxSpendIncludingFee, fmtMicroToStx, fmtMicroToStxNumber, fmtStxMicro, getCategoryLabel, getMarketToken, getRate, getTierBalance, getTokenBalanceMicro, isCooling, isPostCooling, isResolvable, isStaking, isSTX, toFiat, validatePurchaseAgainstMax } from '@bigmarket/bm-utilities';
  import { stacks } from '@bigmarket/sdk';
  import { getSip10PostConditions } from '@bigmarket/sdk/dist/chains/stacks';

  const { market, userStake, preselectIndex } = $props<{
		market: PredictionMarketCreateEvent;
		userStake: UserStake;
		preselectIndex: number | -1;
	}>();

  const appConfig = $derived(requireAppConfig($appConfigStore));
  const daoConfig = $derived(requireDaoConfig($daoConfigStore));

  let feeBips = $derived($daoOverviewStore.contractData?.devFeeBips || 0);
  let componentKey = 0;
  let sip10Data: Sip10Data = $derived(getMarketToken(market.marketData.token, $allowedTokenStore) || { symbol: '', decimals: 0, name: '', balance: 0, totalSupply: 0, tokenUri: '' });
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

  function handlePresetAmount(val: number) {
    maxSpend = val || 1;
    presetSelected = val;
    handleInput();
  }

  const handleInput = () => {
    const userCostMicro = fmtStxMicro(maxSpend, sip10Data?.decimals || 0);
    if (userCostMicro > totalBalanceUToken) {
      errorMessage = 'Check balance to ensure enough funds';
    }
    const newShareCosts = $shareCosts;
    newShareCosts.userCostMicro = userCostMicro;
    stakeAmount.set(userCostMicro);
    shareCosts.set(newShareCosts);
  };
  const setSlippage = (s: number) => {
    const newsShareCosts = $shareCosts;
    newsShareCosts.slippage = s;
    shareCosts.set(newsShareCosts);
  };
  const setCurrentIndex = async (index: number) => {
    currentIndex = index;
    showInput = isStaking($chainStore.stacks.burn_block_height, market);
  };

  const doPrediction = async (index: number) => {
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
    const maxShares = await stacks.createMarketsClient(daoConfig).getMaxShares(
      appConfig.VITE_STACKS_API,
      market.marketId,
      index,
      $shareCosts.userCostMicro,
      market.extension.split('.')[0],
      market.extension.split('.')[1],
    );
    const token = $allowedTokenStore.find((t) => t.token === market.marketData.token)!;
    const response = await stacks.createMarketsClient(daoConfig).buyShares(
      market,
      token,
      index,
      getStxAddress(),
      $shareCosts.userCostMicro,
      purchaseInfo.minShares,
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

  const getQuickBuyOptions = () => {
    const quickSpend = estimateMaxSpendIncludingFee(
      market.marketData,
      currentIndex,
      feeBips,
    ).maxSpendIncludingFee;
    const quickBuy: Array<{ label: string; value: number }> = [];
    if (currentIndex < 0) return quickBuy;
    if (quickSpend > 1000000 && totalBalanceUToken > 1000000)
      quickBuy.push({ label: `1 ${sip10Data.symbol}`, value: 1 });
    if (quickSpend > 5000000 && totalBalanceUToken > 5000000)
      quickBuy.push({ label: `5 ${sip10Data.symbol}`, value: 5 });
    if (quickSpend > 100000000 && totalBalanceUToken > 100000000)
      quickBuy.push({ label: `100 ${sip10Data.symbol}`, value: 100 });
    if (totalBalanceUToken > quickSpend)
      quickBuy.push({ label: 'MAX', value: fmtMicroToStxNumber(quickSpend) });
    else if (totalBalanceUToken > 2000000)
      quickBuy.push({ label: 'MAX', value: fmtMicroToStxNumber(totalBalanceUToken - 1000000) });
    return quickBuy;
  };

  onMount(async () => {
    errorMessage = undefined;
    connected = isLoggedIn();
    const costs: Array<SharesPerCost> = [];
    // const netSpend = maxSpend * (1 - devFeeBips / 10000); // e.g. *0.98

    const numberShares = Number(`1e${sip10Data.decimals}`);
    for (let i = 0; i < market.marketData.categories.length; i++) {
      //costs.push(await getCostPerShare(appConfig.VITE_STACKS_API, market.marketId, i, maxSpend * numberShares, market.extension.split('.')[0], market.extension.split('.')[1]));
      const maxShares = await stacks.createMarketsClient(daoConfig).getMaxShares(
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
      // totalBalanceUToken = await fullBalanceInSip10Token(
      //   appConfig.VITE_STACKS_API,
      //   getStxAddress(),
      //   market.marketData.token,
      // );
      // const sum = userStake ? userStakeSum(userStake) : 0;
      // totalBalanceUToken = totalBalanceUToken - sum;
      resolutionAgent =
        getStxAddress() === $daoOverviewStore.contractData?.resolutionAgent;
    } else {
      totalBalanceUToken = 0;
    }
    handleInput();

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
            <button
              type="button"
              disabled={!connected}
              onclick={() => connected && setCurrentIndex(isSelected ? -1 : index)}
              class={`
									flex w-full cursor-pointer items-center justify-between rounded-lg border p-3 uppercase transition-all
									${
                    isYes
                      ? 'border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/30'
                      : isNo
                        ? 'border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/30'
                        : 'border-orange-200 bg-orange-50 hover:bg-orange-100 dark:border-orange-700 dark:bg-orange-900/20 dark:hover:bg-orange-900/30'
                  }
									${!connected ? 'cursor-not-allowed opacity-50' : ''}
								`}
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
                      {@html getCategoryLabel($selectedCurrency, index, market.marketData)}
                    {:else}
                      <span class="text-black"
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
              <div
                class="mt-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
                transition:slide={{ duration: 150 }}
              >
                <!-- Purchase Amount -->
                <div class="mb-3">
                  <label
                    for="stake-input-{index}"
                    class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
                  >
                    Purchase Amount
                  </label>
                  {#if totalBalanceUToken > 2000000}
                    <div class="flex gap-2">
                      <input
                        id="stake-input-{index}"
                        type="number"
                        bind:value={maxSpend}
                        oninput={handleInput}
                        placeholder="Enter amount"
                        class="flex-1 rounded border border-gray-300 bg-white px-2 py-1.5 text-sm transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-orange-500"
                      />
                      <div
                        class="rounded border border-gray-300 bg-gray-100 px-2 py-1.5 text-xs font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      >
                        {sip10Data.symbol}
                      </div>
                    </div>
                    <!-- {:else if connected}<Banner bannerType="warning" message={`Balance too low to trade - <a href=${exchangeUrl(txId)} target="_blank">buy stacks</a> or mint BIG-PLAY`} />{/if} -->
                  {:else if connected}<Banner
                      bannerType="warning"
                      message={`Balance too low to trade - mint ` + sip10Data.symbol}
                    />{/if}
                </div>

                <!-- Quick Amount Pills -->
                <div class="mb-3 flex flex-wrap gap-2">
                  {#each getQuickBuyOptions() as option}
                    <button
                      onclick={() => handlePresetAmount(option.value)}
                      class={`
                            rounded px-2 py-1 text-xs font-medium transition-colors
                            ${option.value === presetSelected ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}
                            focus:ring-1 focus:ring-orange-500/20 focus:outline-none
                          `}
                    >
                      {option.label}
                    </button>
                  {/each}
                </div>

                <!-- Trade Info Box -->
                {#if maxSpend > 0}
                  <div class="mb-3 rounded bg-orange-50 p-2 dark:bg-orange-900/20">
                    <div class="space-y-1">
                      <!-- <div class="flex justify-between text-xs">
												<span class="text-gray-600 dark:text-gray-400">You will receive:</span>
												<span class="font-medium text-gray-900 dark:text-white">
													{fmtMicroToStx($shareCosts.costs[index]?.shares)} shares
												</span>
											</div> -->
                      <div class="flex justify-between text-xs">
                        <span class="text-gray-600 dark:text-gray-400">You will pay:</span>
                        <div class="text-right">
                          <div class="font-medium text-gray-900 dark:text-white">
                            {maxSpend}
                            {sip10Data.symbol}
                          </div>
                          <div class="text-gray-500 dark:text-gray-400">
                            ≈ {toFiat(
                              getRate($exchangeRatesStore, $selectedCurrency.code),
                              fmtStxMicro(maxSpend, sip10Data.decimals),
                              sip10Data,
                            )}
                            {$selectedCurrency.code}
                          </div>
                        </div>
                      </div>
                      <div class="flex justify-between text-xs">
                        <span class="text-gray-600 dark:text-gray-400">You can win:</span>
                        <div class="text-right">
                          <div class="font-medium text-orange-600 dark:text-orange-400">
                            {(maxSpend / (probability / 100) - maxSpend).toFixed(2)}
                            {sip10Data.symbol}
                          </div>
                          <div class="text-gray-500 dark:text-gray-400">
                            ≈ {toFiat(
                              getRate($exchangeRatesStore, $selectedCurrency.code),
                              fmtStxMicro(
                                maxSpend / (probability / 100) - maxSpend,
                                sip10Data.decimals,
                              ),
                              sip10Data,
                            )}
                            {$selectedCurrency.code}
                          </div>
                        </div>
                      </div>
                      <div class="flex justify-between text-xs">
                        <span class="text-gray-600 dark:text-gray-400">Total payout:</span>
                        <div class="text-right">
                          <div class="font-medium text-green-600 dark:text-green-400">
                            {(maxSpend / (probability / 100)).toFixed(2)}
                            {sip10Data.symbol}
                          </div>
                          <div class="text-gray-500 dark:text-gray-400">
                            ≈ {toFiat(
                              getRate($exchangeRatesStore, $selectedCurrency.code),
                              fmtStxMicro(maxSpend / (probability / 100), sip10Data.decimals),
                              sip10Data,
                            )}
                            {$selectedCurrency.code}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                {/if}

                <!-- Trade Button -->
                <button
                  onclick={() => doPrediction(index)}
                  disabled={!maxSpend || maxSpend <= 0}
                  class="w-full cursor-pointer rounded bg-orange-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-orange-600 focus:ring-2 focus:ring-orange-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-white"
                >
                  {#if isBinary}
                    BUY {@html getCategoryLabel($selectedCurrency, index, market.marketData)}
                  {:else}
                    BUY {@html getCategoryLabel($selectedCurrency, index, market.marketData)}
                  {/if}
                </button>

                <!-- Note -->
                <!-- <div class="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">Shares available for trading immediately.</div> -->
              </div>
            {/if}
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
        <SlippageSlider slippage={$shareCosts.slippage} setSlippage={(s) => shareCosts.set({ ...$shareCosts, slippage: s })} />
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
