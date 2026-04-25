import type { MarketData } from "@bigmarket/bm-types";

type PayoutResult = {
  netRefund: number;
  marketFee: number;
};

export function calculateExpectedPayout(
  marketData: MarketData,
  userSharesList: Array<number>,
  index: number,
): PayoutResult | null {
  if (!userSharesList || userSharesList.length <= index)
    return {
      netRefund: 0,
      marketFee: 0,
    };

  const tokenPool = marketData.stakeTokens.reduce(
    (acc, v) => acc + Number(v),
    0,
  );
  const userShares = userSharesList[index];
  const winningPool = marketData.stakes[index];
  if (winningPool <= 0 || userShares <= 0)
    return {
      netRefund: 0,
      marketFee: 0,
    };

  const marketFeeBips = marketData.marketFeeBips;

  const grossRefund = (userShares * tokenPool) / winningPool;
  const marketFee = (grossRefund * marketFeeBips) / 10000;
  const netRefund = grossRefund - marketFee;

  if (netRefund > 0) {
    return {
      netRefund,
      marketFee: marketFeeBips,
    };
  } else {
    return {
      netRefund: 0,
      marketFee: marketFeeBips,
    };
  }
}
