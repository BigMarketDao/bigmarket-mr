export const POLYMARKET_GAMMA_BASE = 'https://gamma-api.polymarket.com';
export const KALSHI_API_BASE = 'https://api.elections.kalshi.com/trade-api/v2';

export const DEFAULT_MARKET_LIMIT = 100;
export const MAX_MARKET_LIMIT = 1000;
export const INGEST_PAGE_SIZE = 100;
export const INGEST_PAGE_DELAY_MS = 800;
export const INGEST_UPDATED_TS_OVERLAP_SEC = 120;

export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function externalMarketDocId(source: string, marketId: string): string {
	return `${source}:${marketId}`;
}

export function parseJsonArray(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.map(String);
	}
	if (typeof value !== 'string' || !value.trim()) {
		return [];
	}
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed.map(String) : [];
	} catch {
		return [];
	}
}

export function parseOptionalNumber(value: unknown): number | null {
	if (value == null || value === '') {
		return null;
	}
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
}

export function parseOptionalDate(value: unknown): Date | null {
	if (value == null || value === '') {
		return null;
	}
	const d = new Date(String(value));
	return Number.isNaN(d.getTime()) ? null : d;
}

export function parseOptionalBoolean(value: unknown, fallback: boolean): boolean {
	if (value == null || value === '') {
		return fallback;
	}
	const normalized = String(value).toLowerCase();
	if (normalized === 'true' || normalized === '1') {
		return true;
	}
	if (normalized === 'false' || normalized === '0') {
		return false;
	}
	return fallback;
}

export function parseOptionalInt(value: unknown): number | undefined {
	if (value == null || value === '') {
		return undefined;
	}
	const n = Number.parseInt(String(value), 10);
	return Number.isFinite(n) ? n : undefined;
}

export function clampLimit(value: unknown, fallback = DEFAULT_MARKET_LIMIT): number {
	const n = parseOptionalInt(value) ?? fallback;
	return Math.min(Math.max(n, 1), MAX_MARKET_LIMIT);
}
