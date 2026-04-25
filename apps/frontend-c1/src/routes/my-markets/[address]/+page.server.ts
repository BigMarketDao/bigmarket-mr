import { getCached, setCached } from '$lib/core/server/cache/cache';
import { getMyClaimedMarket, getMyMarkets } from '$lib/core/server/loaders/myMarketsLoaders';
import { getAppConfig, getNetworkFromUrl } from '@bigmarket/bm-config';
import type { PageServerLoad } from './$types';
import type { PredictionMarketClaimEvent } from '@bigmarket/bm-types';

export const load: PageServerLoad = async ({ url, params }) => {
	const network = getNetworkFromUrl(url);
	const appConfig = getAppConfig(network);

	const address = params.address;
	const key = `my-markets-page:${address}`;
	const cached = getCached(key);
	if (cached) {
		return cached;
	}

	let totalClaims = 0;
	const claims: Array<PredictionMarketClaimEvent> = [];

	const myMarketData = await getMyMarkets(appConfig.VITE_BIGMARKET_API, address);
	if (myMarketData) {
		totalClaims = myMarketData.filter((o) => o.claimed).length;
		for (let i = 0; i < myMarketData.length; i++) {
			const market = myMarketData[i];
			if (market.marketData.concluded && market.claimed) {
				claims.push(
					await getMyClaimedMarket(
						appConfig.VITE_BIGMARKET_API,
						market.marketId,
						market.extension,
						address
					)
				);
			}
		}
	}

	//console.log('CACHE MISS: fetching market: ', market);

	const result = {
		myMarketData,
		claims,
		totalClaims,
		address
	};
	setCached(key, result, 1000 * 60 * 1); // 30 secs
	return result;
};
