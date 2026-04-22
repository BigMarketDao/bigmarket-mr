// src/lib/server/loadMarketsAndLeaderboard.ts
import { getNetworkFromUrl } from '@bigmarket/bm-config';
import { type AppConfig } from '@bigmarket/bm-types';
import { get } from 'svelte/store';
import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';
import type { LeaderBoard, PredictionMarketCreateEvent } from '@bigmarket/bm-types';
import { getLeaderBoard } from '../server/loaders/reputationLoaders';
import { getCached, setCached } from '../server/cache/cache';

export async function loadMarketsAndLeaderboard(
	url: URL
): Promise<{ markets: Array<PredictionMarketCreateEvent>; leaderBoard: LeaderBoard }> {
	const network = getNetworkFromUrl(url);
	const appConfig = requireAppConfig(get(appConfigStore));
	const key = `leader-market-list-${network}`; // separate cache per network

	const cached = getCached(key);
	if (cached)
		return cached as { markets: Array<PredictionMarketCreateEvent>; leaderBoard: LeaderBoard };

	const markets = await fetchMarketsServer(appConfig);
	const leaderBoard = await getLeaderBoard(appConfig.VITE_BIGMARKET_API);

	const result = { markets, leaderBoard };
	setCached(key, result, 1000 * 60 * 3); // 1 minute
	return result;
}
export async function fetchMarketsServer(
	config: AppConfig
): Promise<Array<PredictionMarketCreateEvent>> {
	const path = `${config.VITE_BIGMARKET_API}/pm/markets`;
	const response = await fetch(path);
	if (response.status === 404) return [] as Array<PredictionMarketCreateEvent>;
	const res = await response.json();
	return res;
}
