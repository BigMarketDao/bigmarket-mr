/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import { ObjectId } from 'mongodb';
import { daoEventCollection } from '../../../../lib/data/db_models.js';
import { findVotingContractEventByContractAndIndex, saveDaoEvent } from '../dao_events_extension_helper.js';
import {
	BasicEvent,
	MarketContractHedgeEvent,
	MultipliersHedgeEvent,
	PerformCustomHedgeEvent,
	PerformSwapHedgeEvent,
	ScalarContractHedgeEvent,
	SwapTokenPairHedgeEvent,
	TokenSaleAdvanceStageEvent,
	TokenSaleCancelStageEvent,
	TokenSalePurchaseEvent,
	TokenSaleRefundEvent
} from '@bigmarket/bm-types';

export async function processHedgeStrategyEvents(basicEvent: BasicEvent, result: any) {
	if (result.value.event.value === 'perform-custom-hedge') {
		const contractEvent: PerformCustomHedgeEvent = {
			...basicEvent,
			marketId: Number(result.value.epoch.value),
			predictedIndex: Number(result.value['predicted-index'].value)
		} as PerformCustomHedgeEvent;
		await saveOrUpdateEvent(contractEvent);
		return contractEvent;
	} else if (result.value.event.value === 'perform-swap-hedge') {
		const contractEvent: PerformSwapHedgeEvent = {
			...basicEvent,
			marketId: Number(result.value.epoch.value),
			predictedIndex: Number(result.value['predicted-index'].value),
			feedId: result.value['feed-id'].value
		} as PerformSwapHedgeEvent;
		await saveOrUpdateEvent(contractEvent);
		return contractEvent;
	} else if (result.value.event.value === 'swap-token-pair') {
		const contractEvent: SwapTokenPairHedgeEvent = {
			...basicEvent,
			marketId: Number(result.value.epoch.value),
			predictedIndex: Number(result.value['predicted-index'].value),
			feedId: result.value['feed-id'].value,
			tokenIn: result.value['token-in'].value,
			tokenOut: result.value['token-out'].value,
			token0: result.value['token0'].value,
			token1: result.value['token1'].value
		} as SwapTokenPairHedgeEvent;
		await saveOrUpdateEvent(contractEvent);
		return contractEvent;
	} else if (result.value.event.value === 'hedge-scalar-contract') {
		const contractEvent: ScalarContractHedgeEvent = {
			...basicEvent,
			marketContract: result.value['market-contract'].value
		} as ScalarContractHedgeEvent;
		await saveOrUpdateEvent(contractEvent);
		return contractEvent;
	} else if (result.value.event.value === 'hedge-market-contract') {
		const contractEvent: MarketContractHedgeEvent = {
			...basicEvent,
			marketContract: result.value['market-contract'].value
		} as MarketContractHedgeEvent;
		await saveOrUpdateEvent(contractEvent);
		return contractEvent;
	} else if (result.value.event.value === 'hedge-multipliers') {
		const contractEvent: MultipliersHedgeEvent = {
			...basicEvent,
			multipliers: result.value['multipliers'].value
		} as MultipliersHedgeEvent;
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
