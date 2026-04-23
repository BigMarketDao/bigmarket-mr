import type {
  Currency,
  MarketData,
  ScalarMarketDataItem,
} from "@bigmarket/bm-types";
import { ORACLE_MULTIPLIER } from "./market-states";
import {
  DECIMALS_BY_FEED,
  fmtFiatFromRaw,
  formatFiat,
} from "./market-utilities";

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
