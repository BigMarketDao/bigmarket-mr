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
