/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import { cvToJSON, deserializeCV } from '@stacks/transactions';
import { ObjectId } from 'mongodb';
import { daoEventCollection } from '../../../../lib/data/db_models.js';
import { findVotingContractEventByContractAndIndex, saveDaoEvent } from '../dao_events_extension_helper.js';
import { BasicEvent, createBasicEvent, MarketVotingConcludeEvent, MarketVotingCreateEvent, MarketVotingVoteEvent } from '@mijoco/stx_helpers/dist/index.js';
import { findPollByMarketId } from '../../../polling/polling_helper.js';
import assert from 'assert';

// (print {event: "create-market-vote", market-id: market-id, proposer: tx-sender})
// (print {event: "market-vote", market-id: market-id, voter: voter, category-for: category-for, sip18: sip18, amount: amount, prev-market-id: prev-market-id})
// (print {event: "conclude-market-vote", market-id: market-id, winning-category: winning-category, result: result})

export async function processMarketVotingEvent(basicEvent: BasicEvent, result: any) {
	if (result.value.event.value === 'create-market-vote') {
		const contractEvent: MarketVotingCreateEvent = {
			...basicEvent,
			marketId: Number(result.value['market-id'].value),
			market: result.value.market.value,
			proposer: result.value.proposer.value
		} as MarketVotingCreateEvent;
		await saveOrUpdateEvent(contractEvent);
	} else if (result.value.event.value === 'market-vote') {
		const contractEvent: MarketVotingVoteEvent = {
			...basicEvent,
			marketId: Number(result.value['market-id'].value),
			voter: result.value.voter.value,
			categoryFor: Number(result.value['category-for'].value),
			sip18: Boolean(result.value['sip18'].value),
			amount: Number(result.value['amount'].value),
			prevMarketId: Number(result.value['prev-market-id'].value)
		} as MarketVotingVoteEvent;
		await saveOrUpdateEvent(contractEvent);
	} else if (result.value.event.value === 'conclude-market-vote') {
		const marketId = Number(result.value['market-id'].value);

		const contractEvent: MarketVotingConcludeEvent = {
			...basicEvent,
			marketId,
			winningCategory: Number(result.value['winning-category'].value),
			result: Boolean(result.value['result'].value)
		} as MarketVotingConcludeEvent;
		await saveOrUpdateEvent(contractEvent);

		const marketPoll = await findPollByMarketId(marketId);
		if (!marketPoll) return;
		assert(marketPoll.marketId === Number(result.value['market-id'].value), 'wrong market?');
		marketPoll.marketId = Number(result.value['market-id'].value);
		marketPoll.winningCategory = Number(result.value['winning-category'].value);
		marketPoll.concludeTxId = basicEvent.txId;
		await updateDaoEvent(new ObjectId(marketPoll._id), marketPoll);
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

export async function getMarketVotingCreateEvents(proposal: string): Promise<Array<MarketVotingCreateEvent>> {
	const result = await daoEventCollection.find({ proposal, event: 'create-market-vote' }).toArray();
	return result as unknown as Array<MarketVotingCreateEvent>;
}

export async function getMarketVotingVoteEvents(proposal: string): Promise<Array<MarketVotingVoteEvent>> {
	const result = await daoEventCollection.find({ proposal, event: 'market-vote' }).toArray();
	return result as unknown as Array<MarketVotingVoteEvent>;
}

export async function getMarketVotingConcludeEvents(proposal: string): Promise<Array<MarketVotingConcludeEvent>> {
	const result = await daoEventCollection.find({ proposal, event: 'conclude-market-vote' }).toArray();
	return result as unknown as Array<MarketVotingConcludeEvent>;
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
