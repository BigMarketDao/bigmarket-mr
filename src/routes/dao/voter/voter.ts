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

			// 2️⃣ Lookup related market-vote events
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

			// 3️⃣ Lookup related resolve-market-vote event
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

			// 4️⃣ Lookup related create-market event (to get name, marketId, marketType)
			{
				$lookup: {
					from: 'daoEventCollection',
					let: { mktId: '$marketId', mktType: '$marketType' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [{ $eq: ['$event', 'create-market'] }, { $eq: ['$marketId', '$$mktId'] }, { $eq: ['$marketType', '$$mktType'] }]
								}
							}
						},
						{
							$project: {
								_id: 0,
								'unhashedData.name': 1
							}
						}
					],
					as: 'marketMeta'
				}
			},

			// 5️⃣ Flatten the joined fields
			{
				$addFields: {
					resolveVote: { $arrayElemAt: ['$resolveVote', 0] },
					marketName: { $arrayElemAt: ['$marketMeta.unhashedData.name', 0] }
				}
			},

			// 6️⃣ Final output projection
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
					marketName: 1, // <- new field
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
