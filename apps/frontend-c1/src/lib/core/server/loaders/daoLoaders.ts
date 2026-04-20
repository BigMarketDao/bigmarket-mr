import type { DaoOverview } from '@bigmarket/bm-types';

export async function getDaoOverview(bigmarketApiUrl: string): Promise<DaoOverview> {
	const path = `${bigmarketApiUrl}/pm/market-dao-data`;
	const response = await fetch(path);
	const res = await response.json();
	return res;
}
