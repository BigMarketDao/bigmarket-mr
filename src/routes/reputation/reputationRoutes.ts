import express from 'express';

const router = express.Router();

export enum BigRepTier {
	Newcomer = 1,
	CommunityMember,
	ForumParticipant,
	ContributorI,
	ContributorII,
	ContributorIII,
	ProposalAuthor,
	Facilitator,
	Voter,
	ProjectLeadI,
	ProjectLeadII,
	CoreMaintainer,
	EcosystemAdvisorI,
	EcosystemAdvisorII,
	StrategicPartner,
	StewardI,
	StewardII,
	MultiRoleContributor,
	Founder,
	ExecutiveLead
}
export const BigRepTierMetadata: Record<BigRepTier, { label: string; weight: number }> = {
	[BigRepTier.Newcomer]: { label: 'Newcomer', weight: 1 },
	[BigRepTier.CommunityMember]: { label: 'Community member', weight: 1 },
	[BigRepTier.ForumParticipant]: { label: 'Forum participant', weight: 1 },

	[BigRepTier.ContributorI]: { label: 'Contributor I', weight: 2 },
	[BigRepTier.ContributorII]: { label: 'Contributor II', weight: 2 },
	[BigRepTier.ContributorIII]: { label: 'Contributor III', weight: 2 },

	[BigRepTier.ProposalAuthor]: { label: 'Proposal author', weight: 3 },
	[BigRepTier.Facilitator]: { label: 'Facilitator', weight: 3 },
	[BigRepTier.Voter]: { label: 'Voter / DAO role', weight: 3 },

	[BigRepTier.ProjectLeadI]: { label: 'Project Lead I', weight: 5 },
	[BigRepTier.ProjectLeadII]: { label: 'Project Lead II', weight: 5 },
	[BigRepTier.CoreMaintainer]: { label: 'Core Maintainer', weight: 5 },

	[BigRepTier.EcosystemAdvisorI]: { label: 'Ecosystem Advisor I', weight: 8 },
	[BigRepTier.EcosystemAdvisorII]: { label: 'Ecosystem Advisor II', weight: 8 },
	[BigRepTier.StrategicPartner]: { label: 'Strategic Partner', weight: 8 },

	[BigRepTier.StewardI]: { label: 'Steward I', weight: 13 },
	[BigRepTier.StewardII]: { label: 'Steward II', weight: 13 },
	[BigRepTier.MultiRoleContributor]: { label: 'Multi-role Contributor', weight: 13 },

	[BigRepTier.Founder]: { label: 'Founder', weight: 21 },
	[BigRepTier.ExecutiveLead]: { label: 'Executive DAO Lead', weight: 21 }
};

router.get('/meta-data', async (req, res) => {
	res.json(BigRepTierMetadata);
});

export { router as reputationRoutes };
