/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import { cvToJSON, deserializeCV } from '@stacks/transactions';
import { ObjectId } from 'mongodb';
import { daoEventCollection } from '../../../../lib/data/db_models.js';
import { findVotingContractEventByContractAndIndex, saveDaoEvent } from '../dao_events_extension_helper.js';
import { BasicEvent, CorePorposalsSetTeamMemberEvent, createBasicEvent } from '@mijoco/stx_helpers/dist/index.js';

// (print {event: "set-core-team-member", who: who, member: member})

export async function processCoreProposalsEvent(basicEvent: BasicEvent, result: any) {
	if (result.value.event.value === 'set-core-team-member') {
		const contractEvent: CorePorposalsSetTeamMemberEvent = {
			...basicEvent,
			who: result.value.who.value,
			member: Boolean(result.value.member.value)
		} as CorePorposalsSetTeamMemberEvent;
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

export async function getCorePorposalsClaimEvent(proposal: string): Promise<Array<CorePorposalsSetTeamMemberEvent>> {
	const result = await daoEventCollection.find({ proposal, event: 'set-core-team-member' }).toArray();
	return result as unknown as Array<CorePorposalsSetTeamMemberEvent>;
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
