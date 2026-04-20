import { PredictionMarketClaimEvent, PredictionMarketStakeEvent } from '@mijoco/stx_helpers/dist/index.js';
import { daoEventCollection } from '../../../lib/data/db_models.js';

export async function getMyStakedMarkets(voter: string): Promise<Array<PredictionMarketStakeEvent>> {
	const result = await daoEventCollection.find({ event: 'market-stake', voter }).toArray();
	return result as unknown as Array<PredictionMarketStakeEvent>;
}
export async function getMyClaimedMarkets(claimer: string): Promise<Array<PredictionMarketClaimEvent>> {
	const result = await daoEventCollection.find({ event: 'claim-winnings', claimer }).toArray();
	return result as unknown as Array<PredictionMarketClaimEvent>;
}
export async function getMyClaimedMarket(marketId: number, extension: string, claimer: string): Promise<PredictionMarketClaimEvent> {
	const result = await daoEventCollection.findOne({ event: 'claim-winnings', claimer, marketId, extension });
	return result as unknown as PredictionMarketClaimEvent;
}
export async function getMyStakesAndClaims1(voter: string): Promise<Array<any>> {
	const result = await daoEventCollection
		.aggregate([
			{
				$match: {
					event: { $in: ['market-stake', 'claim-winnings', 'create-market'] },
					$or: [
						{ voter: voter }, // for market-stake
						{ claimer: voter }, // for claim-winnings
						{} // create-market — no address filter
					]
				}
			},
			{
				$facet: {
					stakes: [{ $match: { event: 'market-stake', voter: voter } }, { $project: { marketId: 1, extension: 1, amount: 1, voter: 1, txId: 1 } }],
					claims: [{ $match: { event: 'claim-winnings', claimer: voter } }, { $project: { marketId: 1, extension: 1, userStake: 1, userShare: 1, txId: 1 } }],
					markets: [{ $match: { event: 'create-market' } }, { $project: { marketId: 1, extension: 1, unhashedData: 1, marketData: 1, txId: 1 } }]
				}
			},
			{
				$project: {
					combined: {
						$map: {
							input: '$stakes',
							as: 'stake',
							in: {
								$let: {
									vars: {
										claim: {
											$arrayElemAt: [
												{
													$filter: {
														input: '$claims',
														as: 'claim',
														cond: {
															$and: [{ $eq: ['$$claim.marketId', '$$stake.marketId'] }, { $eq: ['$$claim.extension', '$$stake.extension'] }]
														}
													}
												},
												0
											]
										},
										market: {
											$arrayElemAt: [
												{
													$filter: {
														input: '$markets',
														as: 'market',
														cond: {
															$and: [{ $eq: ['$$market.marketId', '$$stake.marketId'] }, { $eq: ['$$market.extension', '$$stake.extension'] }]
														}
													}
												},
												0
											]
										}
									},
									in: {
										marketId: '$$stake.marketId',
										extension: '$$stake.extension',
										stakedAmount: '$$stake.amount',
										stakeTxId: '$$stake.txId',
										claimed: { $cond: [{ $ifNull: ['$$claim', false] }, true, false] },
										claimData: '$$claim',
										marketData: '$$market.unhashedData',
										marketState: '$$market.marketData'
									}
								}
							}
						}
					}
				}
			},
			{ $unwind: '$combined' },
			{ $replaceRoot: { newRoot: '$combined' } }
		])
		.sort({ _id: -1 })
		.toArray();

	return result as unknown as Array<any>;
}
export async function getMyStakesAndClaims(voter: string): Promise<Array<any>> {
	const result = await daoEventCollection
		.aggregate([
			// Stage 1: Filter only relevant events
			{
				$match: {
					$or: [{ event: 'market-stake', voter: voter }, { event: 'claim-winnings', claimer: voter }, { event: 'create-market' }]
				}
			},

			// Stage 2: Group by event type into buckets
			{
				$facet: {
					stakes: [
						{ $match: { event: 'market-stake', voter: voter } },
						{
							$group: {
								_id: { marketId: '$marketId', extension: '$extension' },
								totalAmount: { $sum: '$amount' },
								stakeIds: { $push: '$_id' },
								stakeAmounts: { $push: '$amount' },
								voter: { $push: '$voter' }
							}
						}
					],
					claims: [
						{ $match: { event: 'claim-winnings', claimer: voter } },
						{
							$group: {
								_id: { marketId: '$marketId', extension: '$extension' },
								claim: { $first: '$$ROOT' }
							}
						}
					],
					markets: [
						{ $match: { event: 'create-market' } },
						{
							$group: {
								_id: { marketId: '$marketId', extension: '$extension' },
								market: { $first: '$$ROOT' }
							}
						}
					]
				}
			},

			// Stage 3: Merge stakes + claims + markets
			{
				$project: {
					merged: {
						$map: {
							input: '$stakes',
							as: 's',
							in: {
								$let: {
									vars: {
										claim: {
											$arrayElemAt: [
												{
													$filter: {
														input: '$claims',
														as: 'c',
														cond: {
															$and: [{ $eq: ['$$c._id.marketId', '$$s._id.marketId'] }, { $eq: ['$$c._id.extension', '$$s._id.extension'] }]
														}
													}
												},
												0
											]
										},
										market: {
											$arrayElemAt: [
												{
													$filter: {
														input: '$markets',
														as: 'm',
														cond: {
															$and: [{ $eq: ['$$m._id.marketId', '$$s._id.marketId'] }, { $eq: ['$$m._id.extension', '$$s._id.extension'] }]
														}
													}
												},
												0
											]
										}
									},
									in: {
										_id: '$$s._id',
										marketId: '$$s._id.marketId',
										marketType: '$$market.market.marketType',
										extension: '$$s._id.extension',
										voter: '$$s.voter',
										stakeTotal: '$$s.totalAmount',
										stakeIds: '$$s.stakeIds',
										stakeAmounts: '$$s.stakeAmounts',
										claimed: { $cond: [{ $ifNull: ['$$claim', false] }, true, false] },
										claim: '$$claim.claim',
										marketMeta: '$$market.market.unhashedData',
										marketData: '$$market.market.marketData'
									}
								}
							}
						}
					}
				}
			},

			{ $unwind: '$merged' },
			{ $replaceRoot: { newRoot: '$merged' } },

			// Optional: Final projection
			{
				$project: {
					marketId: 1,
					marketType: 1,
					extension: 1,
					voter: 1,
					stakeTotal: 1,
					stakeIds: 1,
					stakeAmounts: 1,
					claimed: 1,
					claim: 1,
					'marketMeta.name': 1,
					'marketMeta.description': 1,
					'marketMeta.category': 1,
					'marketData.concluded': 1,
					'marketData.outcome': 1,
					'marketData.token': 1,
					'marketData.resolutionState': 1,
					'marketData.priceFeedId': 1,
					'marketData.categories': 1,
					'marketData.marketFeeBips': 1,
					'marketData.stakes': 1,
					'marketData.stakeTokens': 1
				}
			},
			{ $sort: { _id: -1 } }
		])

		.toArray();

	return result as unknown as Array<any>;
}
