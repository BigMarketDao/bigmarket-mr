import type { ExchangeRate } from '@bigmarket/bm-types';

export async function fetchExchangeRates(bigmarketApiUrl: string): Promise<Array<ExchangeRate>> {
	const path = `${bigmarketApiUrl}/exchange/rates`;
	try {
		const response = await fetch(path);
		const res = await response.json();
		return res.result;
	} catch {
		return [];
	}
}
