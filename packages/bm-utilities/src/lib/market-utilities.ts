import type { Currency, MarketData, UserStake } from "@bigmarket/bm-types";
import { formatUnits } from "viem";

export const STXUSD =
  "0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17";
export const BTCUSD =
  "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";
export const SOLUSD =
  "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
export const ETHUSD =
  "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";
export const SUIUSD =
  "0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744";
export const TONUSD =
  "0x8963217838ab4cf5cadc172203c1f0b763fbaa45f346d8ee50ba994bbcac3026";

const DECIMALS_BY_FEED: Record<string, number> = {
  [BTCUSD]: 16,
  // If you *really* need per-feed scaling:
  [STXUSD]: 16,
  [SOLUSD]: 16,
  [SUIUSD]: 16,
  [ETHUSD]: 16,
  [TONUSD]: 16,
};

const currencyToLocale: Record<string, string> = {
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  JPY: "ja-JP",
  AUD: "en-AU",
  CAD: "en-CA",
  CHF: "de-CH",
  CNY: "zh-CN",
  INR: "en-IN",
  // add more as needed
};

export function formatFiat(
  selectedCurrency: Currency,
  raw: number,
  bare?: boolean,
): string {
  const value = raw;
  const c = selectedCurrency;
  const locale = currencyToLocale[c.code] || "en-US";
  if (bare) {
    return value.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else {
    return value.toLocaleString(locale, {
      style: "currency",
      currency: c.code,
      currencyDisplay: "code", // shows "USD 1,234.56"
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}

function fmtFiatFromRaw(
  selectedCurrency: Currency,
  raw: bigint,
  decimals: number,
) {
  const s = formatUnits(raw, decimals); // exact string
  const n = Number(s); // ok for display
  return formatFiat(selectedCurrency, n);
}

export function totalPoolSum(stakes?: number[]): number {
  if (!Array.isArray(stakes) || stakes.length === 0) return 0;
  return stakes.reduce((sum, value) => sum + value, 0);
}
export function userStakeSum(userStake: UserStake | undefined) {
  try {
    return userStake && userStake.stakes
      ? userStake?.stakes.reduce(
          (accumulator, currentValue) => accumulator + currentValue,
          0,
        )
      : 0;
  } catch (err: any) {
    return 0;
  }
}
export function getCategoryLabel(
  selectedCurrency: Currency,
  index: number,
  marketData: MarketData,
) {
  const categories = marketData.categories;

  const item = categories[index];
  if (typeof item === "string") {
    if (categories.length === 2) {
      return item.toUpperCase() === "AGAINST" ? "NO" : "YES";
    }
    return item;
  }

  const decimals = DECIMALS_BY_FEED[marketData.priceFeedId!] ?? 16;

  const min = BigInt(item.min);
  const max = BigInt(item.max);

  const minS = fmtFiatFromRaw(selectedCurrency, min, decimals);
  const maxS = fmtFiatFromRaw(selectedCurrency, max, decimals);

  if (index === 0) {
    return `x < ${maxS}`;
  } else if (index === categories.length - 1) {
    return `x ≥ ${minS}`;
  } else {
    return `${minS} ≤ x < ${maxS}`;
  }
}
