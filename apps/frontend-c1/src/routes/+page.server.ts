import { fetchMarketsServer } from '$lib/core/server/loaders/marketLoaders';
import { getAppConfig, getNetworkFromUrl } from '@bigmarket/bm-config';
import type { PageServerLoad } from './$types';
import { getCached, setCached } from '$lib/core/server/cache/cache';
import type { PredictionMarketCreateEvent } from '@bigmarket/bm-types';

export const load: PageServerLoad = async ({ url }) => {
	try {
		const network = getNetworkFromUrl(url);
		const appConfig = getAppConfig(network);
		const key = 'home-page';
		const cached = getCached(key);
		if (cached) {
			return cached as {
				markets: PredictionMarketCreateEvent[];
				network: string;
			};
		}

		const markets = await fetchMarketsServer(appConfig.VITE_BIGMARKET_API);
		const result = { network, markets };
		setCached(key, result, 1000 * 60 * 1); // 30 secs
		return result;
	} catch {
		return {
			markets: [],
			network: 'devnet'
		};
	}
};
