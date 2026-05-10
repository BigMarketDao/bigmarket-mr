<script lang="ts">
  import { Banner, Panel } from '@bigmarket/bm-ui';
  import { ConnectButton } from '@bigmarket/bm-ui';
  import {
    appConfigStore,
    requireAppConfig,
    daoConfigStore,
    requireDaoConfig,
    daoOverviewStore,
    getStxAddress,
    allowedTokenStore,
    showTxModal,
    watchTransaction,
    isLoggedIn,
    userWalletStore,
  } from '@bigmarket/bm-common';
  import SlippageSlider from './do-stake/SlippageSlider.svelte';
  import type {
    PredictionMarketAccounting,
    PredictionMarketCreateEvent,
    Sip10Data,
    TokenPermissionEvent,
    UserLPShares,
  } from '@bigmarket/bm-types';
  import {
    ADD_LIQUIDITY_TIER,
    REMOVE_LIQUIDITY_TIER,
    fmtMicroToStx,
    getMarketToken,
    getTierBalance,
    getTokenBalanceMicro,
    isSTX,
  } from '@bigmarket/bm-utilities';
  import { stacks } from '@bigmarket/sdk';
  import { onMount } from 'svelte';

  const {
    market,
    marketAccounting,
    userLPTokensShares,
    onTxSubmitted,
  } = $props<{
    market: PredictionMarketCreateEvent;
    marketAccounting: PredictionMarketAccounting;
    userLPTokensShares: UserLPShares | null;
    onTxSubmitted?: () => void | Promise<void>;
  }>();

  const appConfig = $derived(requireAppConfig($appConfigStore));
  const daoConfig = $derived(requireDaoConfig($daoConfigStore));

  let liquiditySection = $state<'add' | 'remove' | 'claim'>('add');
  let connected = $state(false);

  let addAmountHuman = $state('');
  let removeAmountHuman = $state('');

  /** Same semantics as trading slippage slider: e.g. 0.003 = 0.3% */
  let slipAdd = $state(0.003);
  let slipRemove = $state(0.005);

  let errorMessage = $state<string | undefined>(undefined);

  let sip10Data: Sip10Data = $derived(
    getMarketToken(market.marketData.token, $allowedTokenStore) ||
      ({
        symbol: '',
        decimals: 0,
        name: '',
        balance: 0,
        totalSupply: 0,
        tokenUri: '',
      } as Sip10Data),
  );

  let tokenMicroMultiplier = $derived(
    isSTX(market.marketData.token) ? 1_000_000 : Number(`1e${sip10Data?.decimals || 0}`),
  );

  let totalBalanceUToken = $state(0);

  let totalPoolStakes = $derived(
    (marketAccounting?.stakes ?? []).reduce(
      (a: number, b: unknown) => a + (Number(b) || 0),
      0,
    ),
  );

  let totalStakeTokens = $derived(
    (marketAccounting?.stakeTokens ?? []).reduce(
      (a: number, b: unknown) => a + (Number(b) || 0),
      0,
    ),
  );

  let expectedTotalStakes = $derived(totalPoolStakes);

  let lpSharesRaw = $derived(normalizeLpShares(userLPTokensShares));

  let accumulatedFees = $derived(marketAccounting?.accumulatedLpFees ?? 0);

  function normalizeLpShares(lp: UserLPShares | null | undefined): number {
    if (lp == null) return 0;
    return lp.shares;
  }

  function parseHumanToMicro(raw: string): number | null {
    const n = Number(String(raw).replace(/,/g, '').trim());
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.floor(n * tokenMicroMultiplier);
  }

  function parseRemoveStakeUnits(raw: string): number | null {
    const n = Number(String(raw).replace(/,/g, '').trim());
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.floor(n * tokenMicroMultiplier);
  }

  let addAmountMicro = $derived(parseHumanToMicro(addAmountHuman));
  let removeStakeUnits = $derived(parseRemoveStakeUnits(removeAmountHuman));

  let maxDeviationBipsAdd = $derived(Math.max(1, Math.round(slipAdd * 10000)));

  let estimatedRefundRemove = $derived.by(() => {
    const amt = removeStakeUnits;
    if (amt == null || totalPoolStakes <= 0) return 0;
    return Math.floor((amt * totalStakeTokens) / totalPoolStakes);
  });

  let minRefundRemove = $derived(
    Math.floor(estimatedRefundRemove * (1 - slipRemove)),
  );

  const resolveTokenPermission = (): TokenPermissionEvent | undefined => {
    return $allowedTokenStore.find((t) => t.token === market.marketData.token);
  };

  const refreshBalances = () => {
    if (isLoggedIn()) {
      const tokenBalances = $userWalletStore.tokenBalances;
      totalBalanceUToken = getTokenBalanceMicro(market.marketData.token, tokenBalances!);
    } else {
      totalBalanceUToken = 0;
    }
  };

  const afterTx = async (txid: string | undefined, ok: boolean) => {
    if (ok && txid) {
      showTxModal(txid);
      watchTransaction(
        appConfig.VITE_BIGMARKET_API,
        appConfig.VITE_STACKS_API,
        `${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO_MARKET_VOTING}`,
        txid,
      );
      await onTxSubmitted?.();
      refreshBalances();
    } else {
      showTxModal('Unable to process right now');
    }
  };

  const doAddLiquidity = async () => {
    errorMessage = undefined;
    if (typeof window === 'undefined') return;
    if (!isLoggedIn()) {
      errorMessage = 'Please connect your wallet';
      return;
    }
    const micro = addAmountMicro;
    if (micro == null) {
      errorMessage = 'Enter a valid deposit amount';
      return;
    }
    if (appConfig.VITE_NETWORK !== 'devnet' && micro > totalBalanceUToken) {
      errorMessage = 'Amount exceeds your balance';
      return;
    }
    if (expectedTotalStakes <= 0) {
      errorMessage = 'Pool has no stake liquidity yet';
      return;
    }
    const tokenPerm = resolveTokenPermission();
    if (!tokenPerm) {
      errorMessage = 'Market token is not allowed in this session';
      return;
    }

    const tierBalance = await getTierBalance(
      appConfig.VITE_BIGMARKET_API,
      ADD_LIQUIDITY_TIER,
      getStxAddress(),
    );

    const response = await stacks.createMarketsClient(daoConfig).addLiquidity(
      getStxAddress(),
      market,
      micro,
      expectedTotalStakes,
      maxDeviationBipsAdd,
      tokenPerm,
      tierBalance,
    );
    await afterTx(response.success ? response.txid : undefined, response.success);
  };

  const doRemoveLiquidity = async () => {
    errorMessage = undefined;
    if (typeof window === 'undefined') return;
    if (!isLoggedIn()) {
      errorMessage = 'Please connect your wallet';
      return;
    }
    const amt = removeStakeUnits;
    if (amt == null) {
      errorMessage = 'Enter a valid removal size';
      return;
    }
    if (totalPoolStakes <= 0) {
      errorMessage = 'Pool has no liquidity';
      return;
    }
    if (amt >= totalPoolStakes) {
      errorMessage = 'Removal must be less than total pool stakes';
      return;
    }
    const tokenPerm = resolveTokenPermission();
    if (!tokenPerm) {
      errorMessage = 'Market token is not allowed in this session';
      return;
    }

    const tierBalance =
      REMOVE_LIQUIDITY_TIER > -1
        ? await getTierBalance(
            appConfig.VITE_BIGMARKET_API,
            REMOVE_LIQUIDITY_TIER,
            getStxAddress(),
          )
        : 0;

    const response = await stacks.createMarketsClient(daoConfig).removeLiquidity(
      getStxAddress(),
      market,
      amt,
      minRefundRemove,
      tokenPerm,
      tierBalance,
    );
    await afterTx(response.success ? response.txid : undefined, response.success);
  };

  const doClaimLpFees = async () => {
    errorMessage = undefined;
    if (typeof window === 'undefined') return;
    if (!isLoggedIn()) {
      errorMessage = 'Please connect your wallet';
      return;
    }
    const tokenPerm = resolveTokenPermission();
    if (!tokenPerm) {
      errorMessage = 'Market token is not allowed in this session';
      return;
    }
    if (lpSharesRaw <= 0) {
      errorMessage = 'No LP position to claim against';
      return;
    }

    const response = await stacks.createMarketsClient(daoConfig).claimLpFees(market, tokenPerm, accumulatedFees);
    await afterTx(response.success ? response.txid : undefined, response.success);
  };

  const handleConnect = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  onMount(() => {
    connected = isLoggedIn();
    refreshBalances();
  });
</script>

<Panel>
  <div class="mb-4 flex flex-col gap-1">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Liquidity</h3>
    <p class="text-xs text-gray-500 dark:text-gray-400">
      Add or remove proportional pool liquidity (AMM markets). Claim LP fees exits your LP position and pays accrued fees.
    </p>
  </div>

  {#if !connected}
    <div class="my-3 flex flex-col items-center gap-4 text-center">
      <p class="text-gray-500 dark:text-gray-400">Connect a wallet to manage liquidity.</p>
      <ConnectButton label={'CONNECT WALLET'} onConnectWallet={handleConnect} />
    </div>
  {:else}
    <div class="mb-4 grid grid-cols-1 gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs dark:border-gray-700 dark:bg-gray-900/40">
      <div class="flex justify-between gap-2">
        <span class="text-gray-500 dark:text-gray-400">{sip10Data.symbol} balance</span>
        <span class="font-medium text-gray-900 dark:text-white">
          {fmtMicroToStx(totalBalanceUToken, sip10Data.decimals)}
        </span>
      </div>
      <div class="flex justify-between gap-2">
        <span class="text-gray-500 dark:text-gray-400">Your LP shares</span>
        <span class="font-medium text-gray-900 dark:text-white">{lpSharesRaw}</span>
      </div>
      <div class="flex justify-between gap-2">
        <span class="text-gray-500 dark:text-gray-400">Pool accumulated LP fees</span>
        <span class="font-medium text-gray-900 dark:text-white">
          {fmtMicroToStx(accumulatedFees, sip10Data.decimals)}
        </span>
      </div>
    </div>

    <div
      class="mb-4 flex rounded-xl border border-gray-200 bg-gray-100 p-1 dark:border-gray-600 dark:bg-gray-800"
      role="tablist"
      aria-label="Liquidity actions"
    >
      <button
        type="button"
        role="tab"
        aria-selected={liquiditySection === 'add'}
        class="flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 {liquiditySection === 'add'
          ? 'bg-white text-emerald-700 shadow-sm dark:bg-gray-700 dark:text-emerald-300'
          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}"
        onclick={() => {
          liquiditySection = 'add';
          errorMessage = undefined;
        }}
      >
        Add
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={liquiditySection === 'remove'}
        class="flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 {liquiditySection === 'remove'
          ? 'bg-white text-emerald-700 shadow-sm dark:bg-gray-700 dark:text-emerald-300'
          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}"
        onclick={() => {
          liquiditySection = 'remove';
          errorMessage = undefined;
        }}
      >
        Remove
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={liquiditySection === 'claim'}
        class="flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 {liquiditySection === 'claim'
          ? 'bg-white text-emerald-700 shadow-sm dark:bg-gray-700 dark:text-emerald-300'
          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}"
        onclick={() => {
          liquiditySection = 'claim';
          errorMessage = undefined;
        }}
      >
        Claim fees
      </button>
    </div>

    {#if errorMessage}
      <Banner bannerType="danger" message={errorMessage} clazz="mb-3" />
    {/if}

    {#if liquiditySection === 'add'}
      <div class="space-y-3">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200" for="lp-add-amount">
          Deposit ({sip10Data.symbol})
        </label>
        <input
          id="lp-add-amount"
          class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          inputmode="decimal"
          placeholder="0.00"
          bind:value={addAmountHuman}
        />
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Expected pool stakes (anti-sandwich): <strong>{expectedTotalStakes}</strong>. Max deviation:
          {(slipAdd * 100).toFixed(2)}% ({maxDeviationBipsAdd} bips)
        </p>
        <SlippageSlider slippage={slipAdd} setSlippage={(s) => (slipAdd = s)} />
        <button
          type="button"
          class="inline-flex w-full items-center justify-center rounded-md border-0 bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          onclick={doAddLiquidity}
        >
          Add liquidity
        </button>
      </div>
    {:else if liquiditySection === 'remove'}
      <div class="space-y-3">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200" for="lp-remove-amt">
          Withdraw (pool stake units)
        </label>
        <input
          id="lp-remove-amt"
          class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          inputmode="numeric"
          placeholder="0"
          bind:value={removeAmountHuman}
        />
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Total pool stakes: <strong>{totalPoolStakes}</strong>. Your request must stay below that. Est. refund ~
          {fmtMicroToStx(estimatedRefundRemove, sip10Data.decimals)} {sip10Data.symbol}; min refund {minRefundRemove} µ
        </p>
        <div class="w-full">
          <label class="mb-2 flex items-center justify-between" for="lp-remove-slip">
            <span class="text-sm font-medium text-gray-800 dark:text-gray-100">Refund slippage</span>
            <span class="text-sm text-gray-600 dark:text-gray-300">{(slipRemove * 100).toFixed(2)}%</span>
          </label>
          <input
            id="lp-remove-slip"
            class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 accent-orange-600 dark:bg-zinc-700 dark:accent-orange-500"
            type="range"
            min="0.001"
            max="0.05"
            step="0.001"
            bind:value={slipRemove}
          />
        </div>
        <button
          type="button"
          class="inline-flex w-full items-center justify-center rounded-md border-0 bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          onclick={doRemoveLiquidity}
        >
          Remove liquidity
        </button>
      </div>
    {:else}
      <Banner
        bannerType="warning"
        message="Claiming pays your share of accumulated LP fees and <strong>removes your entire LP position</strong> for this market. Only use when you intend to exit."
        clazz="pb-5 mb-3"
      />
      <button
        type="button"
        class="mt-5 inline-flex w-full items-center justify-center rounded-md border-0 bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-900"
        onclick={doClaimLpFees}
        disabled={lpSharesRaw <= 0}
      >
        Claim LP fees &amp; exit position
      </button>
    {/if}
  {/if}
</Panel>
