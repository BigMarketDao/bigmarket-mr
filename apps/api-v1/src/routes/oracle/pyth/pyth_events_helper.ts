/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import { cvToJSON, deserializeCV } from '@stacks/transactions';
import { ExtensionType } from '@mijoco/stx_helpers/dist/index.js';
import { ObjectId } from 'mongodb';
import { pythEventCollection } from '../../../lib/data/db_models.js';

type PythEvent = {
	type: string;
	action: string;
	data: {
		'price-identifier': string;
		price: number;
		conf: number;
		'ema-price': number;
		'ema-conf': number;
		expo: number;
		'publish-time': number;
		'prev-publish-time': number;
	};
};
export async function readPythEvents(genesis: boolean) {
	const storageContract = 'ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.pyth-storage-v3';
	// console.log("readVotingEvents: extension contract " + storageContract);
	// getConfig().stacksApi
	const url = `${'https://api.testnet.hiro.so'}/extended/v1/contract/${storageContract}/events?limit=20`;
	const extensions: Array<ExtensionType> = [];
	let currentOffset = 0;
	if (!genesis) {
		currentOffset = await countPythEvents();
		if (currentOffset > 0) currentOffset -= 1;
	}
	let count = 0;
	let moreEvents = true;
	try {
		do {
			try {
				moreEvents = await resolveEvents(url, currentOffset, count);
				count++;
			} catch (err: any) {
				// console.log("readVotingEvents: " + err.message);
			}
		} while (count === 0); // (moreEvents);
	} catch (err) {
		console.log('readPythEvents: error: ', err);
	}
	return extensions;
}

async function resolveEvents(url: string, currentOffset: number, count: number): Promise<any> {
	let urlOffset = url + '&offset=' + (currentOffset + count * 20);
	const response = await fetch(urlOffset);
	const val = await response.json();

	if (!val || !val.results || typeof val.results !== 'object' || val.results.length === 0) {
		return false;
	}

	for (const event of val.results) {
		const pdb = await findPythEvent(event.event_index, event.tx_id);
		if (!pdb) {
			try {
				//processEvent(event);
			} catch (err: any) {
				console.log('resolveExtensionEvents: ', err);
			}
		}
	}
	return val.results?.length > 0 || false;
}

async function processEvent(event: any) {
	const result = cvToJSON(deserializeCV(event.contract_log.value.hex));
	//console.log('processEvent: new event: ', event);
	const data = result.value.data;
	const pythEvent = {
		_id: new ObjectId(),
		event_index: Number(event.event_index),
		txId: event.tx_id,
		event: 'price-feed',
		contract_id: event.contract_log.contract_id,
		action: result.value.action.value,
		data: {
			conf: Number(data.value.conf.value),
			expo: Number(data.value.expo.value),
			'ema-conf': Number(data.value['ema-conf'].value),
			'ema-price': Number(data.value['ema-price'].value),
			'publish-time': Number(data.value['publish-time'].value),
			'prev-publish-time': Number(data.value['prev-publish-time'].value),
			'price-identifier': data.value['price-identifier'].value
		}
	} as any;
	console.log('processEvent: pythEvent', pythEvent);
	//await saveOrUpdateEvent(pythEvent);
}

export async function countPythEvents(): Promise<number> {
	try {
		const result = await pythEventCollection.countDocuments({});
		return Number(result);
	} catch (err: any) {
		return 0;
	}
}

export async function findPythEvent(txId: string, event_index: string): Promise<number> {
	try {
		const result = await pythEventCollection.countDocuments({
			txId,
			event_index
		});
		return Number(result);
	} catch (err: any) {
		return 0;
	}
}
