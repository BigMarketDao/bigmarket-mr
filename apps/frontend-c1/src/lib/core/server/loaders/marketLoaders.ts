import type {
	LeaderBoard,
	MarketCategory,
	PredictionMarketCreateEvent,
	TokenPermissionEvent
} from '@bigmarket/bm-types';

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
