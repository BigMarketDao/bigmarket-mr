import type {
  ExchangeRate,
  Sip10Data,
  TokenBalances,
} from "@bigmarket/bm-types";
import { getRate } from "./blockTime.js";
import { fmtMicroToStxNumber } from "./format.js";

export function getTokenBalanceMicro(
  token: string,
  tokenBalances: TokenBalances,
): number {
  try {
    if (token.endsWith("wrapped-stx")) {
      return tokenBalances.stx.balance;
    }
    if (tokenBalances && tokenBalances.fungible_tokens) {
      const entries = Object.entries(tokenBalances.fungible_tokens);
      for (const ft of entries) {
        const contract = ft[0].split("::")[0];
        if (token === contract) {
          const vals = ft[1] as any;
          return vals.balance || 0;
        }
      }
    }
  } catch (err: any) {
    return 0;
  }
  return 0;
}
export function toFiat(
  exchangeRate: ExchangeRate,
  amountMicro: number,
  sip10Data: Sip10Data,
  tokenPrice?: number,
  fixed?: number,
): string {
  const amount = fmtMicroToStxNumber(amountMicro, sip10Data.decimals);
  if (sip10Data.symbol === "STX") {
    return (
      amount *
      (exchangeRate?.fifteen || 0) *
      (exchangeRate?.stxToBtc || 0)
    ).toFixed(fixed || 2);
  } else if (sip10Data.symbol === "BIG") {
    // assume BIG has 0 value!
    return (
      amount *
      (exchangeRate?.fifteen || 0) *
      0 *
      (tokenPrice || 1)
    ).toFixed(fixed || 2);
  } else if (sip10Data.symbol.toLowerCase() === "sbtc") {
    return (amount * (exchangeRate?.fifteen || 0)).toFixed(fixed || 2);
  } else {
    // assume all other tokens have 0 value!
    return (
      amount *
      (exchangeRate?.fifteen || 0) *
      0 *
      (tokenPrice || 1)
    ).toFixed(fixed || 2);
  }
}
