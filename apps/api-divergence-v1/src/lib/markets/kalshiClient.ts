import type {
	ExternalMarketSnapshot,
	KalshiIngestOptions,
	KalshiMarket,
	KalshiMarketsResponse
} from '../../types/event_types.js';
import {
	externalMarketDocId,
	KALSHI_API_BASE,
	parseOptionalDate,
	parseOptionalNumber
} from './utils.js';

function buildKalshiEndpoint(options: KalshiIngestOptions): string {
	const params = new URLSearchParams();
	params.set('limit', String(options.limit ?? 100));
	if (options.cursor) {
		params.set('cursor', options.cursor);
	}
	if (options.status) {
		params.set('status', options.status);
	}
	if (options.minCreatedTs != null) {
		params.set('min_created_ts', String(options.minCreatedTs));
	}
	if (options.maxCreatedTs != null) {
		params.set('max_created_ts', String(options.maxCreatedTs));
	}
	if (options.minCloseTs != null) {
		params.set('min_close_ts', String(options.minCloseTs));
	}
	if (options.maxCloseTs != null) {
		params.set('max_close_ts', String(options.maxCloseTs));
	}
	if (options.minSettledTs != null) {
		params.set('min_settled_ts', String(options.minSettledTs));
	}
	if (options.maxSettledTs != null) {
		params.set('max_settled_ts', String(options.maxSettledTs));
	}
	if (options.minUpdatedTs != null) {
		params.set('min_updated_ts', String(options.minUpdatedTs));
	}
	if (options.mveFilter) {
		params.set('mve_filter', options.mveFilter);
	}
	return `${KALSHI_API_BASE}/markets?${params.toString()}`;
}

export function isLiveKalshiMarket(market: KalshiMarket): boolean {
	return market.status === 'active' || market.status === 'open';
}

export async function fetchKalshiMarkets(
	options: KalshiIngestOptions
): Promise<{ endpoint: string; markets: KalshiMarket[]; cursor: string }> {
	const endpoint = buildKalshiEndpoint(options);
	const response = await fetch(endpoint);
	if (!response.ok) {
		throw new Error(`Kalshi fetch failed (${response.status}): ${endpoint}`);
	}
	const payload = (await response.json()) as KalshiMarketsResponse;
	return {
		endpoint,
		markets: payload.markets ?? [],
		cursor: payload.cursor ?? ''
	};
}

function normalizeKalshiMarket(
	market: KalshiMarket,
	endpoint: string,
	fetchedAt: Date
): ExternalMarketSnapshot {
	const yesPrice =
		parseOptionalNumber(market.last_price_dollars) ??
		parseOptionalNumber(market.yes_ask_dollars) ??
		parseOptionalNumber(market.yes_bid_dollars);
	const noPrice =
		parseOptionalNumber(market.no_ask_dollars) ?? parseOptionalNumber(market.no_bid_dollars);
	const marketOutcomes = [
		{ name: 'Yes', price: yesPrice },
		{ name: 'No', price: noPrice }
	];
	const resolutionDate = parseOptionalDate(market.close_time ?? market.expiration_time);
	const sourceUpdatedAt = parseOptionalDate(market.updated_time ?? market.created_time);

	return {
		_id: externalMarketDocId('kalshi', market.ticker),
		source: 'kalshi',
		endpoint,
		fetchedAt,
		marketId: market.ticker,
		eventId: market.event_ticker,
		marketType: market.market_type ?? 'binary',
		marketQuestion: market.title,
		marketDescription: [market.rules_primary, market.rules_secondary].filter(Boolean).join('\n\n') || undefined,
		marketOutcomes,
		marketPool: parseOptionalNumber(market.volume_fp) ?? 0,
		marketLiquidity: parseOptionalNumber(market.liquidity_dollars) ?? 0,
		marketResolution: market.status,
		marketResolutionDate: resolutionDate,
		marketResolutionPrice: yesPrice,
		sourceUpdatedAt,
		raw: market,
		createdAt: fetchedAt,
		updatedAt: fetchedAt
	};
}

export function normalizeKalshiMarkets(
	markets: KalshiMarket[],
	endpoint: string,
	fetchedAt = new Date()
): ExternalMarketSnapshot[] {
	return markets.filter(isLiveKalshiMarket).map((market) => normalizeKalshiMarket(market, endpoint, fetchedAt));
}
