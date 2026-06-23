import type { Collection } from 'mongodb';
import {
	externalKalshiMarketCollection,
	externalPolymarketMarketCollection
} from '../data/db_models.js';
import type { ExternalMarketSnapshot, MarketIngestResult } from '../../types/event_types.js';

async function persistToCollection(
	collection: Collection<ExternalMarketSnapshot>,
	snapshots: ExternalMarketSnapshot[]
): Promise<{ upserted: number; matched: number }> {
	if (snapshots.length === 0) {
		return { upserted: 0, matched: 0 };
	}

	const now = new Date();
	const ops = snapshots.map((snapshot) => ({
		updateOne: {
			filter: { _id: snapshot._id },
			update: {
				$set: {
					source: snapshot.source,
					endpoint: snapshot.endpoint,
					fetchedAt: snapshot.fetchedAt,
					marketId: snapshot.marketId,
					eventId: snapshot.eventId,
					marketType: snapshot.marketType,
					marketQuestion: snapshot.marketQuestion,
					marketDescription: snapshot.marketDescription,
					marketOutcomes: snapshot.marketOutcomes,
					marketPool: snapshot.marketPool,
					marketLiquidity: snapshot.marketLiquidity,
					marketResolution: snapshot.marketResolution,
					marketResolutionDate: snapshot.marketResolutionDate,
					marketResolutionPrice: snapshot.marketResolutionPrice,
					sourceUpdatedAt: snapshot.sourceUpdatedAt,
					raw: snapshot.raw,
					updatedAt: now
				},
				$setOnInsert: {
					createdAt: now
				}
			},
			upsert: true
		}
	}));

	const result = await collection.bulkWrite(ops, { ordered: false });
	return {
		upserted: result.upsertedCount,
		matched: result.matchedCount
	};
}

export async function persistPolymarketMarkets(
	snapshots: ExternalMarketSnapshot[]
): Promise<{ upserted: number; matched: number }> {
	return persistToCollection(externalPolymarketMarketCollection, snapshots);
}

export async function persistKalshiMarkets(
	snapshots: ExternalMarketSnapshot[]
): Promise<{ upserted: number; matched: number }> {
	return persistToCollection(externalKalshiMarketCollection, snapshots);
}

export function toIngestResult(
	source: MarketIngestResult['source'],
	endpoint: string,
	fetched: number,
	persist: { upserted: number; matched: number },
	meta: Pick<MarketIngestResult, 'pages' | 'mode' | 'completed' | 'start' | 'stopReason'>
): MarketIngestResult {
	return {
		source,
		endpoint,
		fetched,
		upserted: persist.upserted,
		matched: persist.matched,
		...meta
	};
}
