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

export async function getMarketVotesComplete(): Promise<any> {
	const result = await daoEventCollection
		.aggregate([
			// 1️⃣ Start from dispute-resolution events
			{ $match: { event: 'dispute-resolution' } },

			// 2️⃣ Lookup market-vote events
			{
				$lookup: {
					from: 'daoEventCollection',
					let: { mktId: '$marketId' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [{ $eq: ['$event', 'market-vote'] }, { $eq: ['$marketId', '$$mktId'] }]
								}
							}
						},
						{
							$project: {
								_id: 1,
								event: 1,
								event_index: 1,
								txId: 1,
								daoContract: 1,
								extension: 1,
								marketId: 1,
								voter: 1,
								categoryFor: 1,
								sip18: 1,
								amount: 1,
								prevMarketId: 1
							}
						}
					],
					as: 'marketVotes'
				}
			},

			// 3️⃣ Lookup resolve-market-vote event
			{
				$lookup: {
					from: 'daoEventCollection',
					let: { mktId: '$marketId' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [{ $eq: ['$event', 'resolve-market-vote'] }, { $eq: ['$marketId', '$$mktId'] }]
								}
							}
						},
						{
							$project: {
								_id: 1,
								event: 1,
								event_index: 1,
								txId: 1,
								daoContract: 1,
								extension: 1,
								marketId: 1,
								resolver: 1,
								outcome: 1,
								resolutionState: 1
							}
						}
					],
					as: 'resolveVote'
				}
			},

			// 4️⃣ Flatten resolveVote (optional single)
			{
				$addFields: {
					resolveVote: { $arrayElemAt: ['$resolveVote', 0] }
				}
			},

			// 5️⃣ Final output (include base event fields)
			{
				$project: {
					_id: 1,
					event: 1,
					event_index: 1,
					txId: 1,
					daoContract: 1,
					extension: 1,
					marketId: 1,
					marketType: 1,
					disputer: 1,
					resolutionState: 1,
					marketVotes: 1,
					resolveVote: 1
				}
			}
		])
		.toArray();
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
