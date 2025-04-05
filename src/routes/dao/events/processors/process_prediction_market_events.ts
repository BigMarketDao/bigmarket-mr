/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import { cvToJSON, deserializeCV } from '@stacks/transactions';
import { PredictionMarketCreateEvent, PredictionMarketClaimEvent, PredictionMarketStakeEvent, TokenPermissionEvent, createBasicEvent, BasicEvent } from '@mijoco/stx_helpers/dist/index.js';
import { ObjectId } from 'mongodb';
import { daoEventCollection } from '../../../../lib/data/db_models.js';
import {
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
} from '../../../predictions/markets_helper.js';
import { saveDaoEvent } from '../dao_events_extension_helper.js';

// export async function readPredictionEvents(genesis: boolean, daoContract: string, extensionContract: string) {
// 	// console.log('readPredictionMarketEvents: extension contract ', extensionContract);
// 	//return;
// 	const url = getConfig().stacksApi + '/extended/v1/contract/' + extensionContract + '/events?limit=20';
// 	const extensions: Array<ExtensionType> = [];
// 	let currentOffset = 0;
// 	if (!genesis) {
// 		currentOffset = await countCreateMarketEvents(1);
// 	}
// 	let count = 0;
// 	let moreEvents = true;
// 	try {
// 		do {
// 			try {
// 				moreEvents = await resolvePredictionEvents(url, currentOffset, count, daoContract, extensionContract);
// 				count++;
// 			} catch (err: any) {
// 				console.log('readPredictionEvents: error 1: ' + extensionContract + err.message);
// 			}
// 		} while (moreEvents);
// 	} catch (err) {
// 		console.log('readPredictionEvents: error 2: ' + extensionContract, err);
// 	}
// 	return extensions;
// }

// async function resolvePredictionEvents(url: string, currentOffset: number, count: number, daoContract: string, extensionContract: string): Promise<any> {
// 	let urlOffset = url + '&offset=' + (currentOffset + count * 20);
// 	const response = await fetch(urlOffset);
// 	const val = await response.json();

// 	if (!val || !val.results || typeof val.results !== 'object' || val.results.length === 0) {
// 		return false;
// 	}

// 	// console.log('resolvePredicitonEvents: processing ' + (val?.results?.length || 0) + ' events from ' + extensionContract);
// 	//console.log('resolvePredictionEvents: val: ', val)
// 	for (const event of val.results) {
// 		const pdb = await findPredictionContractEventByContractAndIndex(extensionContract, Number(event.event_index), event.tx_id);
// 		if (!pdb) {
// 			try {
// 				processEvent(event, daoContract, extensionContract);
// 			} catch (err: any) {
// 				console.log('resolvePredictionEvents: ', err);
// 			}
// 		}
// 	}
// 	return val.results?.length > 0 || false;
// }

export async function processMarketPredicitonCategoricalEvent(basicEvent: BasicEvent, result: any) {
	if (result.value.event.value === 'create-market') {
		await updatePredictionMarketCreateEvent(1, result, basicEvent);
	} else if (result.value.event.value === 'allowed-token') {
		await updateAllowedTokensEvent(1, result, basicEvent);
	} else if (result.value.event.value === 'market-stake') {
		await updateMarketStakeEvent(1, result, basicEvent);
	} else if (result.value.event.value === 'resolve-market') {
		await updateResolveMarketEvent(1, result, basicEvent);
	} else if (result.value.event.value === 'resolve-market-undisputed') {
		await updateResolveMarketUndisputedEvent(1, result, basicEvent);
	} else if (result.value.event.value === 'resolve-market-vote') {
		await updateResolveMarketVoteEvent(1, result, basicEvent);
	} else if (result.value.event.value === 'dispute-resolution') {
		await updateDisputeResolutionEvent(1, result, basicEvent);
	} else if (result.value.event.value === 'transfer-losing-stakes') {
		await updateTransferStakeEvent(1, result, basicEvent);
	} else if (result.value.event.value === 'claim-winnings') {
		await updateClaimWinningsEvent(1, result, basicEvent);
	} else {
		//console.log("processEvent: new event: ", event);
	}
}
