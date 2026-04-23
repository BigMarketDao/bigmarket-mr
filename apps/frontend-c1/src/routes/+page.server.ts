import { fetchMarketsServer, getLeaderBoard } from '$lib/core/server/loaders/marketLoaders';
import { getAppConfig, getNetworkFromUrl } from '@bigmarket/bm-config';
import type { PageServerLoad } from './$types';
import { getCached, setCached } from '$lib/core/server/cache/cache';
import type { LeaderBoard, PredictionMarketCreateEvent } from '@bigmarket/bm-types';

export const load: PageServerLoad = async ({ url }) => {
	try {
		const network = getNetworkFromUrl(url);
		const appConfig = getAppConfig(network);
		const key = 'home-page';
		const cached = getCached(key);
		if (cached) {
			return cached as {
				markets: PredictionMarketCreateEvent[];
				leaderBoard: LeaderBoard;
				network: string;
			};
		}

		const markets = await fetchMarketsServer(appConfig.VITE_BIGMARKET_API);
		const leaderBoard = await getLeaderBoard(appConfig.VITE_BIGMARKET_API);
		console.log('fetching data: ', JSON.stringify({ network, markets, leaderBoard }, null, 2));
		const result = { network, markets, leaderBoard };
		setCached(key, result, 1000 * 60 * 1); // 30 secs
		return result;
	} catch {
		return {
			markets: [],
			leaderBoard: [],
			network: 'devnet'
		};
	}
};
