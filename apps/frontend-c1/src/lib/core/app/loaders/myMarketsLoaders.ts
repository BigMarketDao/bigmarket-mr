import type { PredictionMarketClaimEvent } from '@bigmarket/bm-types';

export async function fetchMyClaimedMarket(
	bmApiUrl: string,
	marketId: number,
	extension: string,
	claimer: string
): Promise<PredictionMarketClaimEvent | null> {
	const path = `${bmApiUrl}/my-markets/claimed/${marketId}/${extension}/${claimer}`;
	const response = await fetch(path);
	if (response.status === 404) return null;
	if (!response.ok) return null;
	return (await response.json()) as PredictionMarketClaimEvent;
}
