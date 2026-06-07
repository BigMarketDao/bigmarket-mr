/**
 * UI-facing market participation: native wallet vs vault BMP1 relay.
 */

import type {
  DaoConfig,
  PredictionMarketCreateEvent,
  TokenPermissionEvent,
  TxResult,
  VaultUserChain,
} from "@bigmarket/bm-types";
import { createMarketsClient } from "./markets.js";
import {
  vaultBuySharesEvm,
  vaultBuySharesStacks,
  vaultSellSharesEvm,
  vaultSellSharesStacks,
  vaultClaimWinningsEvm,
  vaultClaimWinningsStacks,
} from "../../protocol/vaultMarket.js";

export type MarketStakePath = "native-wallet" | "vault";

export type MarketParticipationContext = {
  daoConfig: DaoConfig;
  apiBaseUrl: string;
  stacksApi: string;
  market: PredictionMarketCreateEvent;
  token: TokenPermissionEvent;
  mappedAddress: string;
  /** Vault ledger balance for this controller + mapped + market token (micro). */
  vaultBalanceMicro: bigint;
  /** Native SIP-010 / STX balance on connected wallet (micro). */
  walletBalanceMicro: bigint;
  userChain: VaultUserChain;
  /** EVM 0x… or Stacks STX address — vault controller identity. */
  sourceAddress: string;
  ethAddress?: string;
};

function usdcxTokenPrincipal(daoConfig: DaoConfig): string {
  return `${daoConfig.VITE_USDCX_CONTRACT_ADDRESS}.${daoConfig.VITE_USDCX_CONTRACT_NAME}`;
}

/** Strict rule: USDCx markets always use vault BMP1 relay; other tokens use native wallet tx. */
export function resolveMarketStakePath(
  ctx: Pick<MarketParticipationContext, "market" | "daoConfig">,
  _costMicro?: bigint,
): MarketStakePath {
  const token = ctx.market.marketData.token;
  return token === usdcxTokenPrincipal(ctx.daoConfig) ? "vault" : "native-wallet";
}

export type BuyMarketSharesParams = MarketParticipationContext & {
  index: number;
  maxCostMicro: number;
  minShares: number;
  tierBalance?: number;
  senderStxAddress: string;
  path?: MarketStakePath;
};

export async function buyMarketShares(
  params: BuyMarketSharesParams,
): Promise<TxResult> {
  const path = params.path ?? resolveMarketStakePath(params);
  const tokenContract = params.market.marketData.token;

  if (path === "vault") {
    const base = {
      daoConfig: params.daoConfig,
      apiBaseUrl: params.apiBaseUrl,
      stacksApi: params.stacksApi,
      mappedAddress: params.mappedAddress,
      market: params.market,
      tokenContract,
      userChain: params.userChain,
      sourceAddress: params.sourceAddress,
      outcomeIndex: params.index,
      maxCostMicro: BigInt(params.maxCostMicro),
      minShares: BigInt(params.minShares),
    };
    if (params.userChain === "evm" && params.ethAddress) {
      return vaultBuySharesEvm({ ...base, ethAddress: params.ethAddress });
    }
    return vaultBuySharesStacks(base);
  }

  const client = createMarketsClient(params.daoConfig);
  return client.buyShares(
    params.senderStxAddress,
    params.market,
    params.token,
    params.index,
    params.maxCostMicro,
    params.minShares,
    params.tierBalance,
  );
}

export type SellMarketSharesParams = MarketParticipationContext & {
  index: number;
  sharesIn: number;
  minRefundMicro: number;
  senderStxAddress: string;
  path?: MarketStakePath;
};

export async function sellMarketShares(
  params: SellMarketSharesParams,
): Promise<TxResult> {
  const path = params.path ?? resolveMarketStakePath(params);
  const tokenContract = params.market.marketData.token;

  if (path === "vault") {
    const base = {
      daoConfig: params.daoConfig,
      apiBaseUrl: params.apiBaseUrl,
      stacksApi: params.stacksApi,
      mappedAddress: params.mappedAddress,
      market: params.market,
      tokenContract,
      userChain: params.userChain,
      sourceAddress: params.sourceAddress,
      outcomeIndex: params.index,
      minRefundMicro: BigInt(params.minRefundMicro),
      sharesIn: BigInt(params.sharesIn),
    };
    if (params.userChain === "evm" && params.ethAddress) {
      return vaultSellSharesEvm({ ...base, ethAddress: params.ethAddress });
    }
    return vaultSellSharesStacks(base);
  }

  const client = createMarketsClient(params.daoConfig);
  return client.sellShares(
    params.senderStxAddress,
    params.market,
    params.token,
    params.index,
    params.sharesIn,
    params.minRefundMicro,
  );
}

export type ClaimMarketWinningsParams = MarketParticipationContext & {
  senderStxAddress: string;
  path?: MarketStakePath;
};

export async function claimMarketWinnings(
  params: ClaimMarketWinningsParams,
): Promise<TxResult> {
  const path = params.path ?? resolveMarketStakePath(params);
  const tokenContract = params.market.marketData.token;

  if (path === "vault") {
    const base = {
      daoConfig: params.daoConfig,
      apiBaseUrl: params.apiBaseUrl,
      stacksApi: params.stacksApi,
      mappedAddress: params.mappedAddress,
      market: params.market,
      tokenContract,
      userChain: params.userChain,
      sourceAddress: params.sourceAddress,
    };
    if (params.userChain === "evm" && params.ethAddress) {
      return vaultClaimWinningsEvm({ ...base, ethAddress: params.ethAddress });
    }
    return vaultClaimWinningsStacks(base);
  }

  const [addr, name] = params.market.extension.split(".");
  const client = createMarketsClient(params.daoConfig);
  return client.claimWinnings(
    params.senderStxAddress,
    addr,
    name,
    params.market.marketId,
    tokenContract,
  );
}

