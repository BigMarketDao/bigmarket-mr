import { getAppConfig, getDaoConfig } from '@bigmarket/bm-config';
import type { Network } from '@bigmarket/bm-types';
import { getCached, setCached } from './cache';
import { fetchStacksInfo } from '../loaders/blockchainLoaders';
import { fetchExchangeRates } from '../loaders/exchangeRateLoaders';
import { fetchMarketsServer, getAllowedTokens, getMarketCategories } from '../loaders/marketLoaders';
import { getDaoOverview } from '../loaders/daoLoaders';

const WARM_INTERVAL_MS = 25_000;
const CACHE_TTL_MS = 60_000;

function resolveNetwork(): Network {
	const raw = process.env.BM_NETWORK || process.env.VITE_NETWORK || 'mainnet';
	if (raw === 'devnet' || raw === 'testnet' || raw === 'mainnet') return raw;
	return 'mainnet';
}

let started = false;

export function startCacheWarming() {
	if (started) return;
	started = true;

	const network = resolveNetwork();
	console.log(`[warm] starting cache warmer for network=${network}`);

	void warmCaches(network);
	setInterval(() => void warmCaches(network), WARM_INTERVAL_MS);
}

async function warmCaches(network: Network) {
	const layoutKey = `layout-data-${network}`;
	const homeKey = `home-page-${network}`;

	try {
		if (!getCached(layoutKey)) {
			const appConfig = getAppConfig(network);
			const daoConfig = getDaoConfig(network);
			console.log(`[warm] layout ${layoutKey}...`);

			const [exchangeRates, stacksInfo, daoOverview, tokens, marketCategories] = await Promise.all([
				fetchExchangeRates(appConfig.VITE_BIGMARKET_API),
				fetchStacksInfo(appConfig.VITE_STACKS_API),
				getDaoOverview(appConfig.VITE_BIGMARKET_API),
				getAllowedTokens(appConfig.VITE_BIGMARKET_API),
				getMarketCategories(appConfig.VITE_BIGMARKET_API)
			]);

			setCached(
				layoutKey,
				{ exchangeRates, stacksInfo, daoOverview, tokens, marketCategories, network, appConfig, daoConfig },
				CACHE_TTL_MS
			);
		}

		if (!getCached(homeKey)) {
			const appConfig = getAppConfig(network);
			console.log(`[warm] home ${homeKey}...`);
			const markets = await fetchMarketsServer(appConfig.VITE_BIGMARKET_API);
			setCached(homeKey, { network, markets }, CACHE_TTL_MS);
		}
	} catch (err) {
		console.error('[warm] error:', err);
	}
}
