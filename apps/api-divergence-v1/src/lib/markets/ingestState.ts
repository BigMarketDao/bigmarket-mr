import {
	externalKalshiMarketCollection,
	externalPolymarketMarketCollection
} from '../data/db_models.js';

export type CollectionIngestState = {
	isEmpty: boolean;
	marketCount: number;
	lastSourceUpdatedAt: Date | null;
	lastFetchedAt: Date | null;
};

async function readCollectionIngestState(
	collection: typeof externalPolymarketMarketCollection
): Promise<CollectionIngestState> {
	const [marketCount, latest] = await Promise.all([
		collection.countDocuments(),
		collection.findOne({}, { sort: { sourceUpdatedAt: -1 }, projection: { sourceUpdatedAt: 1, fetchedAt: 1 } })
	]);

	return {
		isEmpty: marketCount === 0,
		marketCount,
		lastSourceUpdatedAt: latest?.sourceUpdatedAt ?? null,
		lastFetchedAt: latest?.fetchedAt ?? null
	};
}

export async function getPolymarketIngestState(): Promise<CollectionIngestState> {
	return readCollectionIngestState(externalPolymarketMarketCollection);
}

export async function getKalshiIngestState(): Promise<CollectionIngestState> {
	return readCollectionIngestState(externalKalshiMarketCollection);
}

export function toMinUpdatedTs(lastSourceUpdatedAt: Date | null, overlapSec: number): number | undefined {
	if (!lastSourceUpdatedAt) {
		return undefined;
	}
	return Math.max(0, Math.floor(lastSourceUpdatedAt.getTime() / 1000) - overlapSec);
}
