import { fetchMarketsServer, getLeaderBoard } from '$lib/core/server/loaders/marketLoaders';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	try {
		const network = getNetworkFromUrl(url);

		const key = 'home-page';
		const cached = getCached(key);
		if (cached) {
			return {
				...cached,
				markets: markets,
				leaderBoard: leaderBoard,
				network
			};
		}

		const markets = await fetchMarketsServer(appConfig.VITE_BIGMARKET_API);
		const leaderBoard = await getLeaderBoard(appConfig.VITE_BIGMARKET_API);

		const result = { network };
		setCached(key, result, 1000 * 60 * 1); // 30 secs
		return {
			markets: markets,
			leaderBoard: leaderBoard,
			network
		};
	} catch {
		return {
			markets: [],
			leaderBoard: [],
			network
		};
	}
};
