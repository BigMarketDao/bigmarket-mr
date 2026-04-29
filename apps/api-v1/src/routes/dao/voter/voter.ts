import { callContractReadOnly, MarketVotingVoteEvent, PredictionMarketCreateEvent, ResolutionVote } from '@mijoco/stx_helpers/dist/index.js';
import { daoEventCollection } from '../../../lib/data/db_models.js';
import { getConfig } from '../../../lib/config.js';
import { fetchMarket, getContract } from '../../predictions/markets_helper.js';
import { getDaoConfig } from '../../../lib/config_dao.js';
import { principalCV, serializeCV, uintCV } from '@stacks/transactions';

export async function getVotesByProposalAndVoter(proposal: string, voter: string): Promise<any> {
	const result = await daoEventCollection.find({ proposal, voter, event: 'vote' }).toArray();
	return result;
}

export async function getVotesByVoter(voter: string): Promise<any> {
	console.log('getVotesByVoter: ' + voter);
	const result = await daoEventCollection.find({ voter, event: 'vote' }).toArray();
	return result;
}

export async function getMarketVoteComplete(marketId: number, marketType: number): Promise<any> {
	const market = (await fetchMarket(marketId, marketType)) as PredictionMarketCreateEvent;
	const contract = getContract(marketType);
	const resolutionVote = (await fetchResolutionVote(getConfig().stacksApi, contract, market.marketId, getDaoConfig().VITE_DOA_DEPLOYER, getDaoConfig().VITE_DAO_MARKET_VOTING, getConfig().stacksHiroKey)) as ResolutionVote;
	//const resolutionVote = (await fetchResolutionVote(getConfig().VITE_STACKS_API, contract, marketId, getDaoConfig().VITE_DOA_DEPLOYER, getDaoConfig().VITE_DAO_MARKET_VOTING)) as ResolutionVote;
	const marketVotes = (await getMarketVotesByMarket(market.extension, market.marketId)) as Array<MarketVotingVoteEvent>;
	return { market, resolutionVote, marketVotes };
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

export async function getMarketVotesByMarket(extension: string, marketId: number): Promise<Array<MarketVotingVoteEvent>> {
	const result = await daoEventCollection.find({ event: 'market-vote', extension, marketId }).toArray();
	return result as unknown as Array<MarketVotingVoteEvent>;
}

export async function getMarketVotesUser(voter: string): Promise<any> {
	const result = await daoEventCollection.find({ voter, event: 'market-vote' }).toArray();
	return result;
}

//(some (tuple (concluded false)
// (end-burn-height u98564)
// (num-categories u2)
// (proposer ST1GZKCXE2J2R9T2RKQQSR0C9AQTE2JV8FQE3EDW4)
// (votes (list u134000000 u55000000))
// (winning-category none)))
async function fetchResolutionVote(stacksApi: string, marketContract: string, marketId: number, contractAddress: string, contractName: string, stacksHiroKey?: string): Promise<ResolutionVote> {
	const data = {
		contractAddress,
		contractName,
		functionName: 'get-poll-data',
		functionArgs: [`0x${serializeCV(principalCV(marketContract))}`, `0x${serializeCV(uintCV(marketId))}`]
	};
	console.log('fetchResolutionVote: marketContract: ', marketContract);
	console.log('fetchResolutionVote: marketId: ', marketId);
	console.log('fetchResolutionVote: data: ', data);
	const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
	console.log('fetchResolutionVote: result: ', result);
	const votes = result.value?.value['votes'].value?.map((item: any) => Number(item.value)) || [];

	return {
		marketContract,
		marketId,
		proposer: result.value?.value?.proposer.value || undefined,
		endBurnHeight: Number(result.value?.value['end-burn-height'].value || 0),
		isGated: false,
		concluded: Boolean(result.value?.value?.concluded.value || false),
		votes,
		numCategories: Number(result.value?.value['num-categories']?.value || 0),
		winningCategory: result.value?.value['winning-category']?.value || ''
	};
}
