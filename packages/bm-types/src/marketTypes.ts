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
export type UserTokens = {
  tokens: Array<number>;
};
export type UserLPShares = {
  shares: number;
};
export type Payout = {
  fiat: string;
  cryptoMicro: number;
  crypto: string;
  btc: string;
};
export type UserShareCosts = {
  userCostMicro: number;
  costs: Array<MaxBuyable>;
  sip10Data: Sip10Data;
  slippage: number;
};
export type MaxBuyable = {
  index: number;
  fee: number;
  costLessFee: number;
  shares: number;
};
export type MaxSellable = {
  refund: number;
  grossRefund: number;
  fee: number;
  lpFee: number;
  multisigFee: number;
  sharesIn: number;
  maxSellable: number;
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
