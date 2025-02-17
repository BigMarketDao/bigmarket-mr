/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import { cvToJSON, deserializeCV } from '@stacks/transactions';
import { ExtensionType, StoredOpinionPoll, PredictionMarketCreateEvent, PredictionMarketClaimEvent, PredictionMarketStakeEvent, ResolutionState, TokenPermissionEvent, getSip10Properties } from '@mijoco/stx_helpers/dist/index';
import { ObjectId } from 'mongodb';
import { getConfig } from '../../lib/config';
import { daoEventCollection } from '../../lib/data/db_models';
import { findUserEnteredPollByHash } from '../polling/polling_helper';
import { countCreateMarketEvents, fetchMarket, findPredictionContractEventByContractAndIndex } from './markets_helper';

export async function readPredictionEvents(genesis: boolean, daoContract: string, extensionContract: string) {
	console.log('readPredictionMarketEvents: extension contract ', extensionContract);
	//return;
	const url = getConfig().stacksApi + '/extended/v1/contract/' + extensionContract + '/events?limit=20';
	const extensions: Array<ExtensionType> = [];
	let currentOffset = 0;
	if (!genesis) {
		currentOffset = await countCreateMarketEvents();
	}
	let count = 0;
	let moreEvents = true;
	try {
		do {
			try {
				moreEvents = await resolvePredictionEvents(url, currentOffset, count, daoContract, extensionContract);
				count++;
			} catch (err: any) {
				console.log('readVotingEvents: ' + err.message);
			}
		} while (moreEvents);
	} catch (err) {
		console.log('readVotingEvents: error: ', err);
	}
	return extensions;
}

async function resolvePredictionEvents(url: string, currentOffset: number, count: number, daoContract: string, extensionContract: string): Promise<any> {
	let urlOffset = url + '&offset=' + (currentOffset + count * 20);
	const response = await fetch(urlOffset);
	const val = await response.json();
	console.log('resolvePredictionEvents: processing ' + url + ' events from ', val);

	if (!val || !val.results || typeof val.results !== 'object' || val.results.length === 0) {
		return false;
	}

	console.log('resolvePredicitonEvents: processing ' + (val?.results?.length || 0) + ' events from ' + extensionContract);
	//console.log('resolvePredictionEvents: val: ', val)
	for (const event of val.results) {
		const pdb = await findPredictionContractEventByContractAndIndex(extensionContract, Number(event.event_index), event.tx_id);
		if (!pdb) {
			try {
				processEvent(event, daoContract, extensionContract);
			} catch (err: any) {
				console.log('resolvePredictionEvents: ', err);
			}
		}
	}
	return val.results?.length > 0 || false;
}

async function processEvent(event: any, daoContract: string, votingContract: string) {
	const result = cvToJSON(deserializeCV(event.contract_log.value.hex));
	console.log('processEvent: allowed-token: ', result);

	console.log('processEvent: new event: ' + result.value.event.value + ' contract=' + event.event_index + ' / ' + event.tx_id, event);

	if (result.value.event.value === 'create-market') {
		let metadataHash = result.value['market-data-hash'].value;
		metadataHash = metadataHash.replace(/^0x/, '');
		const unhashedData: StoredOpinionPoll = await findUserEnteredPollByHash(metadataHash);
		const marketId = Number(result.value['market-id'].value);
		const marketType = Number(result.value['market-type'].value);
		const creator = result.value.creator.value;
		const marketFeeBips = result.value['market-fee-bips'].value;
		const token = result.value.token.value;
		const contractEvent = {
			_id: new ObjectId(),
			event: 'create-market',
			event_index: Number(event.event_index),
			txId: event.tx_id,
			daoContract,
			votingContract,
			marketId,
			metadataHash,
			marketType,
			creator,
			token,
			marketFeeBips,
			unhashedData,
			resolutionState: ResolutionState.RESOLUTION_OPEN
		} as PredictionMarketCreateEvent;
		//console.log("processEvent: contractEvent", contractEvent);
		await saveOrUpdateEvent(contractEvent);
	} else if (result.value.event.value === 'allowed-token') {
		console.log('allowed-token: ', result.value.event);
		const allowed = Boolean(result.value.enabled.value);
		const token = result.value.token.value;

		const contractEvent = {
			_id: new ObjectId(),
			event: 'allowed-token',
			event_index: Number(event.event_index),
			txId: event.tx_id,
			daoContract,
			votingContract,
			allowed,
			token
		} as TokenPermissionEvent;
		const sip10Data = await getSip10Properties(getConfig().stacksApi, contractEvent);
		contractEvent.sip10Data = sip10Data;
		await saveOrUpdateEvent(contractEvent);
		// (print {event: "market-stake", market-id: market-id, amount: amount, yes: yes, voter: tx-sender})
	} else if (result.value.event.value === 'market-stake') {
		const marketId = Number(result.value['market-id'].value);
		const marketType = Number(result.value['market-type'].value);
		const amount = Number(result.value.amount.value);
		const index = Number(result.value.index.value);
		const category = result.value.category.value;
		const voter = result.value.voter.value;
		// (, index: index, category: category, amount: amount-less-fee, voter: tx-sender})

		const contractEvent = {
			_id: new ObjectId(),
			event: 'market-stake',
			event_index: Number(event.event_index),
			txId: event.tx_id,
			daoContract,
			votingContract,
			marketId,
			marketType,
			amount,
			category,
			index,
			voter
		} as PredictionMarketStakeEvent;
		await saveOrUpdateEvent(contractEvent);
		// (print {event: "market-stake", market-id: market-id, amount: amount, yes: yes, voter: tx-sender})
	} else if (result.value.event.value === 'resolve-market') {
		const marketId = Number(result.value['market-id'].value);
		console.log('resolve-market: result.value.event: ', result.value);
		const createEvent = await fetchMarket(marketId);
		const outcome = Number(result.value.outcome.value);
		const category = result.value.category.value;
		const changes = {
			outcome,
			category,
			concluded: false,
			resolver: result.value.resolver.value,
			resolutionState: Number(result.value['resolution-state'].value)
		};
		if (!createEvent || changes.resolutionState < createEvent.resolutionState) return;
		await updateDaoEvent(createEvent._id, changes);
	} else if (result.value.event.value === 'resolve-market-undisputed') {
		const marketId = Number(result.value['market-id'].value);
		const createEvent = await fetchMarket(marketId);
		if (!createEvent) return;
		const changes = {
			concluded: true,
			resolutionBurnHeight: Number(result.value['resolution-burn-height'].value),
			resolutionState: Number(result.value['resolution-state'].value)
		};
		if (!createEvent || changes.resolutionState < createEvent.resolutionState) return;
		console.log('resolve-market-undisputed: changes: ' + createEvent._id, changes);
		await updateDaoEvent(createEvent._id, changes);
	} else if (result.value.event.value === 'resolve-market-vote') {
		const marketId = Number(result.value['market-id'].value);
		const createEvent = await fetchMarket(marketId);
		if (!createEvent) return;
		const changes = {
			concluded: true,
			outcome: Number(result.value.outcome.value),
			resolutionState: Number(result.value['resolution-state'].value),
			resolver: result.value.resolver.value
		};
		if (!createEvent || changes.resolutionState < createEvent.resolutionState) return;
		console.log('resolve-market-vote: changes: ' + createEvent._id, changes);
		await updateDaoEvent(createEvent._id, changes);
	} else if (result.value.event.value === 'dispute-resolution') {
		const marketId = Number(result.value['market-id'].value);
		const createEvent = await fetchMarket(marketId);
		if (!createEvent) return;
		const changes = {
			resolutionState: Number(result.value['resolution-state'].value),
			disputer: result.value.disputer.value
		};
		console.log('dispute-resolution: changes: ' + createEvent._id, changes);
		if (!createEvent || changes.resolutionState < createEvent.resolutionState) return;
		await updateDaoEvent(createEvent._id, changes);
	} else if (result.value.event.value === 'transfer-losing-stakes') {
		const marketId = Number(result.value['market-id'].value);
		const createEvent = await fetchMarket(marketId);
		if (!createEvent) return;
		const changes = {
			transferLosingStakes: Number(result.value.balance.value)
		};
		await updateDaoEvent(createEvent._id, changes);
	} else if (result.value.event.value === 'claim-winnings') {
		const marketId = Number(result.value['market-id'].value);
		const indexWon = Number(result.value['index-won'].value);
		const claimer = result.value.claimer.value;
		const userStake = Number(result.value['user-stake'].value);
		const userShare = Number(result.value['user-share'].value);
		const winningPool = Number(result.value['winning-pool'].value);
		const totalPool = Number(result.value['total-pool'].value);
		const daoFee = Number(result.value.daofee?.value);
		const marketFee = Number(result.value.marketfee?.value);

		const contractEvent = {
			_id: new ObjectId(),
			event: 'claim-winnings',
			event_index: Number(event.event_index),
			txId: event.tx_id,
			daoContract,
			votingContract,
			marketId,
			claimer,
			indexWon,
			userStake,
			userShare,
			winningPool,
			daoFee,
			marketFee,
			totalPool
		} as PredictionMarketClaimEvent;
		await saveOrUpdateEvent(contractEvent);
	} else {
		//console.log("processEvent: new event: ", event);
	}
}

async function saveOrUpdateEvent(contractEvent: PredictionMarketCreateEvent | PredictionMarketStakeEvent | PredictionMarketClaimEvent | TokenPermissionEvent) {
	let pdb;
	try {
		pdb = await findPredictionContractEventByContractAndIndex(contractEvent.votingContract, contractEvent.event_index, contractEvent.txId);
		if (pdb) {
			await updateDaoEvent(contractEvent._id!, contractEvent);
		} else {
			await saveDaoEvent(contractEvent);
		}
	} catch (err: any) {
		console.log('saveOrUpdateEvent: error1: ', pdb, err);
	}
}
async function saveDaoEvent(contractEvent: PredictionMarketCreateEvent | PredictionMarketStakeEvent | PredictionMarketClaimEvent | TokenPermissionEvent) {
	contractEvent._id = new ObjectId();
	const result = await daoEventCollection.insertOne(contractEvent);
	return result;
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
