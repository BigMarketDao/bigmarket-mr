import { type TokenSalePurchase } from '@bigmarket/bm-types';
import { get } from 'svelte/store';
import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';

export async function fetchTokenSalePurchases(address: string): Promise<TokenSalePurchase> {
	const appConfig = requireAppConfig(get(appConfigStore));
	const path = `${appConfig.VITE_BIGMARKET_API}/dao/token-sale/${address}`;
	const response = await fetch(path);
	if (response.status === 404) return {} as TokenSalePurchase;
	const res = await response.json();
	return res;
}
