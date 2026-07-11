import { getConfig } from '../../lib/config.js';
import { fetchMarkets } from '../predictions/markets_helper.js';

const WARM_CONCURRENCY = 4;

export function startUICacheWarming(intervalMs = 25_000) {
	const base = getConfig().publicAppBaseUrl;
	if (!base || base.includes('localhost:3000')) {
		console.warn(`[cache] skipping UI warm — publicAppBaseUrl=${base}`);
		return;
	}
	console.log(`[cache] Warming loop starting every ${intervalMs / 1000}s → ${base}`);
	void updateUICache();
	setInterval(() => void updateUICache(), intervalMs);
}

async function warmUrl(url: string) {
	try {
		await fetch(url, {
			method: 'GET',
			headers: { Accept: 'text/html', 'X-Cache-Warm': '1' }
		});
	} catch (err) {
		console.error(`[cache] failed ${url}`, err);
	}
}

export async function updateUICache() {
	const base = getConfig().publicAppBaseUrl;
	if (!base || base.includes('localhost:3000')) return;

	const markets = await fetchMarkets();
	const urls = [`${base}/`];
	for (const market of markets) {
		urls.push(`${base}/market/${market.marketId}/${market.marketType}`);
		urls.push(`${base}/market/analysis/${market.marketId}/${market.marketType}`);
	}

	for (let i = 0; i < urls.length; i += WARM_CONCURRENCY) {
		await Promise.all(urls.slice(i, i + WARM_CONCURRENCY).map(warmUrl));
	}
}
