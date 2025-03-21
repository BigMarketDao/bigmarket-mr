/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import { cvToJSON, deserializeCV } from '@stacks/transactions';
import {
	ExtensionType,
	StoredOpinionPoll,
	PredictionMarketCreateEvent,
	PredictionMarketClaimEvent,
	PredictionMarketStakeEvent,
	ResolutionState,
	TokenPermissionEvent,
	getSip10Properties,
	fetchMarketData,
	MarketData
} from '@mijoco/stx_helpers/dist/index.js';
import { ObjectId } from 'mongodb';
import {
	countCreateMarketEvents,
	fetchMarket,
	findPredictionContractEventByContractAndIndex,
	updateAllowedTokensEvent,
	updateClaimWinningsEvent,
	updateDisputeResolutionEvent,
	updateMarketStakeEvent,
	updatePredictionMarketCreateEvent,
	updateResolveMarketEvent,
	updateResolveMarketUndisputedEvent,
	updateResolveMarketVoteEvent,
	updateTransferStakeEvent
} from '../markets_helper.js';
import { getConfig } from '../../../lib/config.js';
import { findUserEnteredPollByHash } from '../../polling/polling_helper.js';
import { daoEventCollection } from '../../../lib/data/db_models.js';

export async function readBitcoinEvents(genesis: boolean, daoContract: string, extensionContract: string) {
	// console.log('readBitcoinMarketEvents: extension contract ', extensionContract);
	//return;
	const url = getConfig().stacksApi + '/extended/v1/contract/' + extensionContract + '/events?limit=20';
	const extensions: Array<ExtensionType> = [];
	let currentOffset = 0;
	if (!genesis) {
		currentOffset = await countCreateMarketEvents(1);
	}
	let count = 0;
	let moreEvents = true;
	try {
		do {
			try {
				moreEvents = await resolveBitcoinEvents(url, currentOffset, count, daoContract, extensionContract);
				count++;
			} catch (err: any) {
				console.log('readBitcoinEvents: error 1: ' + extensionContract + ' : ' + err.message);
			}
		} while (moreEvents);
	} catch (err: any) {
		console.log('readBitcoinEvents: error 2: ' + extensionContract + ' : ' + err.message);
	}
	return extensions;
}

async function resolveBitcoinEvents(url: string, currentOffset: number, count: number, daoContract: string, extensionContract: string): Promise<any> {
	let urlOffset = url + '&offset=' + (currentOffset + count * 20);
	const response = await fetch(urlOffset);
	const val = await response.json();

	if (!val || !val.results || typeof val.results !== 'object' || val.results.length === 0) {
		return false;
	}

	// console.log('resolvePredicitonEvents: processing ' + (val?.results?.length || 0) + ' events from ' + extensionContract);
	//console.log('resolveBitcoinEvents: val: ', val)
	for (const event of val.results) {
		const pdb = await findPredictionContractEventByContractAndIndex(extensionContract, Number(event.event_index), event.tx_id);
		if (!pdb) {
			try {
				processEvent(event, daoContract, extensionContract);
			} catch (err: any) {
				console.log('resolvePredictionEvents: ', err);
			}
		}
	}
	return val.results?.length > 0 || false;
}

async function processEvent(event: any, daoContract: string, votingContract: string) {
	const result = cvToJSON(deserializeCV(event.contract_log.value.hex));
	// TODO EVENT: console.log('resolveBitcoinEvents: processing event: ' + result.value.event.value + ' : ' + event.event_index + ' events from ' + votingContract);

	if (result.value.event.value === 'create-market') {
		await updatePredictionMarketCreateEvent(3, event, result, daoContract, votingContract);
	} else if (result.value.event.value === 'allowed-token') {
		await updateAllowedTokensEvent(3, event, result, daoContract, votingContract);
	} else if (result.value.event.value === 'market-stake') {
		await updateMarketStakeEvent(3, event, result, daoContract, votingContract);
	} else if (result.value.event.value === 'resolve-market') {
		await updateResolveMarketEvent(3, event, result, daoContract, votingContract);
	} else if (result.value.event.value === 'resolve-market-undisputed') {
		await updateResolveMarketUndisputedEvent(3, event, result, daoContract, votingContract);
	} else if (result.value.event.value === 'resolve-market-vote') {
		await updateResolveMarketVoteEvent(3, event, result, daoContract, votingContract);
	} else if (result.value.event.value === 'dispute-resolution') {
		await updateDisputeResolutionEvent(3, event, result, daoContract, votingContract);
	} else if (result.value.event.value === 'transfer-losing-stakes') {
		await updateTransferStakeEvent(3, event, result, daoContract, votingContract);
	} else if (result.value.event.value === 'claim-winnings') {
		await updateClaimWinningsEvent(3, event, result, daoContract, votingContract);
	} else {
		//console.log("processEvent: new event: ", event);
	}
}

async function saveOrUpdateEvent(contractEvent: PredictionMarketCreateEvent | PredictionMarketStakeEvent | PredictionMarketClaimEvent | TokenPermissionEvent) {
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
