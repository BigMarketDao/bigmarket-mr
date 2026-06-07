/**
 * Market stake execution: strict USDCx = vault signature + relay only;
 * other SIP-10 / STX = direct wallet transactions.
 */

import {
  isVaultControlledToken,
  resolveVaultUsdcxBalanceIdentity,
  vaultUserChainFromWallet,
} from "@bigmarket/bm-common";
import type {
  DaoConfig,
  PredictionMarketCreateEvent,
  TokenBalances,
  TokenPermissionEvent,
  TxResult,
  WalletState,
} from "@bigmarket/bm-types";
import {
  getTierBalance,
  getTokenBalanceMicro,
  STAKING_TIER,
  validatePurchaseAgainstMax,
} from "@bigmarket/bm-utilities";
import {
  buyMarketShares,
  claimMarketWinnings,
  sellMarketShares,
  stacks,
  type MarketStakePath,
} from "@bigmarket/sdk";

export const VAULT_TOP_UP_MESSAGE =
  "Insufficient vault balance. <a href='/vault' class='underline'>Deposit USDCx</a> to your vault to continue.";

/** App route where users deposit into the vault. */
export const VAULT_DEPOSIT_PATH = "/vault";

export type StakeExecutionConfig = {
  daoConfig: DaoConfig;
  apiBaseUrl: string;
  stacksApi: string;
  wallet: WalletState;
  market: PredictionMarketCreateEvent;
  token: TokenPermissionEvent;
  tokenBalances?: TokenBalances;
  /** From `userWalletStore` — USDCx vault ledger only. */
  vaultUsdcxBalanceMicro?: number;
};

export type StakeRunContext = {
  network: string;
  feeBips: number;
  slippage: number;
  userCostMicro: number;
  stxAddress: string;
};

export type StakeRunOutcome =
  | { ok: false; error: string; needsTopUp?: boolean }
  | { ok: true; result: TxResult };

/** Build config from app/dao/session wallet + optional SIP-010 balances. */
export function buildStakeExecutionConfig(input: {
  daoConfig: DaoConfig;
  apiBaseUrl: string;
  stacksApi: string;
  wallet: WalletState;
  market: PredictionMarketCreateEvent;
  token: TokenPermissionEvent;
  tokenBalances?: TokenBalances;
  vaultUsdcxBalanceMicro?: number;
}): StakeExecutionConfig {
  return { ...input };
}

export function isUsdcxStakeMarket(config: StakeExecutionConfig): boolean {
  return isVaultControlledToken(
    config.market.marketData.token,
    config.daoConfig,
  );
}

export function marketExtensionParts(
  market: PredictionMarketCreateEvent,
): [contractAddress: string, contractName: string] {
  const [contractAddress, contractName] = market.extension.split(".");
  return [contractAddress, contractName];
}

/** Strict path: USDCx → vault signature relay; everything else → native wallet tx. */
export function stakePathForMarket(
  config: StakeExecutionConfig,
): MarketStakePath {
  return isUsdcxStakeMarket(config) ? "vault" : "native-wallet";
}

function walletTokenBalanceMicro(
  tokenContract: string,
  tokenBalances?: TokenBalances,
): bigint {
  if (!tokenBalances) return 0n;
  return BigInt(getTokenBalanceMicro(tokenContract, tokenBalances));
}

function vaultBalanceMicroForMarket(config: StakeExecutionConfig): bigint {
  if (!isUsdcxStakeMarket(config)) return 0n;
  return BigInt(config.vaultUsdcxBalanceMicro ?? 0);
}

/** Spendable balance for UI and pre-trade checks (vault-only for USDCx). */
export function spendableBalanceMicro(
  config: StakeExecutionConfig | undefined,
): number {
  if (!config) return 0;
  if (isUsdcxStakeMarket(config)) {
    return Number(vaultBalanceMicroForMarket(config));
  }
  return Number(
    walletTokenBalanceMicro(
      config.market.marketData.token,
      config.tokenBalances,
    ),
  );
}

export function needsVaultTopUp(
  config: StakeExecutionConfig | undefined,
  costMicro: number,
): boolean {
  if (!config || !isUsdcxStakeMarket(config) || costMicro <= 0) return false;
  return BigInt(costMicro || 0) > vaultBalanceMicroForMarket(config);
}

function getStxFallback(config: StakeExecutionConfig): string {
  return (
    config.wallet.accounts.find((a) => a.type === "stx")?.address ??
    config.wallet.activeAccount?.address ??
    ""
  );
}

function participationBase(config: StakeExecutionConfig) {
  const vaultIdentity = resolveVaultUsdcxBalanceIdentity(config.wallet);
  const userChain = vaultUserChainFromWallet(config.wallet.chain);
  if (isUsdcxStakeMarket(config) && !vaultIdentity) {
    throw new Error(
      "USDCx markets require a Stacks or Ethereum wallet with mapped address",
    );
  }

  const mapped =
    vaultIdentity?.mappedAddress ??
    config.wallet.activeAccount?.mappedAddress ??
    getStxFallback(config);
  const source =
    vaultIdentity?.sourceAddress ?? config.wallet.activeAccount?.address ?? "";
  const chain = vaultIdentity?.userChain ?? userChain ?? "stacks";

  return {
    daoConfig: config.daoConfig,
    apiBaseUrl: config.apiBaseUrl,
    stacksApi: config.stacksApi,
    market: config.market,
    token: config.token,
    mappedAddress: mapped,
    vaultBalanceMicro: vaultBalanceMicroForMarket(config),
    walletBalanceMicro: walletTokenBalanceMicro(
      config.market.marketData.token,
      config.tokenBalances,
    ),
    userChain: chain,
    sourceAddress: source,
    ethAddress: config.wallet.chain === "ethereum" ? source : undefined,
    senderStxAddress: getStxFallback(config),
  };
}

function validateStakeAmount(userCostMicro: number): string | null {
  if (userCostMicro <= 0) return "Amount is required";
  return null;
}

function validateUsdcxBuyBalance(
  config: StakeExecutionConfig,
  ctx: StakeRunContext,
): StakeRunOutcome | null {
  if (!isUsdcxStakeMarket(config)) return null;
  if (ctx.network === "devnet") return null;
  if (BigInt(ctx.userCostMicro) <= vaultBalanceMicroForMarket(config))
    return null;
  return { ok: false, error: VAULT_TOP_UP_MESSAGE, needsTopUp: true };
}

type ExecuteBuyParams = {
  index: number;
  maxCostMicro: number;
  minShares: number;
  tierBalance?: number;
};

async function executeMarketBuy(
  config: StakeExecutionConfig,
  params: ExecuteBuyParams,
): Promise<TxResult> {
  return buyMarketShares({
    ...participationBase(config),
    index: params.index,
    maxCostMicro: params.maxCostMicro,
    minShares: params.minShares,
    tierBalance: params.tierBalance,
    path: stakePathForMarket(config),
  });
}

type ExecuteSellParams = {
  index: number;
  sharesIn: number;
  minRefundMicro: number;
};

async function executeMarketSell(
  config: StakeExecutionConfig,
  params: ExecuteSellParams,
): Promise<TxResult> {
  return sellMarketShares({
    ...participationBase(config),
    index: params.index,
    sharesIn: params.sharesIn,
    minRefundMicro: params.minRefundMicro,
    path: stakePathForMarket(config),
  });
}

export async function executeMarketClaim(
  config: StakeExecutionConfig,
): Promise<TxResult> {
  return claimMarketWinnings({
    ...participationBase(config),
    path: stakePathForMarket(config),
  });
}

export async function runMarketBuy(
  config: StakeExecutionConfig | undefined,
  index: number,
  ctx: StakeRunContext,
): Promise<StakeRunOutcome> {
  const amountError = validateStakeAmount(ctx.userCostMicro);
  if (amountError) return { ok: false, error: amountError };

  if (!config) {
    return { ok: false, error: "Market token is not configured" };
  }

  const topUp = validateUsdcxBuyBalance(config, ctx);
  if (topUp) return topUp;

  if (
    !isUsdcxStakeMarket(config) &&
    ctx.network !== "devnet" &&
    BigInt(ctx.userCostMicro) >
      walletTokenBalanceMicro(
        config.market.marketData.token,
        config.tokenBalances,
      )
  ) {
    return { ok: false, error: "Amount exceeds your balance" };
  }

  const purchaseInfo = validatePurchaseAgainstMax(
    {
      index,
      totalCost: ctx.userCostMicro,
      feeBips: ctx.feeBips,
      slippage: ctx.slippage,
    },
    config.market.marketData,
  );

  const tierBalance = await getTierBalance(
    config.apiBaseUrl,
    STAKING_TIER,
    ctx.stxAddress,
  );

  try {
    const result = await executeMarketBuy(config, {
      index,
      maxCostMicro: ctx.userCostMicro,
      minShares: purchaseInfo.minShares,
      tierBalance,
    });
    return { ok: true, result };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function runMarketSell(
  config: StakeExecutionConfig | undefined,
  index: number,
  ctx: StakeRunContext,
): Promise<StakeRunOutcome> {
  const amountError = validateStakeAmount(ctx.userCostMicro);
  if (amountError) return { ok: false, error: amountError };

  if (!config) {
    return { ok: false, error: "Market token is not configured" };
  }

  const [contractAddress, contractName] = marketExtensionParts(config.market);
  const markets = stacks.createMarketsClient(config.daoConfig);
  const maxSellable = await markets.fetchSellRefund(
    config.stacksApi,
    config.market.marketId,
    index,
    ctx.userCostMicro,
    contractAddress,
    contractName,
  );

  const minRefundMicro = Math.floor(maxSellable.refund * ctx.slippage);

  try {
    const result = await executeMarketSell(config, {
      index,
      sharesIn: maxSellable.sharesIn,
      minRefundMicro,
    });
    return { ok: true, result };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function runMarketClaim(
  config: StakeExecutionConfig | undefined,
  ctx: Pick<StakeRunContext, "stxAddress">,
): Promise<StakeRunOutcome> {
  if (!config) {
    return { ok: false, error: "Market token is not configured" };
  }

  try {
    const result = await executeMarketClaim(config);
    return { ok: true, result };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
