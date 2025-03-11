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
