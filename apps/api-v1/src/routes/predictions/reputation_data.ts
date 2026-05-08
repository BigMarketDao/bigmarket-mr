import { stacks } from '@bigmarket/sdk';
import { BigRepTierMetadata, DaoConfig, ReputationByEpochContractData, ReputationByUserContractData, ReputationContractData } from '@bigmarket/bm-types';
import { getConfig } from '../../lib/config.js';

export async function readReputationContractData(daoConfig: DaoConfig, stacksApi: string, nftTokenId?: number, stacksHiroKey?: string): Promise<ReputationContractData> {
	return {
		tierWeight: await stacks.createReputationClient(daoConfig).fetchTierWeight(stacksApi, nftTokenId || 1, stacksHiroKey),
		tokenUri: '', //await stacks.createReputationClient(daoConfig).fetchTokenUri(stacksApi, nftTokenId || 1, stacksHiroKey),
		totalSupplyPerNft: await stacks.createReputationClient(daoConfig).fetchTotalSupplyPerNft(stacksApi, nftTokenId || 1, stacksHiroKey),
		launchHeight: await stacks.createReputationClient(daoConfig).fetchLaunchHeight(stacksApi, stacksHiroKey),
		rewardPerEpoch: await stacks.createReputationClient(daoConfig).fetchRewardPerEpoch(stacksApi, stacksHiroKey),
		epochDuration: await stacks.createReputationClient(daoConfig).fetchEpochDuration(stacksApi, stacksHiroKey),
		decimals: await stacks.createReputationClient(daoConfig).fetchTokenDecimals(stacksApi, stacksHiroKey),
		tokenName: await stacks.createReputationClient(daoConfig).fetchTokenName(stacksApi, stacksHiroKey),
		tokenSymbol: await stacks.createReputationClient(daoConfig).fetchTokenSymbol(stacksApi, stacksHiroKey),
		totalWeightedSupply: await stacks.createReputationClient(daoConfig).fetchTotalWeightedSupply(stacksApi, stacksHiroKey),
		currentEpoch: await stacks.createReputationClient(daoConfig).fetchEpoch(stacksApi, stacksHiroKey),
		weightedSupply: Number(await stacks.createReputationClient(daoConfig).fetchWeightedSupply(stacksApi)),
		overallSupply: await stacks.createReputationClient(daoConfig).fetchOverallSupply(stacksApi, stacksHiroKey),
		tierMetaData: BigRepTierMetadata
	};
}

export async function readReputationEpochContractData(daoConfig: DaoConfig, stacksApi: string, epoch: number, stacksHiroKey?: string): Promise<ReputationByEpochContractData> {
	return {
		mintedInEpoch: await stacks.createReputationClient(daoConfig).fetchMintedInEpoch(stacksApi, epoch, stacksHiroKey),
		burnedInEpoch: await stacks.createReputationClient(daoConfig).fetchBurnedInEpoch(stacksApi, epoch, stacksHiroKey),
		totalWeightedSupply: await stacks.createReputationClient(daoConfig).fetchTotalWeightedSupplyAt(stacksApi, epoch, stacksHiroKey)
	};
}

export async function readReputationContractUserData(daoConfig: DaoConfig, stacksApi: string, address: string, epoch: number, nftTokenId?: number, stacksHiroKey?: string): Promise<ReputationByUserContractData> {
	return {
		balanceAtTier: await stacks.createReputationClient(daoConfig).fetchBalanceAtTier(stacksApi, nftTokenId || 1, address, stacksHiroKey),
		overallBalance: await stacks.createReputationClient(daoConfig).fetchOverallBalance(stacksApi, address, stacksHiroKey),
		weightedReputation: await stacks.createReputationClient(daoConfig).fetchWeightedReputation(stacksApi, address, stacksHiroKey),
		mintedInEpoch: await stacks.createReputationClient(daoConfig).fetchMintedInEpochBy(stacksApi, epoch, address, stacksHiroKey),
		burnedInEpoch: await stacks.createReputationClient(daoConfig).fetchBurnedInEpochBy(stacksApi, epoch, address, stacksHiroKey),
		lastClaimedEpoch: await stacks.createReputationClient(daoConfig).fetchLastClaimedEpoch(stacksApi, address, stacksHiroKey)
	};
}
