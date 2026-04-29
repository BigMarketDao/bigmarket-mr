import type {
  Currency,
  MarketCategoricalOption,
  MarketData,
  ScalarMarketDataItem,
} from "@bigmarket/bm-types";
import { ORACLE_MULTIPLIER } from "./market-states.js";
import {
  DECIMALS_BY_FEED,
  fmtFiatFromRaw,
  formatFiat,
} from "./market-utilities.js";
import { fmtMicroToStx } from "./format.js";

export const MESSAGE_BOARD_ID = "90a5e66c-d42f-4307-a3fc-c871435ca244";

export function mapToMinMaxStringsFormatted(
  selectedCurrency: Currency,
  data: Array<string | ScalarMarketDataItem>,
): string[] {
  if (typeof data[0] === "string") {
    return data as string[]; // Directly return if already an array of strings
  }
  return (data as { min: number; max: number }[]).map(
    (item) =>
      `${formatFiat(selectedCurrency, item.min / ORACLE_MULTIPLIER, false)} -> ${formatFiat(selectedCurrency, item.max / ORACLE_MULTIPLIER, true)}`,
  );
}

export const MARKET_BINARY_OPTION: Array<MarketCategoricalOption> = [
  { label: "AGAINST", displayName: "against", icon: "👎" },
  { label: "FOR", displayName: "for", icon: "👍" },
];

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

  const exponent = DECIMALS_BY_FEED[marketData.priceFeedId!] ?? -8;
  // Example: BTC/USD often exponent = -8
  const decimals = Math.abs(exponent * 100);

  const min = BigInt(item.min);
  const max = BigInt(item.max);

  const minS = fmtFiatFromRaw(selectedCurrency, min, 2);
  const maxS = fmtFiatFromRaw(selectedCurrency, max, 2);

  if (index === 0) {
    return `x < ${maxS}`;
  } else if (index === categories.length - 1) {
    return `x ≥ ${minS}`;
  } else {
    return `${minS} ≤ x < ${maxS}`;
  }
}
export function mapToMinMaxStrings(
  data: Array<string | ScalarMarketDataItem>,
): string[] {
  if (typeof data[0] === "string") {
    return data as string[]; // Directly return if already an array of strings
  }
  return (data as { min: number; max: number }[]).map(
    (item) => `${fmtMicroToStx(item.min)},${fmtMicroToStx(item.max)}`,
  );
}
