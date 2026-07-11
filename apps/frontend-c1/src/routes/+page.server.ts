import { fetchMarketsServer } from '$lib/core/server/loaders/marketLoaders';
import { getAppConfig, getNetworkFromUrl } from '@bigmarket/bm-config';
import type { PageServerLoad } from './$types';
import { getCached, setCached } from '$lib/core/server/cache/cache';
import type { PredictionMarketCreateEvent } from '@bigmarket/bm-types';

const CACHE_TTL_MS = 60_000;

export const load: PageServerLoad = async ({ url }) => {
	const network = getNetworkFromUrl(url);
	const appConfig = getAppConfig(network);
	const key = `home-page-${network}`;

	const cached = getCached(key);
	if (cached) {
		return cached as { markets: PredictionMarketCreateEvent[]; network: string };
	}

	try {
		const markets = await fetchMarketsServer(appConfig.VITE_BIGMARKET_API);
		const result = { network, markets };
		setCached(key, result, CACHE_TTL_MS);
		return result;
	} catch {
		return { markets: [], network };
	}
};
