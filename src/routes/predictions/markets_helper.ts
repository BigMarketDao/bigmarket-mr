import {
	fetchMarketData,
	getSip10Properties,
	MarketData,
	PollVoteEvent,
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

async function updateMarketData(marketId: number, marketType: number, marketContract: string) {
	// marketData is kept up to date on the create-market event when new events are detected!
	const marketData: MarketData | undefined = await fetchMarketData(getConfig().stacksApi, marketId, marketContract.split('.')[0], marketContract.split('.')[1]);
	if (!marketData) throw new Error('Problem calling api - maybe rate limits?');
	const createEvent = await fetchMarket(marketId, marketType);
	if (!createEvent) return; // events sequence can screw eg during development
	const changes = {
		marketData
	};
	// if (!createEvent || changes.resolutionState < createEvent.resolutionState) return;
	await updateDaoEvent(createEvent._id, changes);
}
export async function updatePredictionMarketCreateEvent(marketType: number, event: any, result: any, daoContract: string, marketContract: string) {
	let metadataHash = result.value['market-data-hash'].value;
	metadataHash = metadataHash.replace(/^0x/, '');
	const unhashedData: StoredOpinionPoll = await findUserEnteredPollByHash(metadataHash);
	const marketId = Number(result.value['market-id'].value);
	console.log(marketId, ' marketContract: ' + marketContract);
	const marketData: MarketData | undefined = await fetchMarketData(getConfig().stacksApi, marketId, marketContract.split('.')[0], marketContract.split('.')[1]);
	if (!marketData) throw new Error('Problem calling api - maybe rate limits?');
	const createEvent = {
		_id: new ObjectId(),
		event: 'create-market',
		event_index: Number(event.event_index),
		txId: event.tx_id,
		daoContract,
		votingContract: marketContract,
		marketId,
		marketType,
		unhashedData,
		marketData
	} as PredictionMarketCreateEvent;
	await saveOrUpdateEvent(createEvent);
}

export async function updateResolveMarketEvent(marketType: number, event: any, result: any, daoContract: string, marketContract: string) {
	console.log('resolve-market: result.value.event: ', result);
	const marketId = Number(result.value['market-id'].value);
	const marketData: MarketData | undefined = await fetchMarketData(getConfig().stacksApi, marketId, marketContract.split('.')[0], marketContract.split('.')[1]);
	const createEvent = await fetchMarket(marketId, marketType);
	const priceOutcome = Number(result.value['price']?.value || 0);
	const stacksHeight = Number(result.value['stacks-height']?.value || 0);
	const changes = {
		marketData,
		resolver: result.value.resolver?.value || undefined,
		priceOutcome: priceOutcome,
		stacksHeight: stacksHeight
	};
	// if (!createEvent || changes.resolutionState < createEvent.resolutionState) return;
	await updateDaoEvent(createEvent._id, changes);

	const resolveEvent = {
		_id: new ObjectId(),
		event: 'resolve-market',
		event_index: Number(event.event_index),
		txId: event.tx_id,
		daoContract,
		votingContract: marketContract,
		marketId,
		marketType,
		priceOutcome,
		stacksHeight
	};
	await saveOrUpdateEvent(resolveEvent);
}

export async function updateResolveMarketUndisputedEvent(marketType: number, event: any, result: any, daoContract: string, marketContract: string) {
	const marketId = Number(result.value['market-id'].value);
	const createEvent = await fetchMarket(marketId, marketType);
	const marketData: MarketData | undefined = await fetchMarketData(getConfig().stacksApi, marketId, marketContract.split('.')[0], marketContract.split('.')[1]);
	if (!createEvent) return;
	const changes = {
		concluded: true,
		marketData
	};
	console.log('resolve-market-undisputed: changes: ' + createEvent._id, changes);
	await updateDaoEvent(createEvent._id, changes);

	const resolveEvent = {
		_id: new ObjectId(),
		event: 'resolve-market-undisputed',
		event_index: Number(event.event_index),
		txId: event.tx_id,
		daoContract,
		votingContract: marketContract,
		marketId,
		marketType
	};
	await saveOrUpdateEvent(resolveEvent);
}

export async function updateResolveMarketVoteEvent(marketType: number, event: any, result: any, daoContract: string, marketContract: string) {
	const marketId = Number(result.value['market-id'].value);
	const createEvent = await fetchMarket(marketId, marketType);
	if (!createEvent) return;
	const marketData: MarketData | undefined = await fetchMarketData(getConfig().stacksApi, marketId, marketContract.split('.')[0], marketContract.split('.')[1]);
	const changes = {
		marketData,
		resolver: result.value.resolver.value
	};
	await updateDaoEvent(createEvent._id, changes);
	const resolveEvent = {
		_id: new ObjectId(),
		event: 'resolve-market-vote',
		event_index: Number(event.event_index),
		txId: event.tx_id,
		daoContract,
		votingContract: marketContract,
		marketId,
		marketType,
		resolver: result.value.resolver.value
	};
	await saveOrUpdateEvent(resolveEvent);
}

export async function updateDisputeResolutionEvent(marketType: number, event: any, result: any, daoContract: string, marketContract: string) {
	const marketId = Number(result.value['market-id'].value);
	const createEvent = await fetchMarket(marketId, marketType);
	if (!createEvent) return;
	const marketData: MarketData | undefined = await fetchMarketData(getConfig().stacksApi, marketId, marketContract.split('.')[0], marketContract.split('.')[1]);
	const changes = {
		marketData,
		disputer: result.value.disputer.value
	};
	await updateDaoEvent(createEvent._id, changes);
	const resolveEvent = {
		_id: new ObjectId(),
		event: 'dispute-resolution',
		event_index: Number(event.event_index),
		txId: event.tx_id,
		daoContract,
		votingContract: marketContract,
		marketId,
		marketType,
		disputer: result.value.disputer.value
	};
	await saveOrUpdateEvent(resolveEvent);
}

export async function updateTransferStakeEvent(marketType: number, event: any, result: any, daoContract: string, marketContract: string) {
	const marketId = Number(result.value['market-id'].value);
	const createEvent = await fetchMarket(marketId, marketType);
	if (!createEvent) return;
	const changes = {
		transferLosingStakes: Number(result.value.balance.value)
	};
	await updateDaoEvent(createEvent._id, changes);
	const resolveEvent = {
		_id: new ObjectId(),
		event: 'transfer-losing-stakes',
		event_index: Number(event.event_index),
		txId: event.tx_id,
		daoContract,
		votingContract: marketContract,
		marketId,
		marketType,
		transferLosingStakes: Number(result.value.balance.value)
	};
	await saveOrUpdateEvent(resolveEvent);
}

export async function updateAllowedTokensEvent(marketType: number, event: any, result: any, daoContract: string, votingContract: string) {
	console.log('allowed-token: ', result.value.event);
	const allowed = Boolean(result.value.enabled.value);
	const token = result.value.token.value;

	const contractEvent = {
		_id: new ObjectId(),
		event: 'allowed-token',
		event_index: Number(event.event_index),
		txId: event.tx_id,
		marketType,
		daoContract,
		votingContract,
		allowed,
		token
	} as TokenPermissionEvent;
	const sip10Data = await getSip10Properties(getConfig().stacksApi, contractEvent);
	contractEvent.sip10Data = sip10Data;
	await saveOrUpdateEvent(contractEvent);
}

export async function updateClaimWinningsEvent(marketType: number, event: any, result: any, daoContract: string, votingContract: string) {
	const marketId = Number(result.value['market-id'].value);
	const indexWon = Number(result.value['index-won'].value);
	const claimer = result.value.claimer.value;
	const userStake = Number(result.value['user-stake'].value);
	const userShare = Number(result.value['user-share'].value);
	const winningPool = Number(result.value['winning-pool'].value);
	const totalPool = Number(result.value['total-pool'].value);
	const daoFee = Number(result.value.daofee?.value);
	const marketFee = Number(result.value.marketfee?.value);

	const contractEvent = {
		_id: new ObjectId(),
		event: 'claim-winnings',
		event_index: Number(event.event_index),
		txId: event.tx_id,
		daoContract,
		votingContract,
		marketType,
		marketId,
		claimer,
		indexWon,
		userStake,
		userShare,
		winningPool,
		daoFee,
		marketFee,
		totalPool
	} as PredictionMarketClaimEvent;
	await saveOrUpdateEvent(contractEvent);
	await updateMarketData(marketId, marketType, votingContract);
}

export async function updateMarketStakeEvent(marketType: number, event: any, result: any, daoContract: string, votingContract: string) {
	console.log('updateMarketStakeEvent: ' + marketType + ' : ' + votingContract);
	const marketId = Number(result.value['market-id'].value);
	const amount = Number(result.value.amount.value);
	const index = Number(result.value.index.value);
	const voter = result.value.voter.value;
	console.log('updateMarketStakeEvent: found object: ' + voter);
	const contractEvent = {
		_id: new ObjectId(),
		event: 'market-stake',
		event_index: Number(event.event_index),
		txId: event.tx_id,
		daoContract,
		votingContract,
		marketId,
		marketType,
		amount,
		index,
		voter
	} as PredictionMarketStakeEvent;
	console.log('updateMarketStakeEvent: update event data: ');
	await saveOrUpdateEvent(contractEvent);
	console.log('updateMarketStakeEvent: updateMarketData: ');
	await updateMarketData(marketId, marketType, votingContract);
}
// (print {event: "market-stake", market-id: market-id, index: index, category: category, amount: amount-less-fee, voter: tx-sender})

export async function fetchAllowedTokens(): Promise<Array<TokenPermissionEvent>> {
	const result = await daoEventCollection.find({ event: 'allowed-token', marketType: 1 }).toArray();

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

export async function fetchMarketVotes(marketId: number): Promise<Array<PollVoteEvent>> {
	const result = await daoEventCollection.find({ pollId: marketId, event: 'market-vote' }).toArray();
	return result as unknown as Array<PollVoteEvent>;
}

export async function fetchMarketStakes(marketId: number, marketType: number): Promise<Array<PredictionMarketStakeEvent>> {
	const result = await daoEventCollection.find({ marketId, marketType, event: 'market-stake' }).toArray();
	return result as unknown as Array<PredictionMarketStakeEvent>;
}

export async function fetchMarketClaims(marketId: number, marketType: number): Promise<Array<PredictionMarketClaimEvent>> {
	const result = await daoEventCollection.find({ marketId, marketType, event: 'claim-winnings' }).toArray();
	return result as unknown as Array<PredictionMarketClaimEvent>;
}

export async function fetchMarkets(): Promise<Array<PredictionMarketCreateEvent>> {
	const result = await daoEventCollection.find({ unhashedData: { $ne: null, $exists: true } }).toArray();
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
		marketType: marketType ? marketType : 1
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

export async function findPredictionContractEventByContractAndIndex(votingContract: string, event_index: number, txId: string): Promise<any> {
	const result = await daoEventCollection.findOne({
		votingContract,
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

async function saveOrUpdateEvent(contractEvent: any | PredictionMarketCreateEvent | PredictionMarketStakeEvent | PredictionMarketClaimEvent | TokenPermissionEvent) {
	let pdb;
	try {
		pdb = await findPredictionContractEventByContractAndIndex(contractEvent.votingContract, contractEvent.event_index, contractEvent.txId);
		if (pdb) {
			await updateDaoEvent(contractEvent._id!, contractEvent);
		} else {
			await saveDaoEvent(contractEvent);
		}
	} catch (err: any) {
		console.log('saveOrUpdateEvent: error1: ', pdb, err);
	}
}
async function saveDaoEvent(contractEvent: PredictionMarketCreateEvent | PredictionMarketStakeEvent | PredictionMarketClaimEvent | TokenPermissionEvent) {
	contractEvent._id = new ObjectId();
	const result = await daoEventCollection.insertOne(contractEvent);
	return result;
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
