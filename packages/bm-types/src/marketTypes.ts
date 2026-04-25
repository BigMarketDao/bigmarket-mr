import type { Sip10Data } from "./eventTypes";

export type MarketCategory = {
  name: string;
  information: string;
  displayName: string;
  active: boolean;
};
export type UserStake = {
  stakes: Array<number>;
};
export type Payout = {
  fiat: string;
  cryptoMicro: number;
  crypto: string;
  btc: string;
};
export type UserShareCosts = {
  userCostMicro: number;
  costs: Array<SharesPerCost>;
  sip10Data: Sip10Data;
  slippage: number;
};
export type SharesPerCost = {
  index: number;
  fee: number;
  costLessFee: number;
  shares: number;
};
export type ShareCost = {
  outcome: number;
  cost: number;
  maxPurchase: number;
};
export type PurchaseInfo = {
  index: number;
  totalCost: number;
  feeBips: number;
  slippage: number;
};
export type PurchaseInfoResponse = {
  willFail: boolean;
  reason?: string;
  idealShares: number;
  minShares: number;
  maxSpendIncludingFee: number;
  minSharesAtMaxSpend: number;
  idealSharesAtMaxSpend: number;
};
