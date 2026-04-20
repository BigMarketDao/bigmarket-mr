import type { MarketCategory, TokenPermissionEvent } from '@bigmarket/bm-types';

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
