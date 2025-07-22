import { UserReputationContractData } from '@mijoco/stx_helpers';
import { getDaoConfig } from '../../lib/config_dao.js';
import { daoEventCollection } from '../../lib/data/db_models.js';

export async function getUserReputationContractData(address: string): Promise<UserReputationContractData> {
	const { VITE_DOA_DEPLOYER, VITE_DAO_REPUTATION_TOKEN } = getDaoConfig();
	const extension = `${VITE_DOA_DEPLOYER}.${VITE_DAO_REPUTATION_TOKEN}`;

	// Fetch reputation mint history
	const rows = await daoEventCollection.aggregate([{ $match: { event: 'sft_mint', extension, recipient: address } }, { $group: { _id: '$tokenId', total: { $sum: '$amount' } } }, { $project: { tokenId: '$_id', amount: '$total', _id: 0 } }]).toArray();

	const balances: number[] = Array(10).fill(0);
	let overallBalance = 0;
	let weightedReputation = 0;

	for (let i = 1; i <= 10; i++) {
		const row = rows.find((t) => t.tokenId === i);
		const amount = row?.amount || 0;
		balances[i - 1] = amount;
		overallBalance += amount;
		weightedReputation += amount * (WEIGHTS[i] || 0);
	}

	// Fetch last claimed epoch
	const claimEvent = await daoEventCollection.find({ event: 'big-claim', extension, user: address }).sort({ epoch: -1 }).limit(1).toArray();

	const lastClaimedEpoch = claimEvent.length > 0 ? claimEvent[0].epoch : null;

	return { balances, overallBalance, weightedReputation, lastClaimedEpoch };
}

export async function getTotalSupplies(): Promise<Array<number>> {
	const extension = `${getDaoConfig().VITE_DOA_DEPLOYER}.${getDaoConfig().VITE_DAO_REPUTATION_TOKEN}`;
	const result = await daoEventCollection
		.aggregate([
			{
				$match: {
					event: 'sft_mint',
					extension: extension
				}
			},
			{
				$group: {
					_id: '$tokenId',
					totalSupply: { $sum: '$amount' }
				}
			},
			{
				$project: {
					tokenId: '$_id',
					totalSupply: 1,
					_id: 0
				}
			},
			{ $sort: { tokenId: 1 } }
		])
		.toArray();

	const ts = result as unknown as Array<any>;
	console.log('getTotalSupplies', ts);
	const balances: number[] = Array(10).fill(0);
	for (let i = 1; i < 11; i++) {
		const index = ts.findIndex((t) => t.tokenId === i);
		if (index > -1) balances[i - 1] = ts[index].totalSupply;
	}
	return balances;
}

export async function getTotalWeightedSupply(): Promise<number> {
	const extension = `${getDaoConfig().VITE_DOA_DEPLOYER}.${getDaoConfig().VITE_DAO_REPUTATION_TOKEN}`;
	const result = await daoEventCollection
		.aggregate([
			{
				$match: {
					event: 'sft_mint',
					extension
				}
			},
			{
				$addFields: {
					weight: {
						$switch: {
							branches: [
								{ case: { $in: ['$tokenId', [1, 2, 3]] }, then: 1 },
								{ case: { $in: ['$tokenId', [4, 5, 6]] }, then: 2 },
								{ case: { $in: ['$tokenId', [7, 8, 9]] }, then: 3 },
								{ case: { $eq: ['$tokenId', 10] }, then: 5 }
							],
							default: 0
						}
					}
				}
			},
			{
				$project: {
					weightedAmount: { $multiply: ['$amount', '$weight'] }
				}
			},
			{
				$group: {
					_id: null,
					weightedSupply: { $sum: '$weightedAmount' }
				}
			},
			{
				$project: {
					_id: 0,
					weightedSupply: 1
				}
			}
		])
		.toArray();

	return result[0]?.weightedSupply || 0;
}

export async function getReputationLeaderBoard(): Promise<Array<any>> {
	const result = await daoEventCollection
		.aggregate([
			{
				$match: {
					event: 'sft_mint'
				}
			},
			{
				$addFields: {
					weight: {
						$switch: {
							branches: [
								{ case: { $in: ['$tokenId', [1, 2, 3]] }, then: 1 },
								{ case: { $in: ['$tokenId', [4, 5, 6]] }, then: 2 },
								{ case: { $in: ['$tokenId', [7, 8, 9]] }, then: 3 },
								{ case: { $eq: ['$tokenId', 10] }, then: 5 }
							],
							default: 0
						}
					}
				}
			},
			{
				$project: {
					recipient: 1,
					weightedAmount: { $multiply: ['$amount', '$weight'] }
				}
			},
			{
				$group: {
					_id: '$recipient',
					reputationScore: { $sum: '$weightedAmount' }
				}
			},
			{
				$sort: { reputationScore: -1 }
			}
		])
		.toArray();

	return result as unknown as Array<any>;
}

const WEIGHTS: Record<number, number> = {
	1: 1,
	2: 1,
	3: 1,
	4: 2,
	5: 2,
	6: 2,
	7: 3,
	8: 3,
	9: 3,
	10: 5
};

// function fromMongoToUserReputation(rows: { tokenId: number; amount: number }[]): UserReputationContractData {
// 	const balances: number[] = Array(10).fill(0);
// 	let overallBalance = 0;
// 	let weightedReputation = 0;

// 	for (const { tokenId, amount } of rows) {
// 		balances[tokenId] = amount; // tokenId is the index
// 		overallBalance += amount;
// 		weightedReputation += amount * (WEIGHTS[tokenId] || 0);
// 	}

// 	// Fill in missing indices with 0s
// 	const maxTokenId = Math.max(0, ...rows.map((r) => r.tokenId));
// 	for (let i = 0; i <= maxTokenId; i++) {
// 		if (balances[i] === undefined) balances[i] = 0;
// 	}

// 	return { balances, overallBalance, weightedReputation };
// }
