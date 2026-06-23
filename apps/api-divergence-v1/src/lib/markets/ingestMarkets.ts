import type {
	KalshiIngestOptions,
	MarketIngestResult,
	PolymarketIngestOptions
} from '../../types/event_types.js';
import { fetchKalshiMarkets, normalizeKalshiMarkets } from './kalshiClient.js';
import { fetchPolymarketEvents, normalizePolymarketEvents } from './polymarketClient.js';
import {
	getKalshiIngestState,
	getPolymarketIngestState,
	toMinUpdatedTs
} from './ingestState.js';
import { persistKalshiMarkets, persistPolymarketMarkets, toIngestResult } from './persistMarkets.js';
import {
	INGEST_PAGE_DELAY_MS,
	INGEST_PAGE_SIZE,
	INGEST_UPDATED_TS_OVERLAP_SEC,
	sleep
} from './utils.js';

function resolvePageSize(options: { pageSize?: number; limit?: number }): number {
	return Math.min(Math.max(options.pageSize ?? options.limit ?? INGEST_PAGE_SIZE, 1), INGEST_PAGE_SIZE);
}

function resolvePageDelayMs(options: { pageDelayMs?: number }): number {
	return Math.max(options.pageDelayMs ?? INGEST_PAGE_DELAY_MS, 0);
}

export async function ingestPolymarketMarkets(
	options: PolymarketIngestOptions = {},
	persist = true
): Promise<MarketIngestResult> {
	const state = await getPolymarketIngestState();
	const mode = state.isEmpty ? 'bootstrap' : 'refresh';
	const pageSize = resolvePageSize(options);
	const pageDelayMs = resolvePageDelayMs(options);
	const startOffset = options.offset ?? 0;

	let offset = startOffset;
	let pages = 0;
	let totalFetched = 0;
	let totalUpserted = 0;
	let totalMatched = 0;
	let lastEndpoint = '';
	let stopReason: MarketIngestResult['stopReason'] = 'empty_page';

	const baseOptions: PolymarketIngestOptions = {
		...options,
		active: true,
		closed: false,
		limit: pageSize
	};

	while (true) {
		const fetchedAt = new Date();
		const { endpoint, events } = await fetchPolymarketEvents({ ...baseOptions, offset });
		lastEndpoint = endpoint;
		pages += 1;

		if (events.length === 0) {
			stopReason = 'empty_page';
			break;
		}

		const snapshots = normalizePolymarketEvents(events, endpoint, fetchedAt);
		if (persist && snapshots.length > 0) {
			const writeResult = await persistPolymarketMarkets(snapshots);
			totalUpserted += writeResult.upserted;
			totalMatched += writeResult.matched;
		}
		totalFetched += snapshots.length;

		if (events.length < pageSize) {
			stopReason = 'partial_page';
			break;
		}

		offset += pageSize;
		await sleep(pageDelayMs);
	}

	return toIngestResult(
		'polymarket',
		lastEndpoint,
		totalFetched,
		{ upserted: totalUpserted, matched: totalMatched },
		{
			pages,
			mode,
			completed: true,
			start: { offset: startOffset, marketCount: state.marketCount },
			stopReason
		}
	);
}

export async function ingestKalshiMarkets(
	options: KalshiIngestOptions = {},
	persist = true
): Promise<MarketIngestResult> {
	const state = await getKalshiIngestState();
	const mode = state.isEmpty ? 'bootstrap' : 'refresh';
	const pageSize = resolvePageSize(options);
	const pageDelayMs = resolvePageDelayMs(options);
	const minUpdatedTs =
		options.minUpdatedTs ??
		(mode === 'refresh' ? toMinUpdatedTs(state.lastSourceUpdatedAt, INGEST_UPDATED_TS_OVERLAP_SEC) : undefined);

	let cursor = options.cursor;
	let pages = 0;
	let totalFetched = 0;
	let totalUpserted = 0;
	let totalMatched = 0;
	let lastEndpoint = '';
	let stopReason: MarketIngestResult['stopReason'] = 'no_cursor';

	const baseOptions: KalshiIngestOptions =
		mode === 'bootstrap'
			? {
					...options,
					limit: pageSize,
					status: options.status ?? 'open',
					mveFilter: options.mveFilter ?? 'exclude'
				}
			: {
					...options,
					limit: pageSize,
					minUpdatedTs,
					mveFilter: options.mveFilter ?? 'exclude',
					status: undefined,
					cursor: undefined
				};

	if (mode === 'refresh' && minUpdatedTs == null) {
		return toIngestResult(
			'kalshi',
			'',
			0,
			{ upserted: 0, matched: 0 },
			{
				pages: 0,
				mode,
				completed: true,
				start: { marketCount: state.marketCount },
				stopReason: 'no_updates'
			}
		);
	}

	while (true) {
		const fetchedAt = new Date();
		const { endpoint, markets, cursor: nextCursor } = await fetchKalshiMarkets({
			...baseOptions,
			cursor
		});
		lastEndpoint = endpoint;
		pages += 1;

		if (markets.length === 0) {
			stopReason = mode === 'refresh' && pages === 1 ? 'no_updates' : 'empty_page';
			break;
		}

		const snapshots = normalizeKalshiMarkets(markets, endpoint, fetchedAt);
		if (persist && snapshots.length > 0) {
			const writeResult = await persistKalshiMarkets(snapshots);
			totalUpserted += writeResult.upserted;
			totalMatched += writeResult.matched;
		}
		totalFetched += snapshots.length;

		if (!nextCursor) {
			stopReason = markets.length < pageSize ? 'partial_page' : 'no_cursor';
			break;
		}

		cursor = nextCursor;
		await sleep(pageDelayMs);
	}

	return toIngestResult(
		'kalshi',
		lastEndpoint,
		totalFetched,
		{ upserted: totalUpserted, matched: totalMatched },
		{
			pages,
			mode,
			completed: true,
			start: {
				minUpdatedTs,
				cursor: options.cursor,
				marketCount: state.marketCount
			},
			stopReason
		}
	);
}

export async function ingestAllMarkets(options: {
	polymarket?: PolymarketIngestOptions;
	kalshi?: KalshiIngestOptions;
	persist?: boolean;
}): Promise<{ polymarket: MarketIngestResult; kalshi: MarketIngestResult }> {
	const persist = options.persist ?? true;
	const [polymarket, kalshi] = await Promise.all([
		ingestPolymarketMarkets(options.polymarket ?? {}, persist),
		ingestKalshiMarkets(options.kalshi ?? {}, persist)
	]);
	return { polymarket, kalshi };
}
