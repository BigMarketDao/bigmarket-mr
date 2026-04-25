import type { PredictionMarketClaimEvent, UserMarketStake } from '@bigmarket/bm-types';

export async function getMyMarkets(
	bmApiUrl: string,
	voter: string
): Promise<Array<UserMarketStake>> {
	const path = `${bmApiUrl}/my-markets/${voter}`;
	const response = await fetch(path);
	if (response.status === 404) return [];
	const res = await response.json();
	return res;
}
export async function getMyClaimedMarket(
	bmApiUrl: string,
	marketId: number,
	extension: string,
	claimer: string
): Promise<PredictionMarketClaimEvent> {
	const path = `${bmApiUrl}/my-markets/claimed/${marketId}/${extension}/${claimer}`;
	const response = await fetch(path);
	if (response.status === 404) return {} as PredictionMarketClaimEvent;
	const res = await response.json();
	return res;
}
