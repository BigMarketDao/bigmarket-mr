/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import { ObjectId } from 'mongodb';
import { daoEventCollection } from '../../../../lib/data/db_models.js';
import { findVotingContractEventByContractAndIndex, saveDaoEvent } from '../dao_events_extension_helper.js';
import { BasicEvent } from '@bigmarket/bm-types';

export async function processVaultEvents(basicEvent: BasicEvent, result: any) {
	if (result.value.event.value === 'set-tier-weight') {
		//    (print { event: "set-tier-weight", token-id: token-id, weight: weight })
		//console.log('processReputationEvents: set-tier-weight: ', result.value);
		// const contractEvent: ReputationSetTierEvent = {
		// 	...basicEvent,
		// 	weight: Number(result.value?.weight?.value || 0),
		// 	tokenId: Number(result.value?.['token-id']?.value || 0)
		// } as ReputationSetTierEvent;
		// await saveOrUpdateEvent(contractEvent);
		// return contractEvent;
	} else if (result.value.event.value === 'big-claim') {
	} else if (result.value.event.value === 'sft_mint') {
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
