export type TokenSaleStage = {
  price: number;
  maxSupply: number;
  tokensSold: number;
  cancelled: boolean;
};
export type TokenSale = {
  stages: Array<TokenSaleStage>;
  currentStageStart: number;
  currentStage: number;
};
export type TokenSalePurchase = {
  amount: number;
};
