import type { PredictionMarketCreateEvent } from "@bigmarket/bm-types";

export async function resolveMarket(
  bmApiUrl: string,
  marketId: number,
  marketType: number,
): Promise<Array<PredictionMarketCreateEvent> | []> {
  const path = `${bmApiUrl}/agent/resolve/${marketId}/${marketType}`;
  const response = await fetch(path);
  if (response.status === 404) return [];
  const res = await response.json();
  return res;
}
export async function resolveMarketsUndisputed(
  bmApiUrl: string,
): Promise<Array<PredictionMarketCreateEvent> | []> {
  const path = `${bmApiUrl}/agent/resolve-markets-undisputed`;
  const response = await fetch(path);
  if (response.status === 404) return [];
  const res = await response.json();
  return res;
}
export async function resolveMarketsScalar(
  bmApiUrl: string,
): Promise<Array<PredictionMarketCreateEvent> | []> {
  const path = `${bmApiUrl}/agent/resolve-markets/scalar`;
  const response = await fetch(path);
  if (response.status === 404) return [];
  const res = await response.json();
  return res;
}
export async function resolveMarketsCategorical(
  bmApiUrl: string,
): Promise<Array<PredictionMarketCreateEvent> | []> {
  const path = `${bmApiUrl}/agent/resolve-markets/categorical`;
  const response = await fetch(path);
  if (response.status === 404) return [];
  const res = await response.json();
  return res;
}
