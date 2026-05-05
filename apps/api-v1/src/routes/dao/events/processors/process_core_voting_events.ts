/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import { ObjectId } from 'mongodb';
import { daoEventCollection } from '../../../../lib/data/db_models.js';
import { BasicEvent, createBasicEvent, getTransaction, ProposalContract, VotingEventConcludeProposal, VotingEventProposeProposal, VotingEventVoteOnProposal } from '@mijoco/stx_helpers/dist/index.js';
import { getMetaData, getProposalContractSource, getProposalData } from '../../proposals/proposal.js';
import { getConfig } from '../../../../lib/config.js';
import { findVotingContractEventByContractAndIndex, saveDaoEvent } from '../dao_events_extension_helper.js';

// (print {event: "set-core-team-member", who: who, member: member})

export async function processCoreVotingEvent(basicEvent: BasicEvent, result: any) {
	if (result.value.event.value === 'propose') {
		const proposal = result.value.proposal.value;

		let contract: ProposalContract = await getProposalContractSource(proposal);
		const contractEvent = {
			...basicEvent,
			submissionContract: await getSubmissionContract(basicEvent.txId),
			proposal,
			proposalMeta: getMetaData(contract.source),
			contract,
			proposalData: await getProposalData(basicEvent.extension, proposal),
			proposer: result.value.proposer.value
		} as VotingEventProposeProposal;
		await saveOrUpdateEvent(contractEvent);
		return contractEvent;
	} else if (result.value.event.value === 'reclaim-votes') {
		//		(print {event: "reclaim-votes", proposal: reclaim-proposal, votes: votes, voter: tx-sender})
		const contractEvent = {
			...basicEvent,
			proposal: result.value.proposal.value,
			voter: result.value.voter.value,
			votes: Number(result.value.votes.value)
		};
		await saveOrUpdateEvent(contractEvent);
		return contractEvent;
	} else if (result.value.event.value === 'vote') {
		const contractEvent = {
			...basicEvent,
			proposal: result.value.proposal.value,
			sip18: result.value.sip18?.value,
			voter: result.value.voter.value,
			for: result.value.for.value,
			amount: Number(result.value.amount.value)
		} as VotingEventVoteOnProposal;
		await saveOrUpdateEvent(contractEvent);
		return contractEvent;
	} else if (result.value.event.value === 'conclude') {
		const proposal = result.value.proposal.value;
		let contract: ProposalContract = await getProposalContractSource(proposal);
		const contractEvent = {
			...basicEvent,
			proposal,
			passed: Boolean(result.value.passed.value),
			proposalMeta: getMetaData(contract.source),
			contract,
			proposalData: await getProposalData(basicEvent.extension, proposal)
		} as VotingEventConcludeProposal;
		await saveOrUpdateEvent(contractEvent);
		return contractEvent;
	} else {
		console.log('processEvent: new processCoreVotingEvent: ', result);
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

async function getSubmissionContract(txId: string): Promise<string> {
	const fundingTx = await getTransaction(getConfig().stacksApi, txId, getConfig().stacksHiroKey);
	return fundingTx.contract_call.contract_id;
}

/**
 * Vote methods
 */
export async function getVotesByProposal(proposal: string): Promise<any> {
	const result = await daoEventCollection.find({ proposal, event: 'vote' }).toArray();
	return result;
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
async function updateDaoEvent(_id: ObjectId, changes: any) {
	if (!changes || Object.keys(changes).length === 0) {
		throw new Error('Changes object is empty or invalid.');
	}

	const result = await daoEventCollection.updateOne(
		{
			_id
		},
		{ $set: changes },
		{ writeConcern: { w: 'majority' } }
	);
	if (result.matchedCount === 0) {
		throw new Error(`No document found with _id: ${_id}`);
	}

	return result;
}
