import { callContractReadOnly, fetchContractBalances, fetchMarketData, getSip10Properties, readPredictionContractData } from '@mijoco/stx_helpers/dist/index.js';
import type {
	StoredOpinionPoll,
	TokenPermissionEvent,
	MarketCategory,
	DaoOverview,
	BasicEvent,
	MarketData,
	MarketVotingVoteEvent,
	PredictionMarketClaimEvent,
	PredictionMarketCreateEvent,
	PredictionMarketStakeEvent,
	PredictionMarketUnStakeEvent,
	PredictionMarketLPAddEvent,
	PredictionMarketLPRemoveEvent,
	PredictionMarketLPClaimEvent,
	ReputationContractData,
	ReputationByEpochContractData,
	ReputationByUserContractData
} from '@bigmarket/bm-types';
import { daoEventCollection, marketCategoriesCollection, marketCollection } from '../../lib/data/db_models.js';
import { findUserEnteredPollByHash } from '../polling/polling_helper.js';
import { getConfig } from '../../lib/config.js';
import { ObjectId } from 'mongodb';
import { getDaoConfig } from '../../lib/config_dao.js';
import { saveDaoEvent } from '../dao/events/dao_events_extension_helper.js';
import { principalCV, serializeCV } from '@stacks/transactions';
import { readReputationContractData, readReputationContractUserData, readReputationEpochContractData } from './reputation_data.js';
import { stacks } from '@bigmarket/sdk';

export let cachedData: DaoOverview | null = null; // simpple cache refreshed via cron

export async function updateDaoOverview(address?: string) {
	try {
		// Fetch contract data
		const contractData = await readPredictionContractData(getConfig().stacksApi, getDaoConfig().VITE_DAO_DEPLOYER, getDaoConfig().VITE_DAO_MARKET_PREDICTING, getConfig().stacksHiroKey);
		contractData.marketInitialLiquidity = 100000000;

		const t1 = await stacks.createReputationClient(getDaoConfig()).fetchTokenDecimals(getConfig().stacksApi, getConfig().stacksHiroKey);
		console.log('updateDaoOverview: reputationData: ', t1);
		const t2 = await stacks.createReputationClient(getDaoConfig()).fetchMintedInEpoch(getConfig().stacksApi, 0, getConfig().stacksHiroKey);
		console.log('updateDaoOverview: reputationData: ', t2);
		const t21 = await stacks.createReputationClient(getDaoConfig()).fetchBurnedInEpoch(getConfig().stacksApi, 0, getConfig().stacksHiroKey);
		console.log('updateDaoOverview: reputationData: ', t21);
		const t3 = await stacks.createReputationClient(getDaoConfig()).fetchTotalWeightedSupply(getConfig().stacksApi, getConfig().stacksHiroKey);
		console.log('updateDaoOverview: reputationData: ', t3);

		const reputationData: ReputationContractData = await readReputationContractData(getDaoConfig(), getConfig().stacksApi, 1, getConfig().stacksHiroKey);
		const reputationEpochData: ReputationByEpochContractData = await readReputationEpochContractData(getDaoConfig(), getConfig().stacksApi, reputationData.currentEpoch, getConfig().stacksHiroKey);
		let reputationUserData: ReputationByUserContractData;
		if (address) {
			reputationUserData = await readReputationContractUserData(getDaoConfig(), getConfig().stacksApi, address, reputationData.currentEpoch, 1, getConfig().stacksHiroKey);
			console.log('updateDaoOverview: reputationUserData: ', reputationUserData);
		}
		console.log('updateDaoOverview: reputationEpochData: ', reputationEpochData);
		console.log('updateDaoOverview: reputationData: ', reputationData);
		// Fetch contract balances
		try {
			await readMinTokenLiquidity(getDaoConfig().VITE_DAO_DEPLOYER, getDaoConfig().VITE_DAO_MARKET_PREDICTING);
			await readMinTokenLiquidity(getDaoConfig().VITE_DAO_DEPLOYER, getDaoConfig().VITE_DAO_MARKET_SCALAR);
		} catch (err: any) {
			console.log('/market-dao-data: ', '==================================================================');
		}
		const scalarBalances = await fetchContractBalances(getConfig().stacksApi, `${getDaoConfig().VITE_DAO_DEPLOYER}.${getDaoConfig().VITE_DAO_MARKET_SCALAR}`, getConfig().stacksHiroKey);
		const contractBalances = await fetchContractBalances(getConfig().stacksApi, `${getDaoConfig().VITE_DAO_DEPLOYER}.${getDaoConfig().VITE_DAO_MARKET_PREDICTING}`, getConfig().stacksHiroKey);
		const treasuryBalances = await fetchContractBalances(getConfig().stacksApi, `${getDaoConfig().VITE_DAO_DEPLOYER}.${getDaoConfig().VITE_DAO_TREASURY}`, getConfig().stacksHiroKey);
		let tokenSale;
		// try {
		// 	tokenSale = await fetchTokenSaleStages(getConfig().stacksApi, getDaoConfig().VITE_DAO_DEPLOYER, getDaoConfig().VITE_DAO_TOKEN_SALE, getConfig().stacksHiroKey);
		// } catch (err) {}

		// Update cache
		cachedData = {
			contractData,
			contractBalances,
			scalarBalances,
			treasuryBalances,
			tokenSale,
			reputationData,
			reputationEpochData,
			reputationUserData
		};
	} catch (error) {
		console.error('Error fetching contract data:', error);
	}
}

export async function readMinTokenLiquidity(deployer: string, contractName: string): Promise<any> {
	const tokens1 = await fetchAllowedTokens(1);
	for (let t of tokens1) {
		const l = await readMinTokenLiquidityToken(deployer, contractName, t.token);
		const atok = (await daoEventCollection.findOne({ event: 'allowed-token', token: t.token, extension: `${deployer}.${contractName}` })) as unknown as TokenPermissionEvent;
		atok.minLiquidity = l;
		await saveOrUpdateEvent(atok);
		//console.log('readMinTokenLiquidity: saved: ' + atok);
	}
}

export async function readMinTokenLiquidityToken(deployer: string, contractName: string, token: string): Promise<any> {
	try {
		const functionArgs = [`0x${serializeCV(principalCV(token))}`];
		const data = {
			contractAddress: deployer,
			contractName: contractName,
			functionName: 'get-token-minimum-seed',
			functionArgs
		};
		const result = await callContractReadOnly(getConfig().stacksApi, data, getConfig().stacksHiroKey);
		//console.log('readMinTokenLiquidityToken: ', result);
		if (result.success) return Number(result.value.value.value);
		else return -1;
	} catch (e: any) {
		if (contractName === getDaoConfig().VITE_DAO_MARKET_PREDICTING) {
			if (token === `${getDaoConfig().VITE_WRAPPED_STX_FULL_CONTRACT}`) return 100000000;
			else if (token === `${getDaoConfig().VITE_DAO_DEPLOYER}.bme000-0-governance-token`) return 100000000;
			else if (token === `${getDaoConfig().VITE_PEPE_FULL_CONTRACT}`) return 100000000;
			else if (token === `${getDaoConfig().VITE_USDH_FULL_CONTRACT}`) return 100000000;
			else if (token === `${getDaoConfig().VITE_SBTC_DEPLOYER}.sbtc-token`) return 100000000;
		} else if (contractName === getDaoConfig().VITE_DAO_MARKET_SCALAR) {
			if (token === `${getDaoConfig().VITE_WRAPPED_STX_FULL_CONTRACT}`) return 100000000;
			else if (token === `${getDaoConfig().VITE_DAO_DEPLOYER}.bme000-0-governance-token`) return 100000000;
			else if (token === `${getDaoConfig().VITE_PEPE_FULL_CONTRACT}`) return 100000000;
			else if (token === `${getDaoConfig().VITE_USDH_FULL_CONTRACT}`) return 100000000;
			else if (token === `${getDaoConfig().VITE_SBTC_DEPLOYER}.sbtc-token`) return 100000000;
		}
		return 0;
	}
}

async function updateMarketData(marketId: number, marketType: number, marketContract: string) {
	// marketData is kept up to date on the create-market event when new events are detected!
	const marketData: MarketData | undefined = await fetchMarketData(getConfig().stacksApi, marketId, marketContract.split('.')[0], marketContract.split('.')[1], getConfig().stacksHiroKey);
	if (!marketData) {
		console.error('Problem calling api - maybe rate limits?');
		return 'Problem calling api - maybe rate limits?';
	}
	const createEvent = await fetchMarket(marketId, marketType);
	if (!createEvent) return; // events sequence can screw eg during development
	const changes = {
		marketData
	};
	// if (!createEvent || changes.resolutionState < createEvent.resolutionState) return;
	if (createEvent && createEvent._id) {
		await updateDaoEvent(new ObjectId(createEvent._id), changes);
	} else {
		console.error('createEvent is null or missing _id', createEvent);
		// Optionally throw or return here if this is a blocking issue
	}
}
export async function updatePredictionMarketCreateEvent(marketType: number, result: any, basicEvent: BasicEvent) {
	let metadataHash = result.value['market-data-hash'].value;
	metadataHash = metadataHash.replace(/^0x/, '');
	const unhashedData: StoredOpinionPoll = await findUserEnteredPollByHash(metadataHash);
	const marketId = Number(result.value['market-id'].value);
	const seedAmount = result.value['seed-amount']?.value || 0;
	console.log(marketId, ' marketContract: ' + basicEvent.extension);
	const marketData: MarketData | undefined = await fetchMarketData(getConfig().stacksApi, marketId, basicEvent.extension.split('.')[0], basicEvent.extension.split('.')[1], getConfig().stacksHiroKey);
	if (!marketData) {
		console.error('Problem calling api - maybe rate limits?');
		return 'Problem calling api - maybe rate limits?';
	}
	const createEvent = {
		...basicEvent,
		marketId,
		marketType,
		unhashedData,
		marketData,
		seedAmount
	} as PredictionMarketCreateEvent;
	await saveOrUpdateEvent(createEvent);
	return createEvent;
}

export async function updateResolveMarketEvent(marketType: number, result: any, basicEvent: BasicEvent) {
	console.log('resolve-market: result.value.event: ', result);
	const marketId = Number(result.value['market-id'].value);
	const marketData: MarketData | undefined = await fetchMarketData(getConfig().stacksApi, marketId, basicEvent.extension.split('.')[0], basicEvent.extension.split('.')[1], getConfig().stacksHiroKey);
	const createEvent = await fetchMarket(marketId, marketType);
	const priceOutcome = Number(result.value['price']?.value || 0);
	const stacksHeight = Number(result.value['stacks-height']?.value || 0);
	const resolutionBurnHeight = Number(result.value['resolution-burn-height']?.value || 0);
	const changes = {
		marketData,
		resolver: result.value.resolver?.value || undefined,
		priceOutcome: priceOutcome,
		stacksHeight: stacksHeight,
		resolutionBurnHeight
	};
	// if (!createEvent || changes.resolutionState < createEvent.resolutionState) return;
	if (createEvent && createEvent._id) {
		await updateDaoEvent(new ObjectId(createEvent._id), changes);
	} else {
		console.error('createEvent is null or missing _id', createEvent);
		// Optionally throw or return here if this is a blocking issue
	}

	const resolveEvent = {
		...basicEvent,
		marketId,
		marketType,
		priceOutcome,
		stacksHeight,
		resolutionBurnHeight
	};
	await saveOrUpdateEvent(resolveEvent);
	return resolveEvent;
}

export async function updateResolveMarketUndisputedEvent(marketType: number, result: any, basicEvent: BasicEvent) {
	const marketId = Number(result.value['market-id'].value);
	const createEvent = await fetchMarket(marketId, marketType);
	const marketData: MarketData | undefined = await fetchMarketData(getConfig().stacksApi, marketId, basicEvent.extension.split('.')[0], basicEvent.extension.split('.')[1], getConfig().stacksHiroKey);
	if (!createEvent) return;
	const changes = {
		concluded: true,
		marketData
	};
	//console.log('resolve-market-undisputed: changes: ' + new ObjectId(createEvent._id), changes);
	if (createEvent && createEvent._id) {
		await updateDaoEvent(new ObjectId(createEvent._id), changes);
	} else {
		console.error('createEvent is null or missing _id', createEvent);
		// Optionally throw or return here if this is a blocking issue
	}

	const resolveEvent = {
		...basicEvent,
		marketId,
		marketType
	};
	await saveOrUpdateEvent(resolveEvent);
	return resolveEvent;
}

export async function updateResolveMarketVoteEvent(marketType: number, result: any, basicEvent: BasicEvent) {
	const marketId = Number(result.value['market-id'].value);
	const createEvent = await fetchMarket(marketId, marketType);
	if (!createEvent) return;
	const marketData: MarketData | undefined = await fetchMarketData(getConfig().stacksApi, marketId, basicEvent.extension.split('.')[0], basicEvent.extension.split('.')[1], getConfig().stacksHiroKey);
	const changes = {
		marketData,
		resolver: result.value.resolver.value
	};
	if (createEvent && createEvent._id) {
		await updateDaoEvent(new ObjectId(createEvent._id), changes);
	} else {
		console.error('createEvent is null or missing _id', createEvent);
		// Optionally throw or return here if this is a blocking issue
	}
	const resolveEvent = {
		...basicEvent,
		marketId,
		marketType,
		resolver: result.value.resolver.value
	};
	await saveOrUpdateEvent(resolveEvent);
	return resolveEvent;
}

export async function updateDisputeResolutionEvent(marketType: number, result: any, basicEvent: BasicEvent) {
	const marketId = Number(result.value['market-id'].value);
	const createEvent = await fetchMarket(marketId, marketType);
	if (!createEvent) return;
	const marketData: MarketData | undefined = await fetchMarketData(getConfig().stacksApi, marketId, basicEvent.extension.split('.')[0], basicEvent.extension.split('.')[1], getConfig().stacksHiroKey);
	const changes = {
		marketData,
		disputer: result.value.disputer.value
	};
	if (createEvent && createEvent._id) {
		await updateDaoEvent(new ObjectId(createEvent._id), changes);
	} else {
		console.error('createEvent is null or missing _id', createEvent);
		// Optionally throw or return here if this is a blocking issue
	}
	const resolveEvent = {
		...basicEvent,
		marketId,
		marketType,
		disputer: result.value.disputer.value
	};
	await saveOrUpdateEvent(resolveEvent);
	return resolveEvent;
}

export async function updateTransferStakeEvent(marketType: number, result: any, basicEvent: BasicEvent) {
	const marketId = Number(result.value['market-id'].value);
	const createEvent = await fetchMarket(marketId, marketType);
	if (!createEvent) return;
	const changes = {
		transferLosingStakes: Number(result.value.balance.value)
	};
	if (createEvent && createEvent._id) {
		await updateDaoEvent(new ObjectId(createEvent._id), changes);
	} else {
		console.error('createEvent is null or missing _id', createEvent);
		// Optionally throw or return here if this is a blocking issue
	}
	const resolveEvent = {
		...basicEvent,
		marketId,
		marketType,
		transferLosingStakes: Number(result.value.balance.value)
	};
	await saveOrUpdateEvent(resolveEvent);
	return resolveEvent;
}

export async function updatePriceBandWidth(marketType: number, result: any, basicEvent: BasicEvent) {
	// (print {event: "price-band-width", feed-id: feed-id, precent: band-bips})
	const resolveEvent = {
		...basicEvent,
		feedId: result.value['feed-id']?.value || 'unknown',
		bandBips: Number(result.value.precent?.value || 0)
	};
	await saveOrUpdateEvent(resolveEvent);
	return resolveEvent;
}

export async function updateAllowedTokensEvent(marketType: number, result: any, basicEvent: BasicEvent) {
	console.log('allowed-token: ', result.value.event);
	const allowed = Boolean(result.value.enabled.value);
	const token = result.value.token.value;

	const contractEvent = {
		...basicEvent,
		marketType,
		allowed,
		token
	} as TokenPermissionEvent;
	const sip10Data = await getSip10Properties(getConfig().stacksApi, contractEvent);
	contractEvent.sip10Data = sip10Data;
	await saveOrUpdateEvent(contractEvent);
	return contractEvent;
}

export async function updateAllowedTokensEventForSeed(marketType: number, result: any, basicEvent: BasicEvent) {
	console.log('allowed-token: ', result.value.event);
	const allowed = Boolean(result.value.enabled.value);
	const token = result.value.token.value;

	const contractEvent = {
		...basicEvent,
		marketType,
		allowed,
		token
	} as TokenPermissionEvent;
	const sip10Data = await getSip10Properties(getConfig().stacksApi, contractEvent);
	contractEvent.sip10Data = sip10Data;
	await saveOrUpdateEvent(contractEvent);
	return contractEvent;
}

export async function updateClaimWinningsEvent(marketType: number, result: any, basicEvent: BasicEvent) {
	const marketId = Number(result.value['market-id']?.value || 0);
	const indexWon = Number(result.value['index-won']?.value || 0);
	const claimer = result.value.claimer.value;
	const userTokensInOutcome = Number(result.value['user-tokens']?.value || 0);
	let userSharesInOutcome = Number(result.value['user-stake']?.value || 0);
	if (userSharesInOutcome === 0) userSharesInOutcome = Number(result.value['user-shares']?.value || 0);
	const winningPool = Number(result.value['winning-pool']?.value || 0);
	const totalPool = Number(result.value['total-pool']?.value || 0);
	const daoFee = Number(result.value.daofee?.value);
	const marketFee = Number(result.value.marketfee?.value);
	const netRefund = Number(result.value.refund?.value || 0);

	const contractEvent = {
		...basicEvent,
		marketType,
		marketId,
		claimer,
		indexWon,
		userTokensInOutcome,
		userSharesInOutcome,
		winningPool,
		daoFee,
		marketFee,
		netRefund,
		totalPool
	} as PredictionMarketClaimEvent;
	await saveOrUpdateEvent(contractEvent);
	await updateMarketData(marketId, marketType, basicEvent.extension);
	return contractEvent;
}

//      (print {event: "claim-lp-fees", market-id: market-id, user: tx-sender, lp-shares-burned: user-lp-shares, fee-paid: fee-entitlement})
export async function updateClaimLpFeeEvent(marketType: number, result: any, basicEvent: BasicEvent) {
	const marketId = Number(result.value['market-id']?.value || 0);
	const sender = result.value['lp']?.value;
	const lpSharesBurned = result.value['lp-shares-burned']?.value;
	const feePaid = result.value['fee-paid']?.value;
	const contractEvent = {
		...basicEvent,
		marketType,
		marketId,
		sender,
		lpSharesBurned,
		feePaid
	} as PredictionMarketLPClaimEvent;
	await saveOrUpdateEvent(contractEvent);
	await updateMarketData(marketId, marketType, basicEvent.extension);
	return contractEvent;
}

//      (print {event: "remove-liquidity", market-id: market-id, lp: tx-sender, requested: amount, amount: actual-refund})
export async function updateRemoveLiquidityEvent(marketType: number, result: any, basicEvent: BasicEvent) {
	const marketId = Number(result.value['market-id']?.value || 0);
	const sender = result.value['lp']?.value;
	const lpRequested = result.value['requested']?.value;
	const lpActualRefund = result.value['actual-refund']?.value;
	const contractEvent = {
		...basicEvent,
		marketType,
		marketId,
		sender,
		lpRequested,
		lpActualRefund
	} as PredictionMarketLPRemoveEvent;
	await saveOrUpdateEvent(contractEvent);
	await updateMarketData(marketId, marketType, basicEvent.extension);
	return contractEvent;
}

//    (print {event: "add-liquidity", market-id: market-id, lp: tx-sender, requested: amount, amount: actual-amount, lp-shares-minted: new-lp-shares, lp-total-shares: (+ lp-total new-lp-shares)})
export async function updateAddLiquidityEvent(marketType: number, result: any, basicEvent: BasicEvent) {
	const marketId = Number(result.value['market-id']?.value || 0);
	const sender = result.value['lp']?.value;
	const requested = result.value['requested']?.value;
	const amount = result.value['amount']?.value;
	const lpSharesMinted = result.value['lp-shares-minted']?.value;
	const lpTotalShares = result.value['lp-total-shares']?.value;

	const contractEvent = {
		...basicEvent,
		marketType,
		marketId,
		sender,
		requested,
		amount,
		lpSharesMinted,
		lpTotalShares
	} as PredictionMarketLPAddEvent;
	await saveOrUpdateEvent(contractEvent);
	await updateMarketData(marketId, marketType, basicEvent.extension);
	return contractEvent;
}

//      (print {event: "market-unstake", market-id: market-id, index: index, shares-in: shares-in, refund: net-refund, fee: fee, lp-fee: lp-fee, multisig-fee: multisig-fee, seller: tx-sender, min-refund: min-refund})
export async function updateUnstakeEvent(marketType: number, result: any, basicEvent: BasicEvent) {
	const marketId = Number(result.value['market-id']?.value || 0);
	const index = Number(result.value['index']?.value || 0);
	const sharesIn = result.value['shares-in']?.value;
	const refund = result.value['refund']?.value;
	const fee = result.value['fee']?.value;
	const lpFee = result.value['lp-fee']?.value;
	const multisigFee = result.value['multisig-fee']?.value;
	const seller = result.value['seller']?.value;
	const minRefund = result.value['min-refund']?.value;
	const contractEvent = {
		...basicEvent,
		marketType,
		marketId,
		sharesIn,
		index,
		refund,
		fee,
		lpFee,
		multisigFee,
		seller,
		minRefund
	} as PredictionMarketUnStakeEvent;
	await saveOrUpdateEvent(contractEvent);
	await updateMarketData(marketId, marketType, basicEvent.extension);
	return contractEvent;
}

//      (print {event: "market-stake", market-id: market-id, index: index, amount: amount-shares, cost: cost-of-shares, fee: fee, lp-fee: lp-fee, multisig-fee: multisig-fee, voter: tx-sender, max-cost: max-cost})
export async function updateMarketStakeEvent(marketType: number, result: any, basicEvent: BasicEvent) {
	console.log('updateMarketStakeEvent: ' + marketType + ' : ' + basicEvent.extension);
	const marketId = Number(result.value['market-id'].value);
	const amount = Number(result.value.amount?.value || 0);
	const index = Number(result.value.index.value);
	const voter = result.value.voter.value;
	const fee = Number(result.value.fee?.value || 0);
	const cost = Number(result.value.cost?.value || 0);
	const lpFee = Number(result.value['lp-fee']?.value || 0);
	const multisigFee = Number(result.value['multisig-fee']?.value || 0);
	const maxCost = Number(result.value['max-cost']?.value || 0);
	console.log('updateMarketStakeEvent: found object: ' + voter);
	const contractEvent = {
		...basicEvent,
		marketId,
		marketType,
		amount,
		index,
		voter,
		fee,
		cost,
		lpFee,
		multisigFee,
		maxCost
	} as PredictionMarketStakeEvent;
	console.log('updateMarketStakeEvent: update event data: ');
	await saveOrUpdateEvent(contractEvent);
	console.log('updateMarketStakeEvent: updateMarketData: ');
	await updateMarketData(marketId, marketType, basicEvent.extension);
	return contractEvent;
}
// (print {event: "market-stake", market-id: market-id, index: index, category: category, amount: amount-less-fee, voter: tx-sender})
// (print {event: "market-stake", market-id: market-id, index: index, amount: amount-shares, cost: cost, fee: fee, voter: tx-sender})

export async function fetchAllowedTokens(marketType: number): Promise<Array<TokenPermissionEvent>> {
	const result = await daoEventCollection.find({ event: 'allowed-token', marketType }).toArray();

	return result as unknown as Array<TokenPermissionEvent>;
}

export async function fetchActiveMarketCategories(): Promise<Array<MarketCategory>> {
	const result = await marketCategoriesCollection.find({ active: true }).toArray();
	return result as unknown as Array<MarketCategory>;
}

export async function fetchAllMarketCategories(): Promise<Array<MarketCategory>> {
	const result = await marketCategoriesCollection.find({}).toArray();
	return result as unknown as Array<MarketCategory>;
}

export async function fetchMarketVotes(marketId: number): Promise<Array<MarketVotingVoteEvent>> {
	const result = await daoEventCollection.find({ marketId: marketId, extension: `${getDaoConfig().VITE_DAO_DEPLOYER}.${getDaoConfig().VITE_DAO_MARKET_VOTING}`, event: 'market-vote' }).toArray();
	return result as unknown as Array<MarketVotingVoteEvent>;
}
export async function fetchMarketClaims(marketId: number, marketType: number): Promise<Array<PredictionMarketClaimEvent>> {
	const result = await daoEventCollection.find({ extension: getContract(marketType), marketId, marketType, event: 'claim-winnings' }).toArray();
	return result as unknown as Array<PredictionMarketClaimEvent>;
}

export function getContract(marketType: number): string {
	let contract = `${getDaoConfig().VITE_DAO_DEPLOYER}.${getDaoConfig().VITE_DAO_MARKET_BITCOIN}`;
	if (marketType === 1) contract = `${getDaoConfig().VITE_DAO_DEPLOYER}.${getDaoConfig().VITE_DAO_MARKET_PREDICTING}`;
	if (marketType === 2) contract = `${getDaoConfig().VITE_DAO_DEPLOYER}.${getDaoConfig().VITE_DAO_MARKET_SCALAR}`;
	return contract;
}
export async function fetchMarketStakes(marketId: number, marketType: number): Promise<{ stakes: Array<PredictionMarketStakeEvent>; unstakes: Array<PredictionMarketUnStakeEvent> }> {
	const stakes = (await daoEventCollection.find({ extension: getContract(marketType), marketId, marketType, event: 'market-stake' }).toArray()) as unknown as Array<PredictionMarketStakeEvent>;
	const unstakes = (await daoEventCollection.find({ extension: getContract(marketType), marketId, marketType, event: 'market-unstake' }).toArray()) as unknown as Array<PredictionMarketUnStakeEvent>;
	return { stakes, unstakes };
}

export async function fetchMarketLiquidityEvents(
	marketId: number,
	marketType: number
): Promise<{ addLiquidityEvents: Array<PredictionMarketLPAddEvent>; removeLiquidityEvents: Array<PredictionMarketLPRemoveEvent>; claimLpFeeEvents: Array<PredictionMarketLPClaimEvent> }> {
	const addLiquidityEvents = (await daoEventCollection.find({ extension: getContract(marketType), marketId, marketType, event: 'add-liquidity' }).toArray()) as unknown as Array<PredictionMarketLPAddEvent>;
	const removeLiquidityEvents = (await daoEventCollection.find({ extension: getContract(marketType), marketId, marketType, event: 'remove-liquidity' }).toArray()) as unknown as Array<PredictionMarketLPRemoveEvent>;
	const claimLpFeeEvents = (await daoEventCollection.find({ extension: getContract(marketType), marketId, marketType, event: 'claim-lp-fees' }).toArray()) as unknown as Array<PredictionMarketLPClaimEvent>;
	return { addLiquidityEvents, removeLiquidityEvents, claimLpFeeEvents };
}

export async function fetchMarkets(): Promise<Array<PredictionMarketCreateEvent>> {
	const result = await daoEventCollection.find({ 'unhashedData.processed': false, 'unhashedData.featured': true, event: 'create-market', unhashedData: { $ne: null, $exists: true }, marketData: { $ne: null, $exists: true } }).toArray();
	return result as unknown as Array<PredictionMarketCreateEvent>;
}

export async function findOpinionPollByTitle(title: string): Promise<StoredOpinionPoll> {
	const result = await marketCollection.findOne({
		name: title
	});
	return result as unknown as StoredOpinionPoll;
}

export async function fetchMarket(marketId: number, marketType?: number): Promise<PredictionMarketCreateEvent> {
	const result = await daoEventCollection.findOne({
		event: 'create-market',
		marketId: marketId,
		marketType: marketType ? marketType : 1,
		extension: getContract(marketType || 1)
	});
	return result as unknown as PredictionMarketCreateEvent;
}

export async function countCreateMarketEvents(marketType: number): Promise<number> {
	try {
		const result = await daoEventCollection.countDocuments({
			event: 'create-market',
			marketType
		});
		return Number(result);
	} catch (err: any) {
		return 0;
	}
}

export async function findPredictionContractEventByContractAndIndex(extension: string, event_index: number, txId: string): Promise<any> {
	const result = await daoEventCollection.findOne({
		extension,
		event_index,
		txId
	});
	return result;
}
export async function findPredictionContractEventAndIndex(event_index: number, txId: string): Promise<any> {
	const result = await daoEventCollection.findOne({
		event_index,
		txId
	});
	return result;
}

async function saveOrUpdateEvent(contractEvent: BasicEvent) {
	let pdb;
	try {
		pdb = await findPredictionContractEventByContractAndIndex(contractEvent.extension, contractEvent.event_index, contractEvent.txId);
		if (pdb) {
			if (contractEvent._id) await updateDaoEvent(new ObjectId(contractEvent._id), contractEvent);
		} else {
			await saveDaoEvent(contractEvent);
		}
	} catch (err: any) {
		console.log('saveOrUpdateEvent: error1: ', pdb, err);
	}
}
async function updateDaoEvent(_id: ObjectId, changes: any) {
	if (!changes || Object.keys(changes).length === 0) {
		throw new Error('Changes object is empty or invalid.');
	}

	const result = await daoEventCollection.updateOne(
		{
			_id
		},
		{ $set: changes },
		{ writeConcern: { w: 'majority' } }
	);
	if (result.matchedCount === 0) {
		throw new Error(`No document found with _id: ${_id}`);
	}

	return result;
}
