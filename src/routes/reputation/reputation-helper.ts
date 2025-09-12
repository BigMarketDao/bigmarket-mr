import { fetchCurrentEpoch, getPoxInfo, getStacksNetwork, UserReputationContractData } from '@mijoco/stx_helpers/dist/index.js';
import { getDaoConfig } from '../../lib/config_dao.js';
import { daoEventCollection } from '../../lib/data/db_models.js';
import { broadcastTransaction, listCV, makeContractCall, standardPrincipalCV } from '@stacks/transactions';
import { getConfig } from '../../lib/config.js';
import cron from 'node-cron';

export const runBatchClaimSweepJob = cron.schedule('30 0 * * 0', async (fireDate) => {
	console.log('Running: runBatchClaimSweep at: ' + fireDate);
	try {
		await runBatchClaimSweep();
	} catch (err: any) {
		console.log('runBatchClaimSweep: ', err);
	}
});

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

export async function runBatchClaimSweep() {
	let currentEpoch = -1;
	try {
		currentEpoch = (await getPoxInfo(getConfig().stacksApi))?.current_burnchain_block_height || -1;
		console.log('runBatchClaimSweep: currentEpoch=' + currentEpoch);
		if (currentEpoch < 0) currentEpoch = await fetchCurrentEpoch(getConfig().stacksApi, getDaoConfig().VITE_DOA, getDaoConfig().VITE_DAO_REPUTATION_TOKEN);
		else currentEpoch = currentEpoch / 4000;
	} catch (err: any) {
		console.log('runBatchClaimSweep: ', err);
		return;
	}

	const { VITE_DOA_DEPLOYER, VITE_DAO_REPUTATION_TOKEN } = getDaoConfig();
	const extension = `${VITE_DOA_DEPLOYER}.${VITE_DAO_REPUTATION_TOKEN}`;

	// Step 1: Find users who ever received BIGR
	const usersCursor = daoEventCollection.aggregate([{ $match: { event: 'sft_mint', extension, recipient: { $type: 'string' } } }, { $group: { _id: '$recipient' } }, { $project: { _id: 0, recipient: '$_id' } }]);

	const uniqueUsers: string[] = [];
	for await (const doc of usersCursor) uniqueUsers.push(doc.recipient);

	// Step 2: Get most recent big-claim per user
	const claimCursor = daoEventCollection.aggregate([
		{ $match: { event: 'big-claim', extension } },
		{ $sort: { epoch: -1 } },
		{
			$group: {
				_id: '$user',
				lastClaimedEpoch: { $first: '$epoch' }
			}
		}
	]);
	const claimMap = new Map<string, number>();
	for await (const doc of claimCursor) {
		claimMap.set(doc._id, doc.lastClaimedEpoch);
	}
	console.log('eligibleUsers: claimMap: ', claimMap);

	// Step 3: Compare and filter eligible users
	const eligibleUsers = uniqueUsers.filter((user) => {
		const last = claimMap.get(user) ?? 0;
		return last < currentEpoch;
	});

	if (eligibleUsers.length === 0) {
		console.log('No eligible users this epoch.');
		return;
	}

	// Step 4: Call batch claim contract method
	if (eligibleUsers.length) {
		return await makeBatchClaimTx(eligibleUsers);
	}
}

async function makeBatchClaimTx(eligibleUsers: Array<string>) {
	//getConfig().stacksApi, getDaoConfig().VITE_DOA, getDaoConfig().VITE_DAO_REPUTATION_TOKEN;
	const network = getStacksNetwork(getConfig().network);
	console.log('eligibleUsers: ', eligibleUsers);
	const principalList = listCV(eligibleUsers.map((user) => standardPrincipalCV(user)));

	const transaction = await makeContractCall({
		network,
		contractAddress: getDaoConfig().VITE_DOA,
		contractName: getDaoConfig().VITE_DAO_REPUTATION_TOKEN,
		functionName: 'claim-big-reward-batch',
		functionArgs: [principalList],
		senderKey: getConfig().walletKey
	});
	const txResult = await broadcastTransaction({ transaction });
	console.log('resolveScalarMarketOnChain: txResult: ', txResult);
	return txResult;
}
