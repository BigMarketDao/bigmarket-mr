import type { ReputationContractData } from "./reputationTypes";
import type { TokenSale, TokenSalePurchase } from "./tokenSaleTypes";

export type DaoOverview = {
  contractData: PredictionContractData;
  reputationData?: ReputationContractData;
  scalarBalances: ContractBalances;
  contractBalances: ContractBalances;
  treasuryBalances: ContractBalances;
  tokenSale?: TokenSale;
  tokenSalePurchases?: Array<TokenSalePurchase>;
};
export type PredictionContractData = {
  marketCounter: number;
  disputeWindowLength: number;
  marketVotingDuration: number;
  resolutionAgent: string;
  devFeeBips: number;
  daoFeeBips: number;
  marketFeeBipsMax: number;
  marketInitialLiquidity: number;
  devFund: string;
  daoTreasury: string;
  executiveSignalsRequired: number;
  coreTeamSunsetHeight: number;
  tokenName: string;
  tokenSymbol: string;
  tokenUri: string;
  tokenDecimals: number;
  customMajority: number;
  creationGated: boolean;
};
export type ContractBalances = {
  fungible_tokens: any;
  non_fungible_tokens: any;
  stx: ContractStxBalance;
};
export type ContractStxBalance = {
  balance: string;
  burnchain_lock_height: number;
  burnchain_unlock_height: number;
  estimated_balance: string;
  lock_height: number;
  lock_tx_id: string;
  locked: string;
  total_fees_sent: string;
  total_miner_rewards_received: string;
  total_received: string;
  total_sent: string;
};
export type ResultsSummary = {
  uniqueDaoVoters: number;
  uniquePoolVoters: number;
  uniqueSoloVoters: number;
  summary: Array<ResultAggregate>;
  summaryWithZeros: Array<ResultAggregate>;
  proposalData: ProposalData;
};
export type ResultAggregate = {
  _id: {
    event: string;
    for: boolean;
  };
  total: number;
  totalNested: number;
  count: number;
};
export type ProposalData = {
  concluded: boolean;
  passed: boolean;
  proposer: string;
  customMajority: number;
  endBlockHeight: number;
  startBlockHeight: number;
  votesAgainst: number;
  votesFor: number;
  burnStartHeight: number;
  burnEndHeight: number;
};
