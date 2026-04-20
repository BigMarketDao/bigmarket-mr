/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import { ObjectId } from 'mongodb';
import { daoEventCollection } from '../../../../lib/data/db_models.js';
import { findVotingContractEventByContractAndIndex, saveDaoEvent } from '../dao_events_extension_helper.js';
import {
	BasicEvent,
	createBasicEvent,
	LiquidityContributionEvent,
	ReputationBigClaimEvent,
	ReputationSftBurnEvent,
	ReputationSftMintEvent,
	ReputationSftTransferEvent,
	TokenSaleAdvanceStageEvent,
	TokenSaleCancelStageEvent,
	TokenSaleInitialisationEvent,
	TokenSalePurchaseEvent,
	TokenSaleRefundEvent
} from '@mijoco/stx_helpers/dist/index.js';

// (print {type: "liquidity_contribution", from: user, amount: amount, bigr: bigr-earned})

export async function processLiquidityContributionEvents(basicEvent: BasicEvent, result: any) {
	if (result.value.event.value === 'liquidity_contribution') {
		const contractEvent: LiquidityContributionEvent = {
			...basicEvent,
			from: result.value.from.value,
			amount: Number(result.value.amount.value),
			bigr: Number(result.value['bigr'].value)
		} as LiquidityContributionEvent;
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
