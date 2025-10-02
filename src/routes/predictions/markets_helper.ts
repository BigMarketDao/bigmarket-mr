import {
	BasicEvent,
	callContractReadOnly,
	fetchMarketData,
	getSip10Properties,
	MarketData,
	MarketVotingVoteEvent,
	PredictionMarketClaimEvent,
	PredictionMarketCreateEvent,
	PredictionMarketStakeEvent,
	StoredOpinionPoll,
	TokenPermissionEvent,
	type MarketCategory
} from '@mijoco/stx_helpers/dist/index.js';
import { daoEventCollection, marketCategoriesCollection, marketCollection } from '../../lib/data/db_models.js';
import { findUserEnteredPollByHash } from '../polling/polling_helper.js';
import { getConfig } from '../../lib/config.js';
import { ObjectId } from 'mongodb';
import { getDaoConfig } from '../../lib/config_dao.js';
import { saveDaoEvent } from '../dao/events/dao_events_extension_helper.js';
import { principalCV, serializeCV } from '@stacks/transactions';

export async function readMinTokenLiquidity(deployer: string, contractName: string): Promise<any> {
	const tokens1 = await fetchAllowedTokens(1);
	for (let t of tokens1) {
		const l = await readMinTokenLiquidityToken(deployer, contractName, t.token);
		const atok = (await daoEventCollection.findOne({ event: 'allowed-token', token: t.token, extension: `${deployer}.${contractName}` })) as unknown as TokenPermissionEvent;
		atok.minLiquidity = l;
		await saveOrUpdateEvent(atok);
		console.log('readMinTokenLiquidity: saved: ' + atok);
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
		const result = await callContractReadOnly(getConfig().stacksApi, data);
		console.log('readMinTokenLiquidityToken: ', result);
		if (result.success) return Number(result.value.value.value);
		else return -1;
	} catch (e: any) {
		if (contractName === getDaoConfig().VITE_DAO_MARKET_PREDICTING) {
			if (token === `${getDaoConfig().VITE_WRAPPED_STX_FULL_CONTRACT}`) return 100000000;
			else if (token === `${getDaoConfig().VITE_DOA_DEPLOYER}.bme000-0-governance-token`) return 100000000;
			else if (token === `${getDaoConfig().VITE_PEPE_FULL_CONTRACT}`) return 100000000;
			else if (token === `${getDaoConfig().VITE_USDH_FULL_CONTRACT}`) return 100000000;
			else if (token === `${getDaoConfig().VITE_SBTC_DEPLOYER}.sbtc-token`) return 100000000;
		} else if (contractName === getDaoConfig().VITE_DAO_MARKET_SCALAR) {
			if (token === `${getDaoConfig().VITE_WRAPPED_STX_FULL_CONTRACT}`) return 100000000;
			else if (token === `${getDaoConfig().VITE_DOA_DEPLOYER}.bme000-0-governance-token`) return 100000000;
			else if (token === `${getDaoConfig().VITE_PEPE_FULL_CONTRACT}`) return 100000000;
			else if (token === `${getDaoConfig().VITE_USDH_FULL_CONTRACT}`) return 100000000;
			else if (token === `${getDaoConfig().VITE_SBTC_DEPLOYER}.sbtc-token`) return 100000000;
		}
		return 0;
	}
}

async function updateMarketData(marketId: number, marketType: number, marketContract: string) {
	// marketData is kept up to date on the create-market event when new events are detected!
	const marketData: MarketData | undefined = await fetchMarketData(getConfig().stacksApi, marketId, marketContract.split('.')[0], marketContract.split('.')[1]);
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
	const marketData: MarketData | undefined = await fetchMarketData(getConfig().stacksApi, marketId, basicEvent.extension.split('.')[0], basicEvent.extension.split('.')[1]);
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
}

export async function updateResolveMarketEvent(marketType: number, result: any, basicEvent: BasicEvent) {
	console.log('resolve-market: result.value.event: ', result);
	const marketId = Number(result.value['market-id'].value);
	const marketData: MarketData | undefined = await fetchMarketData(getConfig().stacksApi, marketId, basicEvent.extension.split('.')[0], basicEvent.extension.split('.')[1]);
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
}

export async function updateResolveMarketUndisputedEvent(marketType: number, result: any, basicEvent: BasicEvent) {
	const marketId = Number(result.value['market-id'].value);
	const createEvent = await fetchMarket(marketId, marketType);
	const marketData: MarketData | undefined = await fetchMarketData(getConfig().stacksApi, marketId, basicEvent.extension.split('.')[0], basicEvent.extension.split('.')[1]);
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
}

export async function updateResolveMarketVoteEvent(marketType: number, result: any, basicEvent: BasicEvent) {
	const marketId = Number(result.value['market-id'].value);
	const createEvent = await fetchMarket(marketId, marketType);
	if (!createEvent) return;
	const marketData: MarketData | undefined = await fetchMarketData(getConfig().stacksApi, marketId, basicEvent.extension.split('.')[0], basicEvent.extension.split('.')[1]);
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
}

export async function updateDisputeResolutionEvent(marketType: number, result: any, basicEvent: BasicEvent) {
	const marketId = Number(result.value['market-id'].value);
	const createEvent = await fetchMarket(marketId, marketType);
	if (!createEvent) return;
	const marketData: MarketData | undefined = await fetchMarketData(getConfig().stacksApi, marketId, basicEvent.extension.split('.')[0], basicEvent.extension.split('.')[1]);
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
}

export async function updatePriceBandWidth(marketType: number, result: any, basicEvent: BasicEvent) {
	// (print {event: "price-band-width", feed-id: feed-id, precent: band-bips})
	const resolveEvent = {
		...basicEvent,
		feedId: result.value['feed-id']?.value || 'unknown',
		bandBips: Number(result.value.precent?.value || 0)
	};
	await saveOrUpdateEvent(resolveEvent);
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
}

export async function updateMarketStakeEvent(marketType: number, result: any, basicEvent: BasicEvent) {
	console.log('updateMarketStakeEvent: ' + marketType + ' : ' + basicEvent.extension);
	const marketId = Number(result.value['market-id'].value);
	const amount = Number(result.value.amount?.value || 0);
	const index = Number(result.value.index.value);
	const voter = result.value.voter.value;
	const fee = Number(result.value.fee?.value || 0);
	const cost = Number(result.value.cost?.value || 0);
	console.log('updateMarketStakeEvent: found object: ' + voter);
	const contractEvent = {
		...basicEvent,
		marketId,
		marketType,
		amount,
		index,
		voter,
		fee,
		cost
	} as PredictionMarketStakeEvent;
	console.log('updateMarketStakeEvent: update event data: ');
	await saveOrUpdateEvent(contractEvent);
	console.log('updateMarketStakeEvent: updateMarketData: ');
	await updateMarketData(marketId, marketType, basicEvent.extension);
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
	const result = await daoEventCollection.find({ marketId: marketId, extension: `${getDaoConfig().VITE_DOA_DEPLOYER}.${getDaoConfig().VITE_DAO_MARKET_VOTING}`, event: 'market-vote' }).toArray();
	return result as unknown as Array<MarketVotingVoteEvent>;
}

function getContract(marketType: number): string {
	let contract = `${getDaoConfig().VITE_DOA_DEPLOYER}.${getDaoConfig().VITE_DAO_MARKET_BITCOIN}`;
	if (marketType === 1) contract = `${getDaoConfig().VITE_DOA_DEPLOYER}.${getDaoConfig().VITE_DAO_MARKET_PREDICTING}`;
	if (marketType === 2) contract = `${getDaoConfig().VITE_DOA_DEPLOYER}.${getDaoConfig().VITE_DAO_MARKET_SCALAR}`;
	return contract;
}
export async function fetchMarketStakes(marketId: number, marketType: number): Promise<Array<PredictionMarketStakeEvent>> {
	const result = await daoEventCollection.find({ extension: getContract(marketType), marketId, marketType, event: 'market-stake' }).toArray();
	return result as unknown as Array<PredictionMarketStakeEvent>;
}

export async function fetchMarketClaims(marketId: number, marketType: number): Promise<Array<PredictionMarketClaimEvent>> {
	const result = await daoEventCollection.find({ extension: getContract(marketType), marketId, marketType, event: 'claim-winnings' }).toArray();
	return result as unknown as Array<PredictionMarketClaimEvent>;
}

export async function fetchMarkets(): Promise<Array<PredictionMarketCreateEvent>> {
	const result = await daoEventCollection.find({ 'unhashedData.processed': false, event: 'create-market', unhashedData: { $ne: null, $exists: true } }).toArray();
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
