import { daoEventCollection } from '../../../lib/data/db_models.js';

export async function getVotesByProposalAndVoter(proposal: string, voter: string): Promise<any> {
	const result = await daoEventCollection.find({ proposal, voter, event: 'vote' }).toArray();
	return result;
}

export async function getVotesByVoter(voter: string): Promise<any> {
	console.log('getVotesByVoter: ' + voter);
	const result = await daoEventCollection.find({ voter, event: 'vote' }).toArray();
	return result;
}

export async function getMarketVotes(): Promise<any> {
	const result = await daoEventCollection.find({ event: 'dispute-resolution' }).toArray();
	return result;
}

export async function getMarketVotesByMarket(extension: string, marketId: number): Promise<any> {
	const result = await daoEventCollection.find({ event: 'market-vote', extension, marketId }).toArray();
	return result;
}

export async function getMarketVotesUser(voter: string): Promise<any> {
	const result = await daoEventCollection.find({ voter, event: 'market-vote' }).toArray();
	return result;
}
