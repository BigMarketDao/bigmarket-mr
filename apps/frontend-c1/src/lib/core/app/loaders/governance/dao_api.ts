import { fmtStxMicro } from '@bigmarket/bm-utilities';
import { showTxModal } from '@bigmarket/bm-common';
import { getStxAddress } from '@bigmarket/bm-common';
import { watchTransaction } from '@bigmarket/bm-common';
import { get } from 'svelte/store';
import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';
import {
	daoConfigStore,
	requireDaoConfig,
	requireDaoGovernanceClient
} from '$lib/stores/config/daoConfigStore';
import {
	type Auth,
	type DaoOverview,
	type ProposalData,
	type VoteMessage,
	type VotingEventProposeProposal,
	type VotingEventVoteOnProposal
} from '@bigmarket/bm-types';
import { stacks } from '@bigmarket/sdk';

export const NAKAMOTO_VOTE_START_HEIGHT = 829750 + 100;
export const NAKAMOTO_VOTE_STOPS_HEIGHT = 833950;
export const daoVotingSupported = true;

export function dynamicSort<T>(property: keyof T | `-${string & keyof T}`) {
	let sortOrder = 1;

	if (typeof property === 'string' && property.startsWith('-')) {
		sortOrder = -1;
		property = property.substring(1) as keyof T;
	}

	return function (a: T, b: T) {
		const key = property as keyof T;

		const result = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;

		return result * sortOrder;
	};
}
export async function reclaimVotes(proposal: VotingEventProposeProposal, numbLocked: number) {
	const daoConfig = requireDaoConfig(get(daoConfigStore));
	const client = requireDaoGovernanceClient(get(daoConfigStore));
	const isDeployer = daoConfig.VITE_DAO_DEPLOYER === getStxAddress();
	const response = await client.reclaimVotes(
		proposal.extension,
		proposal.proposal,
		getStxAddress(),
		fmtStxMicro(numbLocked),
		[],
		isDeployer
	);
	if (response.success && response.txid) {
		showTxModal(response.txid);
		const appConfig = requireAppConfig(get(appConfigStore));
		watchTransaction(
			appConfig.VITE_BIGMARKET_API,
			appConfig.VITE_STACKS_API,
			`${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO}`,
			response.txid
		);
	} else {
		showTxModal('Unable to process right now');
	}
}

export async function reclaimMarketVotes(marketContract: string, marketId: number) {
	const client = requireDaoGovernanceClient(get(daoConfigStore));
	const response = await client.reclaimMarketVotes(marketContract, marketId);
	if (response.success && response.txid) {
		showTxModal(response.txid);
		const appConfig = requireAppConfig(get(appConfigStore));
		const daoConfig = requireDaoConfig(get(daoConfigStore));
		watchTransaction(
			appConfig.VITE_BIGMARKET_API,
			appConfig.VITE_STACKS_API,
			`${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO}`,
			response.txid
		);
	} else {
		showTxModal('Unable to process right now');
	}
}

export async function concludeVote(votingContract: string, proposalContract: string) {
	const client = requireDaoGovernanceClient(get(daoConfigStore));
	const response = await client.conclude(votingContract.split('.')[1], proposalContract);

	if (response.success && response.txid) {
		showTxModal(response.txid);
		const appConfig = requireAppConfig(get(appConfigStore));
		const daoConfig = requireDaoConfig(get(daoConfigStore));
		watchTransaction(
			appConfig.VITE_BIGMARKET_API,
			appConfig.VITE_STACKS_API,
			`${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO}`,
			response.txid
		);
	} else {
		showTxModal('Unable to process right now');
	}
}

export async function getDaoOverview(): Promise<DaoOverview> {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/pm/market-dao-data`;
	const response = await fetch(path);
	const res = await response.json();
	return res;
}

export async function findDaoVotes(proposalId: string) {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/dao/proposals/votes/${proposalId}`;
	const response = await fetch(path);
	const res = await response.json();
	return res || [];
}
export type VoteSummary = {
	stxFor: number;
	stxAgainst: number;
	accountsFor: number;
	accountsAgainst: number;
	inFavour: string;
	passed: boolean;
	customMajority: number;
};
export function summarizeVotes(
	votes: Array<VotingEventVoteOnProposal>,
	proposalData: ProposalData
): VoteSummary {
	const summary = votes.reduce(
		(acc, vote) => {
			if (vote.for) {
				acc.stxFor += vote.amount;
				acc.accountsFor.add(vote.voter);
			} else {
				acc.stxAgainst += vote.amount;
				acc.accountsAgainst.add(vote.voter);
			}
			return acc;
		},
		{
			stxFor: 0,
			stxAgainst: 0,
			accountsFor: new Set(),
			accountsAgainst: new Set()
		}
	);

	// Calculate percentage in favour
	const totalStx = summary.stxFor + summary.stxAgainst;
	const inFavour = totalStx === 0 ? 0 : (summary.stxFor / totalStx) * 100;

	// Return the final summary
	return {
		stxFor: proposalData.votesFor,
		stxAgainst: proposalData.votesAgainst,
		accountsFor: summary.accountsFor.size,
		accountsAgainst: summary.accountsAgainst.size,
		inFavour: inFavour.toFixed(4),
		passed: proposalData.passed,
		customMajority: proposalData.customMajority
	};
}

// export async function verifySignedStructuredData(
// 	vote: VoteMessage,
// 	hash: string,
// 	signature: string,
// 	votingContract: string
// ): Promise<{ result: boolean }> {
// 	const functionArgs = [
// 		`0x${serializeCV(voteMessageToTupleCV(vote))}`,
// 		`0x${serializeCV(bufferCV(hexToBytes(signature)))}`,
// 		`0x${serializeCV(principalCV(vote.voter))}`
// 	];

// 	const data = {
// 		contractAddress: votingContract.split('.')[0],
// 		contractName: votingContract.split('.')[1],
// 		functionName: 'verify-signed-tuple',
// 		functionArgs
// 	};
// 	let res: { value: boolean; type: string };
// 	try {
// 		res = await callContractReadOnly(appConfig.VITE_STACKS_API, data);
// 		return { result: res.value };
// 	} catch (e) {
// 		return { result: false };
// 	}
// }

export async function verifySignature(
	vote: VoteMessage,
	hash: string,
	signature: string,
	votingContract: string
): Promise<{ result: boolean }> {
	const appConfig = requireAppConfig(get(appConfigStore));
	const result = await stacks.verifySignature(
		appConfig.VITE_STACKS_API,
		vote,
		hash,
		signature,
		votingContract
	);
	return result;
}

export async function readBaseDaoEvents(daoContract: string, auth: Auth) {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/dao/events/extensions/${daoContract}`;
	const response = await fetch(path, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(auth)
	});
	if (response.status >= 400 && response.status < 500) return 'not allowed';
	else if (response.status >= 500) return 'error on server';
	const res = await response.json();
	return res;
}

export async function fetchExtensions(daoContract: string) {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/dao/events/extensions/${daoContract}`;
	const response = await fetch(path);
	const res = await response.json();
	return res;
}
export async function lookupContract(stacksApi: string, contract_id: string) {
	const path = `${stacksApi}/extended/v1/contract/${contract_id}`;
	const response = await fetch(path);
	const res = await response.json();
	return res;
}
