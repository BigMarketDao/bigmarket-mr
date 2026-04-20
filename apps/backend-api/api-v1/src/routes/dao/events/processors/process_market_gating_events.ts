/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import { cvToJSON, deserializeCV } from '@stacks/transactions';
import { ObjectId } from 'mongodb';
import { daoEventCollection } from '../../../../lib/data/db_models.js';
import { findVotingContractEventByContractAndIndex, saveDaoEvent } from '../dao_events_extension_helper.js';
import { BasicEvent, createBasicEvent, MarketGatingAccessByAccountEvent, MarketGatingUpdateRootByPrincipalEvent, MarketGatingUpdateRootEvent } from '@mijoco/stx_helpers/dist/index.js';

// (print {event: "can-access-by-account", contract-key: contract-key, contract-name: contract-name, root: root, leaf: leaf, sender: sender, txsender: tx-sender, proof-valid: proof-valid})
// (print {event: "merkle-root", hashed-id: hashed-id, merkle-root: (map-get? merkle-roots hashed-id)})
// (print {event: "set-merkle-root-by-principal", contract-id: contract-id, contract-name: contract-name, contract-key: contract-key, merkle-root: (map-get? merkle-roots contract-key)})

export async function processMarketGatingEvent(basicEvent: BasicEvent, result: any) {
	if (result.value.event.value === 'can-access-by-account') {
		const contractEvent: MarketGatingAccessByAccountEvent = {
			...basicEvent,
			contractKey: result.value['contract-key'].value,
			contractName: result.value['contract-name'].value,
			root: result.value['root'].value,
			leaf: result.value['leaf'].value,
			sender: result.value['sender'].value,
			txsender: result.value['txsender'].value,
			proofValid: Boolean(result.value['proof-valid'].value)
		} as MarketGatingAccessByAccountEvent;
		await saveOrUpdateEvent(contractEvent);
		return contractEvent;
	} else if (result.value.event.value === 'merkle-root') {
		const contractEvent: MarketGatingUpdateRootEvent = {
			...basicEvent,
			hashedId: result.value['hashed-id'].value,
			merkleRoot: result.value['merkle-root'].value
		} as MarketGatingUpdateRootEvent;
		await saveOrUpdateEvent(contractEvent);
		return contractEvent;
	} else if (result.value.event.value === 'set-merkle-root-by-principal') {
		const contractEvent: MarketGatingUpdateRootByPrincipalEvent = {
			...basicEvent,
			contractId: result.value['contract-id'].value,
			contractKey: result.value['contract-key'].value,
			contractName: result.value['contract-name'].value,
			merkleRoot: result.value['merkle-root'].value
		} as MarketGatingUpdateRootByPrincipalEvent;
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

export async function getGatingAccessesByAccount(proposal: string): Promise<Array<MarketGatingAccessByAccountEvent>> {
	const result = await daoEventCollection.find({ proposal, event: 'can-access-by-account' }).toArray();
	return result as unknown as Array<MarketGatingAccessByAccountEvent>;
}

export async function getGatingMerkleRoot(proposal: string): Promise<Array<MarketGatingUpdateRootEvent>> {
	const result = await daoEventCollection.find({ proposal, event: 'merkle-root' }).toArray();
	return result as unknown as Array<MarketGatingUpdateRootEvent>;
}

export async function getGatingMerkleRootUpdateByPrincipal(proposal: string): Promise<Array<MarketGatingUpdateRootByPrincipalEvent>> {
	const result = await daoEventCollection.find({ proposal, event: 'set-merkle-root-by-principal' }).toArray();
	return result as unknown as Array<MarketGatingUpdateRootByPrincipalEvent>;
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
