import type { ObjectId } from 'mongodb';

export type Chain = 'polygon';
export type CurrencySymbol = 'USDC' | 'ETH' | 'WETH' | string;

/** Matches OpenSea parser output; map `pack_or_unknown` → `pack` when persisting IndexedAsset. */
export type AssetKind = 'graded_card' | 'pack_or_unknown' | 'unknown';

export type ExternalMarketSource = 'polymarket' | 'kalshi';

export type ExternalMarketOutcome = {
	name: string;
	price: number | null;
};

/** Normalized market snapshot persisted from Polymarket or Kalshi. */
export type ExternalMarketSnapshot = {
	_id: string;
	source: ExternalMarketSource;
	endpoint: string;
	fetchedAt: Date;
	marketId: string;
	eventId?: string;
	marketType: string;
	marketQuestion: string;
	marketDescription?: string;
	marketOutcomes: ExternalMarketOutcome[];
	marketPool: number;
	marketLiquidity: number;
	marketResolution: string;
	marketResolutionDate: Date | null;
	marketResolutionPrice: number | null;
	sourceUpdatedAt: Date | null;
	raw: unknown;
	createdAt: Date;
	updatedAt: Date;
};

export type PolymarketMarket = {
	id: string;
	question: string;
	description?: string;
	outcomes?: string;
	outcomePrices?: string;
	volume?: string;
	volumeNum?: number;
	liquidity?: number;
	active?: boolean;
	closed?: boolean;
	endDate?: string;
	updatedAt?: string;
	marketType?: string;
	slug?: string;
};

export type PolymarketEvent = {
	id: string;
	ticker?: string;
	slug?: string;
	title: string;
	description?: string;
	active?: boolean;
	closed?: boolean;
	liquidity?: number;
	volume?: number;
	volume24hr?: number;
	endDate?: string;
	updatedAt?: string;
	markets?: PolymarketMarket[];
};

export type KalshiMarket = {
	ticker: string;
	event_ticker: string;
	title: string;
	subtitle?: string;
	status: string;
	market_type?: string;
	created_time?: string;
	updated_time?: string;
	close_time?: string;
	expiration_time?: string;
	last_price_dollars?: string;
	yes_ask_dollars?: string;
	yes_bid_dollars?: string;
	no_ask_dollars?: string;
	no_bid_dollars?: string;
	volume_fp?: string;
	volume_24h_fp?: string;
	liquidity_dollars?: string;
	open_interest_fp?: string;
	result?: string;
	rules_primary?: string;
	rules_secondary?: string;
};

export type KalshiMarketsResponse = {
	markets: KalshiMarket[];
	cursor: string;
};

export type PolymarketIngestOptions = {
	limit?: number;
	offset?: number;
	active?: boolean;
	closed?: boolean;
	order?: string;
	ascending?: boolean;
	pageSize?: number;
	pageDelayMs?: number;
};

export type KalshiIngestOptions = {
	limit?: number;
	cursor?: string;
	status?: string;
	minCreatedTs?: number;
	maxCreatedTs?: number;
	minCloseTs?: number;
	maxCloseTs?: number;
	minSettledTs?: number;
	maxSettledTs?: number;
	minUpdatedTs?: number;
	mveFilter?: 'only' | 'exclude';
	pageSize?: number;
	pageDelayMs?: number;
};

export type MarketIngestMode = 'bootstrap' | 'refresh';

export type MarketIngestResult = {
	source: ExternalMarketSource;
	endpoint: string;
	fetched: number;
	upserted: number;
	matched: number;
	pages: number;
	mode: MarketIngestMode;
	completed: boolean;
	start: {
		offset?: number;
		minUpdatedTs?: number;
		cursor?: string;
		marketCount: number;
	};
	stopReason: 'empty_page' | 'partial_page' | 'no_cursor' | 'no_updates';
};

export type MarketComparison = {
	_id: ObjectId;
	market1: {
		source: string;
		endpoint: string;
		fetchedAt: Date;
		marketId: string;
		marketType: string;
		marketQuestion: string;
		marketOutcomes: string[][];
		marketPool: number;
		marketResolution: string;
		marketResolutionDate: Date;
		marketResolutionPrice: number;
	};
	market2: {
		source: string;
		endpoint: string;
		fetchedAt: Date;
		marketId: string;
		marketType: string;
		marketQuestion: string;
		marketOutcomes: string[][];
		marketPool: number;
		marketResolution: string;
		marketResolutionDate: Date;
		marketResolutionPrice: number;
	};
	createdAt: Date;
	updatedAt: Date;
};
