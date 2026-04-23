import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';
import type { PredictionMarketCreateEvent } from '@bigmarket/bm-types';
import { get } from 'svelte/store';

export async function resolveMarketsUndisputed(): Promise<Array<PredictionMarketCreateEvent> | []> {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/agent/resolve-markets-undisputed`;
	const response = await fetch(path);
	if (response.status === 404) return [];
	const res = await response.json();
	return res;
}
export async function resolveMarketsScalar(): Promise<Array<PredictionMarketCreateEvent> | []> {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/agent/resolve-markets/scalar`;
	const response = await fetch(path);
	if (response.status === 404) return [];
	const res = await response.json();
	return res;
}
export async function resolveMarketsCategorical(): Promise<
	Array<PredictionMarketCreateEvent> | []
> {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/agent/resolve-markets/categorical`;
	const response = await fetch(path);
	if (response.status === 404) return [];
	const res = await response.json();
	return res;
}
