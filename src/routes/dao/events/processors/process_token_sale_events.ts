/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import { cvToJSON, deserializeCV } from '@stacks/transactions';
import { ObjectId } from 'mongodb';
import { daoEventCollection } from '../../../../lib/data/db_models.js';
import { findVotingContractEventByContractAndIndex, saveDaoEvent } from '../dao_events_extension_helper.js';
import { BasicEvent, createBasicEvent, TokenSaleAdvanceStageEvent, TokenSaleCancelStageEvent, TokenSaleInitialisationEvent, TokenSalePurchaseEvent, TokenSaleRefundEvent } from '@mijoco/stx_helpers/dist/index.js';

// (print {event: "ido-refund", buyer: tx-sender, refunded: purchase-amount, stage: stage})
// (print {event: "cancel-ido-stage", stage: stage})
// (print {event: "ido-stage-advanced", new-stage: (var-get current-stage), burn-start: burn-block-height})
// (print {event: "ido-purchase", buyer: tx-sender, stage: stage, tokens: tokens-to-buy})
// (print {event: "ido-initialized"})

export async function processTokenSaleEvent(basicEvent: BasicEvent, result: any) {
	if (result.value.event.value === 'ido-refund') {
		const contractEvent: TokenSaleRefundEvent = {
			...basicEvent,
			buyer: result.value.buyer.value,
			refunded: Number(result.value.refunded.value),
			stage: Number(result.value.stage.value)
		} as TokenSaleRefundEvent;
		await saveOrUpdateEvent(contractEvent);
		return contractEvent;
	} else if (result.value.event.value === 'cancel-ido-stage') {
		const contractEvent: TokenSaleCancelStageEvent = {
			...basicEvent,
			buyer: result.value.buyer.value,
			refunded: Number(result.value.refunded.value),
			stage: Number(result.value.stage.value)
		} as TokenSaleCancelStageEvent;
		await saveOrUpdateEvent(contractEvent);
		return contractEvent;
	} else if (result.value.event.value === 'ido-stage-advanced') {
		const contractEvent: TokenSaleAdvanceStageEvent = {
			...basicEvent,
			newStage: Number(result.value['new-stage'].value),
			burnStart: Number(result.value['burn-start'].value)
		} as TokenSaleAdvanceStageEvent;
		await saveOrUpdateEvent(contractEvent);
		return contractEvent;
	} else if (result.value.event.value === 'ido-purchase') {
		const contractEvent: TokenSalePurchaseEvent = {
			...basicEvent,
			buyer: result.value.buyer.value,
			tokens: Number(result.value.tokens.value),
			stage: Number(result.value.stage.value),
			stxAmount: Number(result.value['stx-amount']?.value || '0')
		} as TokenSalePurchaseEvent;
		await saveOrUpdateEvent(contractEvent);
		return contractEvent;
	} else if (result.value.event.value === 'ido-initialized') {
		const contractEvent: TokenSaleInitialisationEvent = {
			...basicEvent
		} as TokenSaleInitialisationEvent;
		await saveOrUpdateEvent(contractEvent);
		return contractEvent;
	} else {
		//console.log("processEvent: new event: ", event);
	}
}

// Mongo collection methods
export async function countAllEvents(): Promise<number> {
	try {
		const result = await daoEventCollection.countDocuments();
		return Number(result);
	} catch (err: any) {
		return 0;
	}
}

export async function countVotes(proposal: string): Promise<number> {
	try {
		const result = await daoEventCollection.countDocuments({
			proposal,
			event: 'vote'
		});
		return Number(result);
	} catch (err: any) {
		return 0;
	}
}

export async function getPurcahses(proposal: string): Promise<Array<TokenSalePurchaseEvent>> {
	const result = await daoEventCollection.find({ proposal, event: 'ido-purchase' }).toArray();
	return result as unknown as Array<TokenSalePurchaseEvent>;
}

export async function getStageAdvancements(proposal: string): Promise<Array<TokenSaleAdvanceStageEvent>> {
	const result = await daoEventCollection.find({ proposal, event: 'ido-stage-advanced' }).toArray();
	return result as unknown as Array<TokenSaleAdvanceStageEvent>;
}

export async function getStageCancellations(proposal: string): Promise<Array<TokenSaleCancelStageEvent>> {
	const result = await daoEventCollection.find({ proposal, event: 'cancel-ido-stage' }).toArray();
	return result as unknown as Array<TokenSaleCancelStageEvent>;
}

export async function getRefunds(proposal: string): Promise<Array<TokenSaleRefundEvent>> {
	const result = await daoEventCollection.find({ proposal, event: 'ido-refund' }).toArray();
	return result as unknown as Array<TokenSaleRefundEvent>;
}

/**
 * Proposal methods
 */

export async function findVotingContractEventByTxIdAndEventIndex(event_index: number, txId: string): Promise<any> {
	const result = await daoEventCollection.findOne({
		event_index,
		txId
	});
	return result;
}

async function saveOrUpdateEvent(contractEvent: BasicEvent) {
	try {
		const pdb = await findVotingContractEventByContractAndIndex(contractEvent.event_index, contractEvent.txId);
		if (!pdb) {
			await saveDaoEvent(contractEvent);
		}
	} catch (err: any) {
		console.log('saveOrUpdateEvent: error2: ', err);
	}
}

async function updateDaoEvent(_id: ObjectId, changes: BasicEvent) {
	const result = await daoEventCollection.updateOne(
		{
			_id
		},
		{ $set: changes }
	);
	return result;
}
