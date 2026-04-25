import { getCached, setCached } from '$lib/core/server/cache/cache';
import { fetchMarketClaims, fetchMarketStakes, getPredictionMarket } from '@bigmarket/bm-utilities';
import type { PageServerLoad } from './$types';
import { getAppConfig, getNetworkFromUrl } from '@bigmarket/bm-config';

export const load: PageServerLoad = async ({ url, params }) => {
	const network = getNetworkFromUrl(url);
	const appConfig = getAppConfig(network);
	const marketId = Number(params.marketId);
	const marketType = Number(params.marketType);

	if (isNaN(marketId) || isNaN(marketType)) {
		throw new Error('Invalid marketId or marketType');
	}

	const key = `market-analysis-page:${marketType}:${marketId}`;
	const cached = getCached(key);
	if (cached) {
		//console.log('CACHE HIT: fetching markets: ', cached);
		return cached;
	}

	const market = await getPredictionMarket(appConfig.VITE_BIGMARKET_API, marketId, marketType);
	const stakes = await fetchMarketStakes(appConfig.VITE_BIGMARKET_API, marketId, market.marketType);
	const claims = await fetchMarketClaims(appConfig.VITE_BIGMARKET_API, marketId, market.marketType);

	//console.log('CACHE MISS: fetching market: ', market);

	const result = {
		market,
		stakes,
		claims,
		marketType,
		marketId
	};
	setCached(key, result, 1000 * 60 * 1); // 30 secs
	return result;
};
