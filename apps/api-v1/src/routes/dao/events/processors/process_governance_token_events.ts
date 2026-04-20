/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import { cvToJSON, deserializeCV } from '@stacks/transactions';
import { ObjectId } from 'mongodb';
import { daoEventCollection } from '../../../../lib/data/db_models.js';
import { findVotingContractEventByContractAndIndex, saveDaoEvent } from '../dao_events_extension_helper.js';
import { BasicEvent, createBasicEvent, GovernanceTokenCoreClaimEvent, GovernanceTokenCoreVestingEvent } from '@mijoco/stx_helpers/dist/index.js';

// (print {event: "set-core-team-vesting", amount: amount, start-block: (get start-block item), duration: (get duration item), current-key: (var-get current-key)})
// (print {event: "core-claim", claimed: claimed, recipient: tx-sender, claimable: claimable, elapsed: elapsed, vested: vested})

export async function processGovernanceTokenEvent(basicEvent: BasicEvent, result: any) {
	if (result.value.event.value === 'set-core-team-vesting') {
		const contractEvent: GovernanceTokenCoreVestingEvent = {
			...basicEvent,
			amount: Number(result.value.amount.value),
			startBlock: Number(result.value['start-block'].value),
			currentKey: Number(result.value['current-key'].value),
			duration: Number(result.value.duration.value)
		} as GovernanceTokenCoreVestingEvent;
		await saveOrUpdateEvent(contractEvent);
		return contractEvent;
	} else if (result.value.event.value === 'core-claim') {
		const contractEvent: GovernanceTokenCoreClaimEvent = {
			...basicEvent,
			recipient: result.value.recipient.value,
			claimed: Number(result.value.claimed.value),
			claimable: Number(result.value.claimable.value),
			elapsed: Number(result.value.elapsed.value),
			vested: Number(result.value.vested.value)
		} as GovernanceTokenCoreClaimEvent;
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

export async function getClaims(proposal: string): Promise<Array<GovernanceTokenCoreClaimEvent>> {
	const result = await daoEventCollection.find({ proposal, event: 'core-claim' }).toArray();
	return result as unknown as Array<GovernanceTokenCoreClaimEvent>;
}

export async function getCoreVestings(proposal: string): Promise<Array<GovernanceTokenCoreVestingEvent>> {
	const result = await daoEventCollection.find({ proposal, event: 'set-core-team-vesting' }).toArray();
	return result as unknown as Array<GovernanceTokenCoreVestingEvent>;
}

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
