export type UserSettings = {
  executiveTeamMember: boolean;
};

export type ReputationLeaderboardItem = {
  recipient: string;
  reputationScore: number;
};

export type UserReputation = {
  name: string;
  userSettings: UserSettings;
  userReputationData?: UserReputationContractData;
};
export type ReputationContractData = {
  overallSupply: number;
  tokenName: string;
  tokenSymbol: string;
  rewardPerEpoch: number;
  currentEpoch: number;
  weightedSupply: number;
  totalSupplies?: Array<number>;
  tierMetaData: Record<BigRepTier, { label: string; weight: number }>;
};

export type UserReputationContractData = {
  balances: Array<number>;
  overallBalance: number;
  weightedReputation: number;
  lastClaimedEpoch: number;
};
export enum BigRepTier {
  Newcomer = 1,
  CommunityMember,
  ForumParticipant,
  ContributorI,
  ContributorII,
  ContributorIII,
  ProposalAuthor,
  Facilitator,
  Campaigner,
  ProjectLeader,
  //   ProjectLeadII,
  //   CoreMaintainer,
  //   EcosystemAdvisorI,
  //   EcosystemAdvisorII,
  //   StrategicPartner,
  //   StewardI,
  //   StewardII,
  //   MultiRoleContributor,
  //   Founder,
  //   ExecutiveLead,
}

export const BigRepTierMetadata: Record<
  BigRepTier,
  { label: string; weight: number }
> = {
  [BigRepTier.Newcomer]: { label: "Newcomer", weight: 1 },
  [BigRepTier.CommunityMember]: { label: "Community member", weight: 1 },
  [BigRepTier.ForumParticipant]: { label: "Forum participant", weight: 1 },

  [BigRepTier.ContributorI]: { label: "Contributor I", weight: 2 },
  [BigRepTier.ContributorII]: { label: "Contributor II", weight: 2 },
  [BigRepTier.ContributorIII]: { label: "Contributor III", weight: 2 },

  [BigRepTier.ProposalAuthor]: { label: "Proposal author", weight: 3 },
  [BigRepTier.Facilitator]: { label: "Facilitator", weight: 3 },
  [BigRepTier.Campaigner]: { label: "Campaigner", weight: 3 },

  [BigRepTier.ProjectLeader]: { label: "Project Lead", weight: 5 },
  //   [BigRepTier.ProjectLeadII]: { label: "Project Lead II", weight: 5 },
  //   [BigRepTier.CoreMaintainer]: { label: "Core Maintainer", weight: 5 },

  //   [BigRepTier.EcosystemAdvisorI]: { label: "Ecosystem Advisor I", weight: 8 },
  //   [BigRepTier.EcosystemAdvisorII]: { label: "Ecosystem Advisor II", weight: 8 },
  //   [BigRepTier.StrategicPartner]: { label: "Strategic Partner", weight: 8 },

  //   [BigRepTier.StewardI]: { label: "Steward I", weight: 13 },
  //   [BigRepTier.StewardII]: { label: "Steward II", weight: 13 },
  //   [BigRepTier.MultiRoleContributor]: { label: "Multi-role Contributor", weight: 13 },

  //   [BigRepTier.Founder]: { label: "Founder", weight: 21 },
  //   [BigRepTier.ExecutiveLead]: { label: "Executive DAO Lead", weight: 21 },
};
