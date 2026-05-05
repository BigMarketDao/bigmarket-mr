export interface BasicEvent {
  _id?: string;
  event: string;
  event_index: number;
  txId: string;
  daoContract: string;
  extension: string;
}

export enum ResolutionState {
  RESOLUTION_OPEN = 0,
  RESOLUTION_RESOLVING = 1,
  RESOLUTION_DISPUTED = 2,
  RESOLUTION_RESOLVED = 3,
}

export interface DaoEventExecuteProposal extends BasicEvent {
  event: string;
  event_index: number;
  daoContract: string;
  txId: string;
  proposal: string;
}

export interface TokenPermissionEvent extends BasicEvent {
  marketType: number;
  allowed: boolean;
  token: string;
  sip10Data?: Sip10Data;
  minLiquidity?: number;
}
export type Sip10Data = {
  symbol: string;
  name: string;
  decimals: number;
  balance: number;
  totalSupply: number;
  tokenUri: string;
};
export interface PredictionMarketCreateEvent extends BasicEvent {
  marketId: number;
  marketType: number;
  unhashedData: StoredOpinionPoll;
  category?: string;
  resolver: string;
  disputer: string;
  daoFee: number;
  transferLosingStakes?: number;
  marketData: MarketData;
  priceOutcome?: number;
  stacksHeight?: number;
  seedAmount?: number;
}
export interface PredictionMarketAccounting {
  totalTokenPool: number;
  accumulatedLpFees: number;
  lpTotalShares: number;
  stakes: Array<number>;
  stakeTokens: Array<number>;
}
export type MarketData = {
  concluded: boolean;
  creator: string;
  token: string;
  treasury: string;
  outcome?: number;
  marketFeeBips: number;
  metadataHash: string;
  categories: Array<string | ScalarMarketDataItem>;
  stakes: Array<number>;
  stakeTokens: Array<number>;
  resolutionState: number;
  resolutionBurnHeight?: number;
  marketStart?: number;
  marketDuration?: number;
  coolDownPeriod?: number;
  priceFeedId?: string;
  priceOutcome?: string;
  startPrice?: number;
};

export interface StoredOpinionPoll extends OpinionPoll {
  _id?: string;
  objectHash: string;
  processed: boolean;
  signature: string;
  publicKey: string;
  merkelRoot?: string;
  outcomes?: Array<string | ScalarMarketDataItem>;
  contractIds?: Array<string>;
  featured: boolean;
  forumMessageId?: string;
}
export type OpinionPoll = {
  createdAt: number;
  priceFeedId?: string;
  marketType: number;
  marketFee: number;
  marketTypeDataCategorical?: Array<MarketCategoricalOption>;
  marketTypeDataScalar?: Array<ScalarMarketDataItem>;
  name: string;
  description: string;
  category: string;
  liquidity: number;
  criterionSources: CriterionSources;
  criterionDays: CriterionDays;
  logo: string;
  proposer: string;
  token: string;
  treasury: string;
  social: {
    twitter: {
      projectHandle?: string;
    };
    discord: {
      serverId?: string;
    };
    website: {
      url?: string;
    };
  };
};
export type ScalarMarketDataItem = {
  min: number;
  max: number;
};
export type CriterionSources = {
  criteria: string;
  sources: Array<string>;
};

export type CriterionDays = {
  duration: number;
  coolDown: number;
  startHeight: number;
  earliest_resolution_date?: string;
};
export type MarketCategoricalOption = {
  label: string;
  displayName?: string;
  icon?: string;
};
export type TopMarket = {
  market: PredictionMarketCreateEvent;
  totalStakes: number;
};
export type LeaderBoard = {
  latestPredicitons: Array<PredictionMarketStakeEvent>;
  topMarkets: Array<TopMarket>;
};
export interface PredictionMarketStakeEvent extends BasicEvent {
  marketId: number;
  marketType: number;
  amount: number;
  index: number;
  voter: string;
  fee: number;
  cost: number;
  lpFee: number;
  multisigFee: number;
  maxCost: number;
}
//event: "market-unstake"
export interface PredictionMarketUnStakeEvent extends BasicEvent {
  marketId: number;
  marketType: number;
  index: number;
  sharesIn: number;
  refund: number;
  fee: number;
  lpFee: number;
  multisigFee: number;
  seller: string;
  minRefund: number;
}
export interface PredictionMarketEventChain {
  market: PredictionMarketCreateEvent;
  claims: Array<PredictionMarketClaimEvent>;
  stakes: {
    userStakes: Array<PredictionMarketStakeEvent>;
    userUnstakes: Array<PredictionMarketUnStakeEvent>;
  };
  liquidity: {
    addLiquidityEvents: Array<PredictionMarketLPAddEvent>;
    removeLiquidityEvents: Array<PredictionMarketLPRemoveEvent>;
    claimLpFeeEvents: Array<PredictionMarketLPClaimEvent>;
  };
}
//event: "add-liquidity"
export interface PredictionMarketLPAddEvent extends BasicEvent {
  marketId: number;
  marketType: number;
  sender: string;
  requested: number;
  amount: number;
  lpSharesMinted: number;
  lpTotalShares: number;
}

//event: "remove-liquidity"
export interface PredictionMarketLPRemoveEvent extends BasicEvent {
  marketId: number;
  marketType: number;
  sender: string;
  lpRequested: number;
  lpActualRefund: number;
}

//event: "claim-lp-fees"
export interface PredictionMarketLPClaimEvent extends BasicEvent {
  marketId: number;
  marketType: number;
  sender: string;
  lpSharesBurned: number;
  feePaid: number;
}

export interface PredictionMarketClaimEvent extends BasicEvent {
  marketId: number;
  marketType: number;
  claimer: string;
  indexWon: number;
  userTokensInOutcome: number;
  userSharesInOutcome: number;
  winningPool: number;
  daoFee: number;
  marketFee: number;
  totalPool: ResolutionState;
  netRefund: number;
}
export interface ClaimWinnings {
  _id: string; // typically ObjectId as string
  event: "claim-winnings";
  event_index: number;
  txId: string;
  daoContract: string;
  extension: string;
  marketId: number;
  marketType: number;
  indexWon: number;
  claimer: string;
  userStake: number;
  userShare: number;
  marketFee: number;
  daoFee: number;
  winningPool: number;
  totalPool: number;
}

export interface UserMarketStake {
  marketId: number;
  marketType: number;
  extension: string;
  voter: string[]; // looks like an array of addresses
  stakeTotal: number;
  stakeIds: string[];
  stakeAmounts: number[];
  claimed: boolean;
  claim: ClaimWinnings;
  marketMeta: {
    name: string;
    description: string;
    category: string;
  };
  marketData: MarketData;
}

export interface UserMarketStakesResponse {
  stakes: UserMarketStake[];
}
export interface MarketTypeContainer {
  marketType: number;
  marketTypeDataCategorical: Array<MarketCategoricalOption>;
  priceFeedId?: string;
  priceFeedOptions: Array<{ label: string; value: string }>;
  marketTypeDataScalar: Array<ScalarMarketDataItem>;
}
export interface ReputationBigClaimEvent extends BasicEvent {
  batched: boolean;
  user: string;
  epoch: number;
  amount: number;
  claimEpoch: number;
  epochsPaid: number;
  reputation: number;
  total: number;
  share: number;
  rewardPerEpoch: number;
}
export interface ReputationSetTierEvent extends BasicEvent {
  weight: number;
  tokenId: number;
}
export interface ReputationSftBurnEvent extends BasicEvent {
  tokenId: number;
  sender: string;
  amount: number;
}
export interface ReputationSftMintEvent extends BasicEvent {
  tokenId: number;
  recipient: string;
  amount: number;
}
export interface LiquidityContributionEvent extends BasicEvent {
  bigr: number;
  from: string;
  amount: number;
}
export interface ReputationSftTransferEvent extends BasicEvent {
  tokenId: number;
  sender: string;
  recipient: string;
  amount: number;
}
export interface TokenSaleAdvanceStageEvent extends BasicEvent {
  newStage: number;
  burnStart: number;
}
export interface TokenSaleCancelStageEvent extends BasicEvent {
  stage: number;
}
export interface TokenSaleRefundEvent extends BasicEvent {
  buyer: string;
  refunded: number;
  stage: number;
}
export interface TokenSalePurchaseEvent extends BasicEvent {
  buyer: string;
  stage: number;
  tokens: number;
  stxAmount?: number;
}
export interface ScalarContractHedgeEvent extends BasicEvent {
  marketContract: string;
}
export interface MarketContractHedgeEvent extends BasicEvent {
  marketContract: string;
}
export interface MultipliersHedgeEvent extends BasicEvent {
  multipliers: Array<number>;
}
export interface PerformCustomHedgeEvent extends BasicEvent {
  marketId: number;
  predictedIndex: number;
}
export interface PerformSwapHedgeEvent extends BasicEvent {
  marketId: number;
  predictedIndex: number;
  feedId: string;
}
export interface SwapTokenPairHedgeEvent extends BasicEvent {
  marketId: number;
  predictedIndex: number;
  feedId: string;
  tokenIn: string;
  tokenOut: string;
  token0: string;
  token1: string;
}
