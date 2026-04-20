export interface BasicEvent {
  _id?: string;
  event: string;
  event_index: number;
  txId: string;
  daoContract: string;
  extension: string;
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
}
