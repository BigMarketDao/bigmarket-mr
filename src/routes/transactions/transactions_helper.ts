// src/websockets/txWebsocket.ts
import { WebSocketServer, WebSocket } from 'ws';
import fetch from 'node-fetch';
import { getConfig } from '../../lib/config.js';
import { getWss, wssBroadcast } from '../../lib/websockets/init.js';

let interval: any;

export function stopTxInterval() {
	clearInterval(interval);
}

export function trackTransaction(txid: string) {
	console.log(`[initTxWebsocket] Subscribing to tx: ${txid}`);

	interval = setInterval(async () => {
		try {
			const response = await fetch(`${getConfig().stacksApi}/extended/v1/tx/${txid}`, {
				headers: { ...(getConfig().stacksHiroKey ? { 'x-api-key': getConfig().stacksHiroKey } : {}) }
			});
			if (!response.ok) return;

			const txData: any = await response.json();
			const status = txData?.tx_status || '';

			if (status === 'success') {
				const data = JSON.stringify({
					type: 'tx_update',
					txid,
					status,
					data: txData
				});
				wssBroadcast(data);
				clearInterval(interval);
			}
		} catch (err) {
			console.error(`[WS] Error checking tx ${txid}:`, err);
		}
	}, 5000);
}
