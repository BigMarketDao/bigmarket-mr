import type { ExchangeRate } from "@bigmarket/bm-types";
import { DateTime } from "luxon";

export function estimateBitcoinBlockTime(
  targetBlock: number,
  currentBlock: number,
  currentTimeUtc: string = DateTime.utc().toISO(),
): string {
  const BLOCK_INTERVAL_SEC = 600; // 10 minutes per block
  const blockDifference = targetBlock - (currentBlock || 0);
  const timeShiftSeconds = blockDifference * BLOCK_INTERVAL_SEC;
  const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
  //currentTime = DateTime.fromISO(currentTimeUtc, { zone: userTZ });
  //const estimatedTimeUtc = currentTime.plus({ seconds: timeShiftSeconds });
  const estimatedTime = DateTime.fromISO(currentTimeUtc, { zone: "utc" })
    .plus({ seconds: timeShiftSeconds })
    .setZone(userTZ);

  return estimatedTime.toFormat("dd MMM yy HH:mm ZZZ");
}
export function getRate(
  exchangeRates: ExchangeRate[],
  currencyCode: string,
): ExchangeRate {
  const rate = exchangeRates.find((o) => o.currency === currencyCode);
  if (!rate)
    return {
      symbol: "$",
      name: "US Dollar",
      currency: "USD",
    } as ExchangeRate;
  return rate;
}
