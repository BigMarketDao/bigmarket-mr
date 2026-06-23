import type {
	ExternalMarketSnapshot,
	PolymarketEvent,
	PolymarketIngestOptions,
	PolymarketMarket
} from '../../types/event_types.js';
import {
	externalMarketDocId,
	parseJsonArray,
	parseOptionalDate,
	parseOptionalNumber,
	POLYMARKET_GAMMA_BASE
} from './utils.js';

export function isLivePolymarketMarket(market: PolymarketMarket, event?: PolymarketEvent): boolean {
	const active = market.active ?? event?.active;
	const closed = market.closed ?? event?.closed;
	return active !== false && closed !== true;
}

function buildPolymarketEndpoint(options: PolymarketIngestOptions): string {
	const params = new URLSearchParams();
	params.set('active', String(options.active ?? true));
	params.set('closed', String(options.closed ?? false));
	params.set('limit', String(options.limit ?? 100));
	if (options.offset != null) {
		params.set('offset', String(options.offset));
	}
	if (options.order) {
		params.set('order', options.order);
	}
	if (options.ascending != null) {
		params.set('ascending', String(options.ascending));
	}
	return `${POLYMARKET_GAMMA_BASE}/events?${params.toString()}`;
}

export async function fetchPolymarketEvents(
	options: PolymarketIngestOptions
): Promise<{ endpoint: string; events: PolymarketEvent[] }> {
	const endpoint = buildPolymarketEndpoint(options);
	const response = await fetch(endpoint);
	if (!response.ok) {
		throw new Error(`Polymarket fetch failed (${response.status}): ${endpoint}`);
	}
	const events = (await response.json()) as PolymarketEvent[];
	return { endpoint, events };
}

function normalizePolymarketMarket(
	event: PolymarketEvent,
	market: PolymarketMarket,
	endpoint: string,
	fetchedAt: Date
): ExternalMarketSnapshot {
	const outcomes = parseJsonArray(market.outcomes);
	const prices = parseJsonArray(market.outcomePrices).map(parseOptionalNumber);
	const marketOutcomes = outcomes.map((name, index) => ({
		name,
		price: prices[index] ?? null
	}));
	const yesPrice = marketOutcomes.find((o) => o.name.toLowerCase() === 'yes')?.price ?? null;
	const resolutionDate = parseOptionalDate(market.endDate ?? event.endDate);
	const sourceUpdatedAt = parseOptionalDate(market.updatedAt ?? event.updatedAt);
	const marketId = String(market.id);

	return {
		_id: externalMarketDocId('polymarket', marketId),
		source: 'polymarket',
		endpoint,
		fetchedAt,
		marketId,
		eventId: String(event.id),
		marketType: market.marketType ?? 'binary',
		marketQuestion: market.question || event.title,
		marketDescription: market.description ?? event.description,
		marketOutcomes,
		marketPool: market.volumeNum ?? parseOptionalNumber(market.volume) ?? event.volume ?? 0,
		marketLiquidity: market.liquidity ?? event.liquidity ?? 0,
		marketResolution: market.closed ? 'closed' : market.active === false ? 'inactive' : 'open',
		marketResolutionDate: resolutionDate,
		marketResolutionPrice: yesPrice,
		sourceUpdatedAt,
		raw: { event, market },
		createdAt: fetchedAt,
		updatedAt: fetchedAt
	};
}

export function normalizePolymarketEvents(
	events: PolymarketEvent[],
	endpoint: string,
	fetchedAt = new Date()
): ExternalMarketSnapshot[] {
	const snapshots: ExternalMarketSnapshot[] = [];
	for (const event of events) {
		for (const market of event.markets ?? []) {
			if (!isLivePolymarketMarket(market, event)) {
				continue;
			}
			snapshots.push(normalizePolymarketMarket(event, market, endpoint, fetchedAt));
		}
	}
	return snapshots;
}
