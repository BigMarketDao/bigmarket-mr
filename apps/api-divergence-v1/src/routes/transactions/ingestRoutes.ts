import express from 'express';
import {
	externalKalshiMarketCollection,
	externalPolymarketMarketCollection
} from '../../lib/data/db_models.js';
import type { ExternalMarketSnapshot } from '../../types/event_types.js';
import {
	ingestAllMarkets,
	ingestKalshiMarkets,
	ingestPolymarketMarkets
} from '../../lib/markets/ingestMarkets.js';
import {
	mergeKalshiOptions,
	mergePolymarketOptions,
	parsePersistFlag
} from './ingest_query.js';

const router = express.Router();

router.post('/ingest/polymarket', async (req, res, next) => {
	try {
		const options = mergePolymarketOptions(req);
		const persist = parsePersistFlag(req);
		const result = await ingestPolymarketMarkets(options, persist);
		res.json({ ok: true, persist, options, result });
	} catch (err) {
		next(err);
	}
});

router.post('/ingest/kalshi', async (req, res, next) => {
	try {
		const options = mergeKalshiOptions(req);
		const persist = parsePersistFlag(req);
		const result = await ingestKalshiMarkets(options, persist);
		res.json({ ok: true, persist, options, result });
	} catch (err) {
		next(err);
	}
});

router.post('/ingest/all', async (req, res, next) => {
	try {
		const persist = parsePersistFlag(req);
		const result = await ingestAllMarkets({
			polymarket: mergePolymarketOptions(req),
			kalshi: mergeKalshiOptions(req),
			persist
		});
		res.json({ ok: true, persist, result });
	} catch (err) {
		next(err);
	}
});

router.get('/markets', async (req, res, next) => {
	try {
		const source = typeof req.query.source === 'string' ? req.query.source : undefined;
		const minUpdatedTs = req.query.min_updated_ts ? Number(req.query.min_updated_ts) : undefined;
		const maxUpdatedTs = req.query.max_updated_ts ? Number(req.query.max_updated_ts) : undefined;
		const limit = Math.min(Math.max(Number(req.query.limit ?? 100), 1), 1000);

		const filter: Record<string, unknown> = {};
		if (minUpdatedTs != null && Number.isFinite(minUpdatedTs)) {
			filter.sourceUpdatedAt = { ...(filter.sourceUpdatedAt as object), $gte: new Date(minUpdatedTs * 1000) };
		}
		if (maxUpdatedTs != null && Number.isFinite(maxUpdatedTs)) {
			filter.sourceUpdatedAt = { ...(filter.sourceUpdatedAt as object), $lte: new Date(maxUpdatedTs * 1000) };
		}

		const projection = { raw: 0 };
		const sort = { fetchedAt: -1 as const };
		let markets: ExternalMarketSnapshot[] = [];

		if (source === 'polymarket') {
			markets = await externalPolymarketMarketCollection
				.find(filter, { projection })
				.sort(sort)
				.limit(limit)
				.toArray();
		} else if (source === 'kalshi') {
			markets = await externalKalshiMarketCollection
				.find(filter, { projection })
				.sort(sort)
				.limit(limit)
				.toArray();
		} else {
			const perSourceLimit = Math.ceil(limit / 2);
			const [polymarket, kalshi] = await Promise.all([
				externalPolymarketMarketCollection.find(filter, { projection }).sort(sort).limit(perSourceLimit).toArray(),
				externalKalshiMarketCollection.find(filter, { projection }).sort(sort).limit(perSourceLimit).toArray()
			]);
			markets = [...polymarket, ...kalshi]
				.sort((a, b) => b.fetchedAt.getTime() - a.fetchedAt.getTime())
				.slice(0, limit);
		}

		res.json({ count: markets.length, markets });
	} catch (err) {
		next(err);
	}
});

export { router as transactionRoutes };
