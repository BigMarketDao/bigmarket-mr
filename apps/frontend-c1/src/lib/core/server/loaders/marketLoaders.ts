import { getNetworkFromUrl } from '@bigmarket/bm-config';
import type {
	AppConfig,
	LeaderBoard,
	MarketCategory,
	PredictionMarketCreateEvent,
	TokenPermissionEvent
} from '@bigmarket/bm-types';
import { getCached, setCached } from '../cache/cache';

export async function loadMarketsAndLeaderboard(
	appConfig: AppConfig,
	url: URL
): Promise<{ markets: Array<PredictionMarketCreateEvent>; leaderBoard: LeaderBoard }> {
	const network = getNetworkFromUrl(url);
	const key = `leader-market-list-${network}`; // separate cache per network

	const cached = getCached(key);
	if (cached)
		return cached as { markets: Array<PredictionMarketCreateEvent>; leaderBoard: LeaderBoard };

	const markets = await fetchMarketsServer(appConfig.VITE_BIGMARKET_API);
	const leaderBoard = await getLeaderBoard(appConfig.VITE_BIGMARKET_API);

	const result = { markets, leaderBoard };
	setCached(key, result, 1000 * 60 * 3); // 1 minute
	return result;
}

export async function fetchMarkets(bigmarketApiUrl: string) {
	const path = `${bigmarketApiUrl}/pm/markets`;
	const response = await fetch(path);
	if (response.status === 404) return [];
	const res = await response.json();
	return res;
}
export async function getAllowedTokens(
	bigmarketApiUrl: string
): Promise<Array<TokenPermissionEvent>> {
	const path = `${bigmarketApiUrl}/pm/markets/allowed-tokens`;
	const response = await fetch(path);
	const res = (await response.json()) || [];
	return res;
}

export async function getMarketCategories(bigmarketApiUrl: string): Promise<Array<MarketCategory>> {
	const path = `${bigmarketApiUrl}/pm/markets/categories`;
	const response = await fetch(path);
	const res = (await response.json()) || [];
	return res;
}

export async function fetchMarketsServer(
	bigmarketApiUrl: string
): Promise<Array<PredictionMarketCreateEvent>> {
	const path = `${bigmarketApiUrl}/pm/markets`;
	const response = await fetch(path);
	if (response.status === 404) return [] as Array<PredictionMarketCreateEvent>;
	const res = await response.json();
	return res;
}
export async function getLeaderBoard(bigmarketApiUrl: string): Promise<LeaderBoard> {
	const path = `${bigmarketApiUrl}/pm/markets/leader-board`;
	const response = await fetch(path);
	const res = (await response.json()) || [];
	return res;
}
