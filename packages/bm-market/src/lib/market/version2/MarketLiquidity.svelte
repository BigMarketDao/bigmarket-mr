<script lang="ts">
  import { Banner } from '@bigmarket/bm-ui';
  import { CircleHelp, TriangleAlert } from 'lucide-svelte';
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
    fmtMicroToStxNumber,
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

  const PANEL_SHELL =
    'rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 text-[var(--color-card-foreground)]';

  const INPUT_CLASS =
    'w-full rounded-[var(--radius-sm)] border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 font-mono text-[var(--color-card-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]';

  const PRIMARY_BTN =
    'w-full rounded-[var(--radius-md)] bg-[var(--color-primary)] py-3 text-base font-semibold text-[var(--color-primary-foreground)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-50';

  const PRICE_TOLERANCE_TIP =
    'Prices can shift slightly while your transaction processes. 0.3% is the standard setting — leave it unless you know what you\'re doing.';

  function formatBalance2(micro: number): string {
    return fmtMicroToStxNumber(micro, sip10Data.decimals).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  onMount(() => {
    connected = isLoggedIn();
    refreshBalances();
  });
</script>

<section class={PANEL_SHELL} aria-label="Liquidity panel">
  <div class="mb-4 flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <h3 class="text-xl font-bold" style="font-family: var(--font-heading)">Add liquidity</h3>
      <span
        title="Liquidity providers fund the market so others can trade. In return, you earn a small cut of every trade made — no need to pick a side."
        aria-label="Liquidity providers fund the market so others can trade. In return, you earn a small cut of every trade made — no need to pick a side."
      >
        <CircleHelp class="h-4 w-4 text-[var(--color-muted-foreground)]" />
      </span>
    </div>
    <p class="text-sm text-[var(--color-muted-foreground)]">
      Fund this market and earn a share of every trade — regardless of who wins.
    </p>
  </div>

  {#if !connected}
    <div class="my-3 flex flex-col items-center gap-4 text-center">
      <p class="text-[var(--color-muted-foreground)]">Connect a wallet to manage liquidity.</p>
      <ConnectButton label={'CONNECT WALLET'} onConnectWallet={handleConnect} />
    </div>
  {:else}
    <div
      class="mb-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-secondary)] p-4"
    >
      <div class="flex items-center justify-between border-b border-[var(--color-border)] py-2">
        <span class="text-sm text-[var(--color-muted-foreground)]">Your {sip10Data.symbol} balance</span>
        <span class="font-mono text-sm tabular-nums text-[var(--color-card-foreground)]">
          {formatBalance2(totalBalanceUToken)}
        </span>
      </div>
      <div class="flex items-center justify-between border-b border-[var(--color-border)] py-2">
        <span class="flex items-center gap-1 text-sm text-[var(--color-muted-foreground)]">
          Your pool share
          <span
            title="How much of the total liquidity pool you own. Bigger share = bigger cut of trading fees."
            aria-label="How much of the total liquidity pool you own. Bigger share = bigger cut of trading fees."
          >
            <CircleHelp class="h-3.5 w-3.5" />
          </span>
        </span>
        <span class="font-mono text-sm tabular-nums text-[var(--color-card-foreground)]">{lpSharesRaw}</span>
      </div>
      <div class="flex items-center justify-between py-2">
        <span class="flex items-center gap-1 text-sm text-[var(--color-muted-foreground)]">
          Fees earned so far
          <span
            title="Every trade in this market earns you a tiny cut. Click 'Claim earnings' to withdraw it."
            aria-label="Every trade in this market earns you a tiny cut. Click Claim earnings to withdraw it."
          >
            <CircleHelp class="h-3.5 w-3.5" />
          </span>
        </span>
        <span class="font-mono text-sm tabular-nums text-[var(--color-card-foreground)]">
          {fmtMicroToStx(accumulatedFees, sip10Data.decimals)}
        </span>
      </div>
    </div>

    <div
      class="mb-4 flex gap-1 rounded-[var(--radius-md)] bg-[var(--color-secondary)] p-1"
      role="tablist"
      aria-label="Liquidity actions"
    >
      <button
        type="button"
        role="tab"
        aria-selected={liquiditySection === 'add'}
        class="flex-1 rounded-[var(--radius-sm)] px-4 py-2 text-center text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] {liquiditySection ===
        'add'
          ? 'bg-[var(--color-card)] font-medium text-[var(--color-card-foreground)] shadow-sm'
          : 'text-[var(--color-muted-foreground)]'}"
        onclick={() => {
          liquiditySection = 'add';
          errorMessage = undefined;
        }}
      >
        Add funds
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={liquiditySection === 'remove'}
        class="flex-1 rounded-[var(--radius-sm)] px-4 py-2 text-center text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] {liquiditySection ===
        'remove'
          ? 'bg-[var(--color-card)] font-medium text-[var(--color-card-foreground)] shadow-sm'
          : 'text-[var(--color-muted-foreground)]'}"
        onclick={() => {
          liquiditySection = 'remove';
          errorMessage = undefined;
        }}
      >
        Withdraw
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={liquiditySection === 'claim'}
        class="flex-1 rounded-[var(--radius-sm)] px-4 py-2 text-center text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] {liquiditySection ===
        'claim'
          ? 'bg-[var(--color-card)] font-medium text-[var(--color-card-foreground)] shadow-sm'
          : 'text-[var(--color-muted-foreground)]'}"
        onclick={() => {
          liquiditySection = 'claim';
          errorMessage = undefined;
        }}
      >
        Claim earnings
      </button>
    </div>

    {#if errorMessage}
      <Banner bannerType="danger" message={errorMessage} clazz="mb-3" />
    {/if}

    {#if liquiditySection === 'add'}
      <div class="space-y-3">
        <label class="block text-sm font-medium text-[var(--color-muted-foreground)]" for="lp-add-amount">
          Amount to add ({sip10Data.symbol})
        </label>
        <input
          id="lp-add-amount"
          class={INPUT_CLASS}
          inputmode="decimal"
          placeholder="Enter amount..."
          bind:value={addAmountHuman}
        />
        <div class="relative">
          <SlippageSlider
            slippage={slipAdd}
            setSlippage={(s) => (slipAdd = s)}
            label="Price tolerance"
            inputId="lp-add-slip"
          />
          <span
            title={PRICE_TOLERANCE_TIP}
            aria-label={PRICE_TOLERANCE_TIP}
            class="absolute top-0 right-0"
          >
            <CircleHelp class="h-4 w-4 text-[var(--color-muted-foreground)]" />
          </span>
        </div>
        <button type="button" class={PRIMARY_BTN} onclick={doAddLiquidity}>Add to pool</button>
      </div>
    {:else if liquiditySection === 'remove'}
      <div class="space-y-3">
        <label class="block text-sm font-medium text-[var(--color-muted-foreground)]" for="lp-remove-amt">
          How much to withdraw?
        </label>
        <input
          id="lp-remove-amt"
          class={INPUT_CLASS}
          inputmode="numeric"
          placeholder="Enter amount..."
          bind:value={removeAmountHuman}
        />
        <p class="text-xs text-[var(--color-muted-foreground)]">
          Maximum you can withdraw: {lpSharesRaw} pool shares
        </p>
        <div class="relative">
          <SlippageSlider
            slippage={slipRemove}
            setSlippage={(s) => (slipRemove = s)}
            label="Price tolerance"
            inputId="lp-remove-slip"
            min={0.001}
            max={0.05}
            step={0.001}
          />
          <span
            title={PRICE_TOLERANCE_TIP}
            aria-label={PRICE_TOLERANCE_TIP}
            class="absolute top-0 right-0"
          >
            <CircleHelp class="h-4 w-4 text-[var(--color-muted-foreground)]" />
          </span>
        </div>
        <button
          type="button"
          class="w-full rounded-[var(--radius-md)] bg-[var(--color-destructive)] py-3 text-base font-semibold text-[var(--color-destructive-foreground)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-50"
          onclick={doRemoveLiquidity}
        >
          Withdraw from pool
        </button>
      </div>
    {:else}
      <div
        class="mb-4 rounded-[var(--radius-md)] border border-[var(--color-warning-border)] bg-[var(--color-warning-soft)] p-4"
      >
        <div class="flex gap-3">
          <TriangleAlert class="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-warning)]" />
          <p class="text-sm text-[var(--color-card-foreground)]">
            <span class="font-semibold"
              >This will pay out your trading fees AND close your liquidity position.</span
            >
            Only do this when you're ready to fully exit this market.
          </p>
        </div>
      </div>
      <button
        type="button"
        class={PRIMARY_BTN}
        onclick={doClaimLpFees}
        disabled={lpSharesRaw <= 0}
      >
        Claim earnings &amp; exit
      </button>
    {/if}
  {/if}
</section>

