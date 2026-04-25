import type { PageServerLoad } from './$types';
import { loadThread } from '@bigmarket/sip18-forum';
import type { AuthenticatedForumContent } from '@bigmarket/sip18-forum-types';
import type { PredictionMarketCreateEvent, PredictionMarketStakeEvent } from '@bigmarket/bm-types';
import { getCached, setCached } from '$lib/core/server/cache/cache';
import { getAppConfig, getNetworkFromUrl } from '@bigmarket/bm-config';
import { loadMarketsAndLeaderboard } from '$lib/core/server/loaders/marketLoaders';
import { fetchMarketStakesSSR, getPredictionMarketSSR } from '@bigmarket/bm-utilities';

export const load: PageServerLoad = async ({ url, params }) => {
	const network = getNetworkFromUrl(url);
	const appConfig = getAppConfig(network);
	const leaderAndMarketsData = await loadMarketsAndLeaderboard(appConfig, url);
	const { marketId, marketType } = {
		marketId: Number(params.marketId),
		marketType: Number(params.marketType)
	};

	if (isNaN(marketId) || isNaN(marketType)) {
		throw new Error('Invalid marketId or marketType');
	}

	const key = `market-page-${marketType}:${marketId}`;
	const cached: {
		market: PredictionMarketCreateEvent;
		marketStakes: PredictionMarketStakeEvent[];
		thread: AuthenticatedForumContent;
	} | null = getCached(key);
	if (cached) {
		//console.log('CACHE HIT: fetching market: key=' + key);
		return { leaderAndMarketsData, ...cached };
	}

	const market = await getPredictionMarketSSR(appConfig.VITE_BIGMARKET_API, marketId, marketType);
	let thread: AuthenticatedForumContent | undefined;
	if (!market) {
		return {
			status: 302,
			redirect: '/'
		};
	}
	if (market.unhashedData.forumMessageId) {
		thread = await loadThread(appConfig.VITE_FORUM_API, market.unhashedData.forumMessageId);
	}

	const marketStakes = await fetchMarketStakesSSR(
		appConfig.VITE_BIGMARKET_API,
		marketId,
		marketType
	);
	const result = { market, marketStakes, thread: thread || undefined };
	//console.log('CACHE MISS: loading: market, marketStakes, marketType, marketId using: key=' + key);

	setCached(key, result, 1000 * 60 * 1); // 30 secs
	return {
		leaderAndMarketsData,
		market,
		marketStakes,
		thread: thread || undefined
	};
};
