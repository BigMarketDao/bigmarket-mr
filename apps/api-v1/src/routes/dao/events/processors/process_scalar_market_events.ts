/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import { BasicEvent } from '@mijoco/stx_helpers/dist/index.js';
import {
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

export async function processMarketPredicitonScalarEvent(basicEvent: BasicEvent, result: any) {
	let event;
	if (result.value.event.value === 'create-market') {
		event = await updatePredictionMarketCreateEvent(2, result, basicEvent);
	} else if (result.value.event.value === 'allowed-token') {
		event = await updateAllowedTokensEvent(2, result, basicEvent);
	} else if (result.value.event.value === 'market-stake') {
		event = await updateMarketStakeEvent(2, result, basicEvent);
	} else if (result.value.event.value === 'resolve-market') {
		event = await updateResolveMarketEvent(2, result, basicEvent);
	} else if (result.value.event.value === 'resolve-market-undisputed') {
		event = await updateResolveMarketUndisputedEvent(2, result, basicEvent);
	} else if (result.value.event.value === 'resolve-market-vote') {
		event = await updateResolveMarketVoteEvent(2, result, basicEvent);
	} else if (result.value.event.value === 'dispute-resolution') {
		event = await updateDisputeResolutionEvent(2, result, basicEvent);
	} else if (result.value.event.value === 'transfer-losing-stakes') {
		event = await updateTransferStakeEvent(2, result, basicEvent);
	} else if (result.value.event.value === 'claim-winnings') {
		event = await updateClaimWinningsEvent(2, result, basicEvent);
	} else if (result.value.event.value === 'price-band-width') {
		event = await updatePriceBandWidth(2, result, basicEvent);
	} else {
		//console.log("processEvent: new event: ", event);
	}
	return event;
}
