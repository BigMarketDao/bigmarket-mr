/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import { cvToJSON, deserializeCV } from '@stacks/transactions';
import { PredictionMarketCreateEvent, PredictionMarketClaimEvent, PredictionMarketStakeEvent, TokenPermissionEvent, createBasicEvent, BasicEvent } from '@mijoco/stx_helpers/dist/index.js';
import { ObjectId } from 'mongodb';
import {
	findPredictionContractEventByContractAndIndex,
	updateAllowedTokensEvent,
	updateClaimWinningsEvent,
	updateDisputeResolutionEvent,
	updateMarketStakeEvent,
	updatePredictionMarketCreateEvent,
	updatePriceBandWidth,
	updateResolveMarketEvent,
	updateResolveMarketUndisputedEvent,
	updateResolveMarketVoteEvent,
	updateTransferStakeEvent
} from '../../../predictions/markets_helper.js';
import { daoEventCollection } from '../../../../lib/data/db_models.js';
import { saveDaoEvent } from '../dao_events_extension_helper.js';

// export async function readScalarEvents(genesis: boolean, daoContract: string, extensionContract: string) {
// 	// console.log('readPredictionMarketEvents: extension contract ', extensionContract);
// 	//return;
// 	const url = getConfig().stacksApi + '/extended/v1/contract/' + extensionContract + '/events?limit=20';
// 	const extensions: Array<ExtensionType> = [];
// 	let currentOffset = 0;
// 	if (!genesis) {
// 		currentOffset = await countCreateMarketEvents(2);
// 	}
// 	let count = 0;
// 	let moreEvents = true;
// 	try {
// 		do {
// 			try {
// 				moreEvents = await resolveScalarEvents(url, currentOffset, count, daoContract, extensionContract);
// 				count++;
// 			} catch (err: any) {
// 				console.log('readScalarEvents: error1: ' + err.message);
// 			}
// 		} while (moreEvents);
// 	} catch (err) {
// 		console.log('readScalarEvents: error2: ' + extensionContract, err);
// 	}
// 	return extensions;
// }

// async function resolveScalarEvents(url: string, currentOffset: number, count: number, daoContract: string, extensionContract: string): Promise<any> {
// 	let urlOffset = url + '&offset=' + (currentOffset + count * 20);
// 	const response = await fetch(urlOffset);
// 	const val = await response.json();
// 	// console.log('resolveScalarEvents: processing ' + url + ' events from ', val);

// 	if (!val || !val.results || typeof val.results !== 'object' || val.results.length === 0) {
// 		return false;
// 	}

// 	// console.log('readScalarEvents: processing ' + (val?.results?.length || 0) + ' events from ' + extensionContract);
// 	//console.log('resolveScalarEvents: val: ', val)
// 	for (const event of val.results) {
// 		const pdb = await findPredictionContractEventByContractAndIndex(extensionContract, Number(event.event_index), event.tx_id);
// 		if (!pdb) {
// 			try {
// 				processEvent(event, daoContract, extensionContract);
// 			} catch (err: any) {
// 				console.log('resolveScalarEvents: ', err);
// 			}
// 		} else {
// 			//console.log('resolveScalarEvents: found object: ', pdb);
// 		}
// 	}
// 	return val.results?.length > 0 || false;
// }

export async function processMarketPredicitonScalarEvent(basicEvent: BasicEvent, result: any) {
	if (result.value.event.value === 'create-market') {
		await updatePredictionMarketCreateEvent(2, result, basicEvent);
	} else if (result.value.event.value === 'allowed-token') {
		await updateAllowedTokensEvent(2, result, basicEvent);
	} else if (result.value.event.value === 'market-stake') {
		await updateMarketStakeEvent(2, result, basicEvent);
	} else if (result.value.event.value === 'resolve-market') {
		await updateResolveMarketEvent(2, result, basicEvent);
	} else if (result.value.event.value === 'resolve-market-undisputed') {
		await updateResolveMarketUndisputedEvent(2, result, basicEvent);
	} else if (result.value.event.value === 'resolve-market-vote') {
		await updateResolveMarketVoteEvent(2, result, basicEvent);
	} else if (result.value.event.value === 'dispute-resolution') {
		await updateDisputeResolutionEvent(2, result, basicEvent);
	} else if (result.value.event.value === 'transfer-losing-stakes') {
		await updateTransferStakeEvent(2, result, basicEvent);
	} else if (result.value.event.value === 'claim-winnings') {
		await updateClaimWinningsEvent(2, result, basicEvent);
	} else if (result.value.event.value === 'price-band-width') {
		await updatePriceBandWidth(2, result, basicEvent);
	} else {
		//console.log("processEvent: new event: ", event);
	}
}
//		(print {event: "price-band-width", feed-id: feed-id, precent: band-bips})

async function saveOrUpdateEvent(contractEvent: PredictionMarketCreateEvent | PredictionMarketStakeEvent | PredictionMarketClaimEvent | TokenPermissionEvent) {
	let pdb;
	try {
		pdb = await findPredictionContractEventByContractAndIndex(contractEvent.extension, contractEvent.event_index, contractEvent.txId);
		if (pdb) {
			await updateDaoEvent(new ObjectId(contractEvent._id), contractEvent);
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
