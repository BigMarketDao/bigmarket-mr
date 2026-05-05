/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import { ObjectId } from 'mongodb';
import { daoEventCollection } from '../../../../lib/data/db_models.js';
import { findVotingContractEventByContractAndIndex, saveDaoEvent } from '../dao_events_extension_helper.js';
import { BasicEvent, ReputationBigClaimEvent, ReputationSetTierEvent, ReputationSftBurnEvent, ReputationSftMintEvent, ReputationSftTransferEvent, TokenSaleCancelStageEvent, TokenSaleRefundEvent } from '@bigmarket/bm-types';

// (print { event: "big-claim-batch", user: user, epoch: epoch, amount: share, reward-per-epoch: (var-get reward-per-epoch) })
// (print { event: "big-claim", user: user, epoch: epoch, amount: share, reward-per-epoch: (var-get reward-per-epoch) })
// (print { event: "sft_mint", token-id: token-id, amount: amount, recipient: recipient })
// (print { event: "sft_burn", token-id: token-id, amount: amount, sender: owner })
// (print { event: "sft_transfer", token-id: token-id, amount: amount, sender: sender, recipient: recipient })

export async function processReputationEvents(basicEvent: BasicEvent, result: any) {
	if (result.value.event.value === 'set-tier-weight') {
		//    (print { event: "set-tier-weight", token-id: token-id, weight: weight })
		//console.log('processReputationEvents: set-tier-weight: ', result.value);
		const contractEvent: ReputationSetTierEvent = {
			...basicEvent,
			weight: Number(result.value?.weight?.value || 0),
			tokenId: Number(result.value?.['token-id']?.value || 0)
		} as ReputationSetTierEvent;
		await saveOrUpdateEvent(contractEvent);
		return contractEvent;
	} else if (result.value.event.value === 'big-claim') {
		//(print { event: "big-claim", user: user, epoch: epoch, claim-epoch: new-last-claim, epochs-paid: epochs-to-pay, rep: rep, total: total, share: total-share, reward-per-epoch: (var-get reward-per-epoch) })
		console.log('processReputationEvents: big-claim: ', result.value);
		const contractEvent: ReputationBigClaimEvent = {
			...basicEvent,
			batched: false,
			user: result.value?.user?.value,
			epoch: Number(result.value?.epoch?.value),
			claimEpoch: Number(result.value?.['claim-epoch']?.value || 0),
			epochsPaid: Number(result.value?.['epochs-paid']?.value || 0),
			reputation: Number(result.value?.rep?.value || 0),
			total: Number(result.value?.total?.value || 0),
			share: Number(result.value?.share?.value || 0),
			amount: Number(result.value?.amount?.value || 0),
			rewardPerEpoch: Number(result.value?.['reward-per-epoch']?.value || 0)
		} as ReputationBigClaimEvent;
		await saveOrUpdateEvent(contractEvent);
		return contractEvent;
	} else if (result.value.event.value === 'sft_mint') {
		const contractEvent: ReputationSftMintEvent = {
			...basicEvent,
			recipient: result.value.recipient.value,
			amount: Number(result.value.amount.value),
			tokenId: Number(result.value['token-id'].value)
		} as ReputationSftMintEvent;
		await saveOrUpdateEvent(contractEvent);
		return contractEvent;
	} else if (result.value?.event?.value === 'sft_burn') {
		const contractEvent: ReputationSftBurnEvent = {
			...basicEvent,
			sender: result.value.sender.value,
			amount: Number(result.value.amount.value),
			tokenId: Number(result.value['token-id'].value)
		} as ReputationSftBurnEvent;
		await saveOrUpdateEvent(contractEvent);
		return contractEvent;
	} else if (result.value.event.value === 'sft_transfer') {
		const contractEvent: ReputationSftTransferEvent = {
			...basicEvent,
			recipient: result.value.recipient.value,
			sender: result.value.sender.value,
			amount: Number(result.value.amount.value),
			tokenId: Number(result.value['token-id'].value)
		} as ReputationSftTransferEvent;
		await saveOrUpdateEvent(contractEvent);
		return contractEvent;
	} else {
		console.log('processEvent: new processReputationEvents: ', result);
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
