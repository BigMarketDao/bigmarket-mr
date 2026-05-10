import { getCached, setCached } from '$lib/core/server/cache/cache';
import { fetchMarketClaims, fetchMarketStakes, getPredictionMarket } from '@bigmarket/bm-utilities';
import type { PredictionMarketCreateEvent } from '@bigmarket/bm-types';
import type { PageServerLoad } from './$types';
import { getAppConfig, getNetworkFromUrl } from '@bigmarket/bm-config';
import { error } from '@sveltejs/kit';

function isPredictionMarketPayload(v: unknown): v is PredictionMarketCreateEvent {
	return (
		v != null &&
		!Array.isArray(v) &&
		typeof v === 'object' &&
		'marketType' in v &&
		'marketData' in v
	);
}

export const load: PageServerLoad = async ({ url, params }) => {
	const network = getNetworkFromUrl(url);
	const appConfig = getAppConfig(network);
	const marketId = Number(params.marketId);
	const marketType = Number(params.marketType);

	if (isNaN(marketId) || isNaN(marketType)) {
		throw error(400, 'Invalid marketId or marketType');
	}

	const key = `market-analysis-page:${marketType}:${marketId}`;
	const cached = getCached(key) as
		| { market?: unknown; stakes?: unknown; claims?: unknown; marketType?: number; marketId?: number }
		| undefined;

	if (cached && isPredictionMarketPayload(cached.market)) {
		//console.log('CACHE HIT: fetching markets: ', cached);
		return cached as Awaited<ReturnType<PageServerLoad>>;
	}

	const marketRaw = await getPredictionMarket(appConfig.VITE_BIGMARKET_API, marketId, marketType);

	if (!isPredictionMarketPayload(marketRaw)) {
		throw error(404, 'Market not found');
	}

	const market = marketRaw;
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
