import { BasicEvent, createBasicEvent, ExtensionType } from '@mijoco/stx_helpers/dist/index.js';
import { fetchExtensions } from './dao_events_helper.js';
import { getConfig } from '../../../lib/config.js';
import { daoEventCollection } from '../../../lib/data/db_models.js';
import { getDaoConfig } from '../../../lib/config_dao.js';
import { processTokenSaleEvent } from './processors/process_token_sale_events.js';
import { processGovernanceTokenEvent } from './processors/process_governance_token_events.js';
import { processMarketVotingEvent } from './processors/process_market_voting_events.js';
import { processMarketGatingEvent } from './processors/process_market_gating_events.js';
import { processMarketPredicitonCategoricalEvent } from './processors/process_prediction_market_events.js';
import { processCoreProposalsEvent } from './processors/process_core_proposals_events.js';
import { processMarketPredicitonBitcoinEvent } from './processors/process_bitcoin_market_events.js';
import { processMarketPredicitonScalarEvent } from './processors/process_scalar_market_events.js';
import { processCoreVotingEvent } from './processors/process_core_voting_events.js';
import { ObjectId } from 'mongodb';
import { cvToJSON, deserializeCV } from '@stacks/transactions';
import { processReputationEvents } from './processors/process_reputation_events.js';
import { processLiquidityContributionEvents } from './processors/process_liquidity_contribution_events.js';
import { processHedgeStrategyEvents } from './processors/process_hedge_strategy_events.js';

export async function readDaoExtensionEvents(genesis: boolean, daoContractId: string) {
	const extensions = await fetchExtensions(daoContractId);
	console.debug('readDaoExtensionEvents: dao' + daoContractId + ' : ' + genesis, extensions);
	for (const extensionObj of extensions) {
		console.debug('readDaoExtensionEvents: dao' + extensionObj.extension);
		await readExtensionEvents(genesis, daoContractId, extensionObj.extension);
	}
}
async function countEventsByVotingContract(daoContract: string, extension: string): Promise<number> {
	try {
		const result = await daoEventCollection.countDocuments({
			daoContract,
			extension
		});
		return Number(result);
	} catch (err: any) {
		return 0;
	}
}

async function readExtensionEvents(genesis: boolean, daoContract: string, extensionContract: string) {
	const extensions: Array<ExtensionType> = [];
	try {
		const urlBase = getConfig().stacksApi + '/extended/v1/contract/' + extensionContract + '/events?limit=20';
		console.log('readExtensionEvents: genesis: ' + genesis);
		console.log('readExtensionEvents: extensionContract: ' + extensionContract);
		let dbEventCount = 0;
		if (!genesis) {
			dbEventCount = await countEventsByVotingContract(daoContract, extensionContract);
		}
		let fetchedCount = 0;
		let offset = 0;
		let keepGoing = true;
		while (keepGoing) {
			const url = `${urlBase}&offset=${offset}`;
			const numEvents = await resolveExtensionEvents(url, daoContract, extensionContract, getConfig().stacksHiroKey);

			if (numEvents === 0) break;

			fetchedCount += numEvents;
			offset += 20;

			if (!genesis && fetchedCount >= dbEventCount) {
				keepGoing = false;
			}
		}
	} catch (err: any) {
		console.log('readExtensionEvents: ' + extensionContract + '. error: ' + err.message);
	}
	return extensions;
}
export async function findVotingContractEventByContractAndIndex(event_index: number, txId: string): Promise<any> {
	const result = await daoEventCollection.findOne({
		event_index,
		txId
	});
	return result;
}

async function resolveExtensionEvents(url: string, daoContract: string, extensionContract: string, stacksHiroKey?: string): Promise<any> {
	const response = await fetch(url, {
		headers: { ...(stacksHiroKey ? { 'x-api-key': stacksHiroKey } : {}) }
	});
	const val = await response.json();

	if (!val || !val.results || typeof val.results !== 'object' || val.results.length === 0) {
		return 0;
	}

	//console.log('resolveExtensionEvents: extension: ' + extensionContract + ' : events: ' + val.results.length);
	for (const event of val.results) {
		const pdb = await findVotingContractEventByContractAndIndex(Number(event.event_index), event.tx_id);
		//const pdb = await findPredictionContractEventByContractAndIndex(extensionContract, Number(event.event_index), event.tx_id);
		if (!pdb) {
			await handleContractOrTransactionEvent(daoContract, extensionContract, event);
		} else {
			//console.log('resolveExtensionEvents: skipping event: ' + pdb.event);
		}
	}
	return val.results?.length || 0;
}

export async function handleContractOrTransactionEvent(daoContract: string, extensionContract: string, event: any) {
	if (!event.contract_log) return;
	const result = cvToJSON(deserializeCV(event.contract_log.value.hex));
	const basicEvent = createBasicEvent(new ObjectId().toString(), event, daoContract, extensionContract, result.value.event.value);
	console.log('processEvent: new event: ', result);
	try {
		let event;
		if (extensionContract.indexOf(getDaoConfig().VITE_DAO_TOKEN_SALE) > -1) {
			event = await processTokenSaleEvent(basicEvent, result);
		} else if (extensionContract.indexOf(getDaoConfig().VITE_DAO_GOVERNANCE_TOKEN) > -1) {
			event = await processGovernanceTokenEvent(basicEvent, result);
		} else if (extensionContract.indexOf(getDaoConfig().VITE_DAO_CORE_PROPOSALS) > -1) {
			event = await processCoreProposalsEvent(basicEvent, result);
		} else if (extensionContract.indexOf(getDaoConfig().VITE_DAO_CORE_VOTING) > -1) {
			event = await processCoreVotingEvent(basicEvent, result);
		} else if (extensionContract.indexOf(getDaoConfig().VITE_DAO_TREASURY) > -1) {
			// no events
		} else if (extensionContract.indexOf(getDaoConfig().VITE_DAO_MARKET_VOTING) > -1) {
			event = await processMarketVotingEvent(basicEvent, result);
		} else if (extensionContract.indexOf(getDaoConfig().VITE_DAO_MARKET_GATING) > -1) {
			event = await processMarketGatingEvent(basicEvent, result);
		} else if (extensionContract.indexOf(getDaoConfig().VITE_DAO_MARKET_BITCOIN) > -1) {
			event = await processMarketPredicitonBitcoinEvent(basicEvent, result);
		} else if (extensionContract.indexOf(getDaoConfig().VITE_DAO_MARKET_PREDICTING) > -1) {
			event = await processMarketPredicitonCategoricalEvent(basicEvent, result);
		} else if (extensionContract.indexOf(getDaoConfig().VITE_DAO_MARKET_SCALAR) > -1) {
			event = await processMarketPredicitonScalarEvent(basicEvent, result);
		} else if (extensionContract.indexOf(getDaoConfig().VITE_DAO_LIQUIDITY_CONTRIBUTION) > -1) {
			event = await processLiquidityContributionEvents(basicEvent, result);
		} else if (extensionContract.indexOf(getDaoConfig().VITE_DAO_REPUTATION_TOKEN) > -1) {
			event = await processReputationEvents(basicEvent, result);
		} else if (extensionContract.indexOf(getDaoConfig().VITE_DAO_SCALAR_HEDGE_STRATEGY) > -1) {
			event = await processHedgeStrategyEvents(basicEvent, result);
		} else if (extensionContract.indexOf(getDaoConfig().VITE_DOA_EMERGENCY_EXECUTE_EXTENSION) > -1) {
			// no events
		} else {
			if (extensionContract.indexOf('bme023') === -1) {
				console.log('processEvent: unexpected event: ', event);
			}
		}
		return event;
	} catch (err: any) {
		console.log('resolveExtensionEvents: ', err);
	}
}

export async function saveDaoEvent(contractEvent: BasicEvent) {
	const doc = {
		...contractEvent,
		_id: new ObjectId(contractEvent._id) // ← convert string to ObjectId
	};
	const result = await daoEventCollection.insertOne(doc);
	return result;
}
