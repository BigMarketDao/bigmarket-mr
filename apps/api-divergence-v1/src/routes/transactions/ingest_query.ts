import type { Request } from 'express';
import type { KalshiIngestOptions, PolymarketIngestOptions } from '../../types/event_types.js';
import {
	clampLimit,
	parseOptionalBoolean,
	parseOptionalInt,
	INGEST_PAGE_DELAY_MS
} from '../../lib/markets/utils.js';

function parsePageDelayMs(value: unknown): number | undefined {
	const parsed = parseOptionalInt(value);
	return parsed != null ? Math.max(parsed, 0) : undefined;
}

export function parsePolymarketIngestOptions(req: Request): PolymarketIngestOptions {
	return {
		limit: clampLimit(req.query.limit),
		offset: parseOptionalInt(req.query.offset),
		active: parseOptionalBoolean(req.query.active, true),
		closed: parseOptionalBoolean(req.query.closed, false),
		order: typeof req.query.order === 'string' ? req.query.order : undefined,
		ascending: req.query.ascending != null ? parseOptionalBoolean(req.query.ascending, false) : undefined,
		pageSize: parseOptionalInt(req.query.page_size),
		pageDelayMs: parsePageDelayMs(req.query.page_delay_ms)
	};
}

export function parseKalshiIngestOptions(req: Request): KalshiIngestOptions {
	const mveFilter = typeof req.query.mve_filter === 'string' ? req.query.mve_filter : undefined;
	return {
		limit: clampLimit(req.query.limit),
		cursor: typeof req.query.cursor === 'string' ? req.query.cursor : undefined,
		status: typeof req.query.status === 'string' ? req.query.status : undefined,
		minCreatedTs: parseOptionalInt(req.query.min_created_ts),
		maxCreatedTs: parseOptionalInt(req.query.max_created_ts),
		minCloseTs: parseOptionalInt(req.query.min_close_ts),
		maxCloseTs: parseOptionalInt(req.query.max_close_ts),
		minSettledTs: parseOptionalInt(req.query.min_settled_ts),
		maxSettledTs: parseOptionalInt(req.query.max_settled_ts),
		minUpdatedTs: parseOptionalInt(req.query.min_updated_ts),
		mveFilter: mveFilter === 'only' || mveFilter === 'exclude' ? mveFilter : undefined,
		pageSize: parseOptionalInt(req.query.page_size),
		pageDelayMs: parsePageDelayMs(req.query.page_delay_ms)
	};
}

export function parsePersistFlag(req: Request): boolean {
	return parseOptionalBoolean(req.query.persist, true);
}

/** Paginated full sync defaults for live active markets. */
export function defaultPolymarketOptions(): PolymarketIngestOptions {
	return {
		limit: 100,
		pageSize: 100,
		pageDelayMs: INGEST_PAGE_DELAY_MS,
		active: true,
		closed: false,
		order: 'volume_24hr',
		ascending: false
	};
}

export function defaultKalshiOptions(): KalshiIngestOptions {
	return {
		limit: 100,
		pageSize: 100,
		pageDelayMs: INGEST_PAGE_DELAY_MS,
		status: 'open',
		mveFilter: 'exclude'
	};
}

export function mergePolymarketOptions(req: Request): PolymarketIngestOptions {
	return { ...defaultPolymarketOptions(), ...parsePolymarketIngestOptions(req) };
}

export function mergeKalshiOptions(req: Request): KalshiIngestOptions {
	return { ...defaultKalshiOptions(), ...parseKalshiIngestOptions(req) };
}
