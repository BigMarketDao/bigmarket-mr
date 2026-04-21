import type { ProposalData } from "./daoTypes";
import type { BasicEvent } from "./eventTypes";

export interface VotingEventVoteOnProposal extends BasicEvent {
  proposal: string;
  voter: string;
  for: boolean;
  amount: number;
}

export interface VotingEventConcludeProposal extends BasicEvent {
  proposal: string;
  passed: boolean;
  proposalMeta: ProposalMeta;
  contract: ProposalContract;
  proposalData: ProposalData;
}
export type HeaderItem = {
  name: string;
  href: string;
  display: string;
  target: string;
};
export type FundingData = {
  funding: number;
  parameters: {
    fundingCost: number;
    proposalDuration: number;
    proposalStartDelay: number;
  };
};

export interface VotingEventProposeProposal extends BasicEvent {
  submissionContract: string;
  txId: string;
  proposal: string;
  proposer: string;
  proposalMeta: ProposalMeta;
  contract: ProposalContract;
  proposalData: ProposalData;
  stackerData?: StackerProposalData;
  links?: Array<HeaderItem>;
  sip18: boolean;
}
export type ProposalContract = {
  source: string;
  publish_height: number;
};
export type ProposalMeta = {
  dao: string;
  title: string;
  author: string;
  synopsis: string;
  description: string;
};
export type StackerProposalData = {
  stacksAddressYes: string;
  stacksAddressNo: string;
  bitcoinAddressYes: string;
  bitcoinAddressNo: string;
  removed?: boolean;
  nodao: boolean;
  sip: boolean;
  reportedResults?: {
    soloFor: number;
    soloAgainst: number;
    poolFor: number;
    poolAgainst: number;
    soloAddresses: number;
    poolAddresses: number;
  };
  heights: {
    burnStart: number;
    burnEnd: number;
    stacksStart: number;
    stacksEnd: number;
  };
};
export type ResolutionVote = {
  marketContract: string;
  marketId: number;
  proposer: string;
  endBurnHeight: number;
  isGated: boolean;
  concluded: boolean;
  votes: Array<number>;
  numCategories: number;
  winningCategory?: number;
};
export interface MarketVotingVoteEvent extends BasicEvent {
  marketId: number;
  voter: string;
  categoryFor: number;
  sip18: boolean;
  amount: number;
  prevMarketId?: number;
}
export interface MarketDisputeRecord extends BasicEvent {
  marketId: number;
  marketType?: number;
  disputer: string;
  resolutionState: string; // e.g. "RESOLUTION_DISPUTED"
  txId: string;
  extension: string;
  daoContract: string;
  marketVotes: MarketVoteRecord[];
  resolveVote?: ResolveMarketVoteRecord;
  marketName: string;
}
export interface MarketVoteRecord extends BasicEvent {
  event: "market-vote";
  voter: string;
  categoryFor: number;
  sip18?: string;
  amount: number;
  prevMarketId?: number;
}

export interface ResolveMarketVoteRecord extends BasicEvent {
  event: "resolve-market-vote";
  resolver: string;
  outcome: number;
  resolutionState: string; // e.g. "RESOLUTION_RESOLVED"
}
