/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import { ObjectId } from 'mongodb';
import { daoEventCollection } from '../../../../lib/data/db_models.js';
import { findVotingContractEventByContractAndIndex, saveDaoEvent } from '../dao_events_extension_helper.js';
import {
	BasicEvent,
	createBasicEvent,
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

// (print { event: "big-claim-batch", user: user, epoch: epoch, amount: share, reward-per-epoch: (var-get reward-per-epoch) })
// (print { event: "big-claim", user: user, epoch: epoch, amount: share, reward-per-epoch: (var-get reward-per-epoch) })
// (print { event: "sft_mint", token-id: token-id, amount: amount, recipient: recipient })
// (print { event: "sft_burn", token-id: token-id, amount: amount, sender: owner })
// (print { event: "sft_transfer", token-id: token-id, amount: amount, sender: sender, recipient: recipient })

export async function processReputationEvents(basicEvent: BasicEvent, result: any) {
	if (result.value.event.value === 'big-claim-batch') {
		const contractEvent: ReputationBigClaimEvent = {
			...basicEvent,
			batched: true,
			user: result.value.user.value,
			epoch: Number(result.value.epoch.value),
			amount: Number(result.value.amount.value),
			rewardPerEpoch: Number(result.value['reward-per-epoch'].value)
		} as ReputationBigClaimEvent;
		await saveOrUpdateEvent(contractEvent);
	} else if (result.value.event.value === 'set-tier-weight') {
		//    (print { event: "set-tier-weight", token-id: token-id, weight: weight })
		const contractEvent: ReputationSetTierEvent = {
			...basicEvent,
			weight: Number(result.value.weight.value),
			tokenId: Number(result.value['token-id'].value)
		} as ReputationSetTierEvent;
		await saveOrUpdateEvent(contractEvent);
	} else if (result.value.event.value === 'big-claim') {
		const contractEvent: ReputationBigClaimEvent = {
			...basicEvent,
			batched: false,
			user: result.value.user.value,
			epoch: Number(result.value.epoch.value),
			amount: Number(result.value.amount.value),
			rewardPerEpoch: Number(result.value['reward-per-epoch'].value)
		} as ReputationBigClaimEvent;
		await saveOrUpdateEvent(contractEvent);
	} else if (result.value.event.value === 'sft_mint') {
		const contractEvent: ReputationSftMintEvent = {
			...basicEvent,
			recipient: result.value.recipient.value,
			amount: Number(result.value.amount.value),
			tokenId: Number(result.value['token-id'].value)
		} as ReputationSftMintEvent;
		await saveOrUpdateEvent(contractEvent);
	} else if (result.value.event.value === 'sft_burn') {
		const contractEvent: ReputationSftBurnEvent = {
			...basicEvent,
			sender: result.value.sender.value,
			amount: Number(result.value.amount.value),
			tokenId: Number(result.value['token-id'].value)
		} as ReputationSftBurnEvent;
		await saveOrUpdateEvent(contractEvent);
	} else if (result.value.event.value === 'sft_transfer') {
		const contractEvent: ReputationSftTransferEvent = {
			...basicEvent,
			recipient: result.value.recipient.value,
			sender: result.value.sender.value,
			amount: Number(result.value.amount.value),
			tokenId: Number(result.value['token-id'].value)
		} as ReputationSftTransferEvent;
		await saveOrUpdateEvent(contractEvent);
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
