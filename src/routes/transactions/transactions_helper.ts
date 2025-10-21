import fetch from 'node-fetch';
import { getConfig } from '../../lib/config.js';
import { wssBroadcast } from '../../lib/websockets/init.js';
import { getDaoConfig } from '../../lib/config_dao.js';
import { handleContractOrTransactionEvent } from '../dao/events/dao_events_extension_helper.js';

const intervals = new Map<string, NodeJS.Timeout>();

export function stopTxInterval(txid: string) {
	const handle = intervals.get(txid);
	if (handle) {
		clearInterval(handle);
		intervals.delete(txid);
	}
}

export function trackTransaction(txid: string) {
	console.log(`[initTxWebsocket] Subscribing to tx: ${txid}`);

	if (intervals.has(txid)) return; // already tracking

	const handle = setInterval(async () => {
		try {
			const response = await fetch(`${getConfig().stacksApi}/extended/v1/tx/${txid}`, {
				headers: { ...(getConfig().stacksHiroKey ? { 'x-api-key': getConfig().stacksHiroKey } : {}) }
			});
			if (!response.ok) return;

			const txData: any = await response.json();
			const status = txData?.tx_status || '';

			if (status !== 'pending') {
				console.log(`trackTransaction: ${status}`, txData);
				const data = JSON.stringify({
					type: 'tx_update',
					txid,
					status,
					data: txData
				});
				if (status === 'success') {
					const daoContract = getDaoConfig().VITE_DOA_DEPLOYER + '.' + getDaoConfig().VITE_DOA;
					for (const event of txData.events) {
						console.log('trackTransaction: event: ', event);
						//await handleContractOrTransactionEvent(daoContract, event.contract_log.contract_id, event);
					}
				}
				wssBroadcast(data);
				stopTxInterval(txid);
			}
		} catch (err) {
			console.error(`[WS] Error checking tx ${txid}:`, err);
			stopTxInterval(txid);
		}
	}, 3000);

	intervals.set(txid, handle);
}
