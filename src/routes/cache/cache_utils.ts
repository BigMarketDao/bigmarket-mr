import { getConfig } from '../../lib/config.js';
import { fetchMarkets } from '../predictions/markets_helper.js';

export function startUICacheWarming(intervalMs = 25_000) {
	console.log(`[cache] Warming loop starting every ${intervalMs / 1000}s`);
	updateUICache(); // warm immediately
	setInterval(updateUICache, intervalMs);
}

export async function updateUICache() {
	const base = getConfig().publicAppBaseUrl; //'https://bigmarket.ai';
	const markets = await fetchMarkets();
	const urls = [`${base}/`];
	for (let market of markets) {
		urls.push(`${base}/market/${market.marketId}/${market.marketType}`);
		urls.push(`${base}/market/analysis/${market.marketId}/${market.marketType}`);
	}

	for (const url of urls) {
		let res;
		try {
			res = await fetch(url, { method: 'GET' });
			// console.log(`[cache] warmed ${url} (${res.status})`);
			console.log(`[cache] warmed ${url} (${res.status}) [x: ${res.headers.get('x-powered-by')}]`);
		} catch (err) {
			console.error(`[cache] failed ${url}`, err);
		}
	}
}
