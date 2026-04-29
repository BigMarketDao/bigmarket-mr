import type { PredictionMarketStakeEvent } from "@bigmarket/bm-types";

/** `/pm/stakes/:id/:type` returns `{ stakes, unstakes }`; charts expect `stakes[]` only */
export function normalizeStakeEventsPayload(
  res: unknown,
): Array<PredictionMarketStakeEvent> {
  if (!res) return [];
  if (Array.isArray(res)) return res as PredictionMarketStakeEvent[];
  if (
    typeof res === "object" &&
    res !== null &&
    "stakes" in res &&
    Array.isArray((res as { stakes: unknown }).stakes)
  ) {
    return sortStakeEventsByTime(
      (res as { stakes: PredictionMarketStakeEvent[] }).stakes,
    );
  }
  return [];
}

function sortStakeEventsByTime(
  events: PredictionMarketStakeEvent[],
): PredictionMarketStakeEvent[] {
  return [...events].sort((a, b) => {
    const ai =
      (a as PredictionMarketStakeEvent & { event_index?: number }).event_index ??
      0;
    const bi =
      (b as PredictionMarketStakeEvent & { event_index?: number }).event_index ??
      0;
    if (ai !== bi) return ai - bi;
    return String(a.txId ?? "").localeCompare(String(b.txId ?? ""));
  });
}
