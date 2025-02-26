/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import { cvToJSON, deserializeCV } from '@stacks/transactions';
import { ExtensionType, StoredOpinionPoll, PredictionMarketCreateEvent, PredictionMarketClaimEvent, PredictionMarketStakeEvent, ResolutionState, TokenPermissionEvent, getSip10Properties } from '@mijoco/stx_helpers/dist/index';
import { ObjectId } from 'mongodb';
import { getConfig } from '../../lib/config';
import { daoEventCollection } from '../../lib/data/db_models';
import { findUserEnteredPollByHash } from '../polling/polling_helper';
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
} from './markets_helper';

export async function readPredictionEvents(genesis: boolean, daoContract: string, extensionContract: string) {
	// console.log('readPredictionMarketEvents: extension contract ', extensionContract);
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
				moreEvents = await resolvePredictionEvents(url, currentOffset, count, daoContract, extensionContract);
				count++;
			} catch (err: any) {
				console.log('readVotingEvents: ' + err.message);
			}
		} while (moreEvents);
	} catch (err) {
		console.log('readVotingEvents: error: ', err);
	}
	return extensions;
}

async function resolvePredictionEvents(url: string, currentOffset: number, count: number, daoContract: string, extensionContract: string): Promise<any> {
	let urlOffset = url + '&offset=' + (currentOffset + count * 20);
	const response = await fetch(urlOffset);
	const val = await response.json();

	if (!val || !val.results || typeof val.results !== 'object' || val.results.length === 0) {
		return false;
	}

	// console.log('resolvePredicitonEvents: processing ' + (val?.results?.length || 0) + ' events from ' + extensionContract);
	//console.log('resolvePredictionEvents: val: ', val)
	for (const event of val.results) {
		const pdb = await findPredictionContractEventByContractAndIndex(extensionContract, Number(event.event_index), event.tx_id);
		if (!pdb) {
			try {
				console.log('resolvePredictionEvents: processing event: ' + event.event_index + ' of ' + (val?.results?.length || 0) + ' events from ' + extensionContract);
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
	// console.log('processEvent: allowed-token: ', result);

	// console.log('processEvent: new event: ' + result.value.event.value + ' contract=' + event.event_index + ' / ' + event.tx_id, event);

	if (result.value.event.value === 'create-market') {
		await updatePredictionMarketCreateEvent(1, event, result, daoContract, votingContract);
	} else if (result.value.event.value === 'allowed-token') {
		await updateAllowedTokensEvent(1, event, result, daoContract, votingContract);
	} else if (result.value.event.value === 'market-stake') {
		await updateMarketStakeEvent(1, event, result, daoContract, votingContract);
	} else if (result.value.event.value === 'resolve-market') {
		await updateResolveMarketEvent(1, event, result, daoContract, votingContract);
	} else if (result.value.event.value === 'resolve-market-undisputed') {
		await updateResolveMarketUndisputedEvent(1, event, result, daoContract, votingContract);
	} else if (result.value.event.value === 'resolve-market-vote') {
		await updateResolveMarketVoteEvent(1, event, result, daoContract, votingContract);
	} else if (result.value.event.value === 'dispute-resolution') {
		await updateDisputeResolutionEvent(1, event, result, daoContract, votingContract);
	} else if (result.value.event.value === 'transfer-losing-stakes') {
		await updateTransferStakeEvent(1, event, result, daoContract, votingContract);
	} else if (result.value.event.value === 'claim-winnings') {
		await updateClaimWinningsEvent(1, event, result, daoContract, votingContract);
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
