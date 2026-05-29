import type { TokenPermissionEvent } from '@bigmarket/bm-types';
import type { LayoutData } from '../types';
import {
	allowedTokenStore,
	chainStore,
	daoOverviewStore,
	marketSystemCategoriesStore
} from '@bigmarket/bm-common';

function dedupeBy<T, K extends keyof T>(arr: T[], key: K): T[] {
	const map = new Map<unknown, T>();
	for (const item of arr) {
		const k = item[key];
		const existing = map.get(k);
		if (!existing) {
			map.set(k, item);
			continue;
		}
		// When the same token appears on categorical + scalar, keep the higher minLiquidity.
		const a = item as { minLiquidity?: number };
		const b = existing as { minLiquidity?: number };
		if ((a.minLiquidity ?? 0) > (b.minLiquidity ?? 0)) {
			map.set(k, item);
		}
	}
	return Array.from(map.values());
}

export async function loadSystemData(data: LayoutData) {
	const allowedTokens = data.tokens.filter((o: TokenPermissionEvent) => o.allowed);
	allowedTokenStore.set(dedupeBy(allowedTokens, 'token'));
	marketSystemCategoriesStore.set(data.marketCategories);
	daoOverviewStore.set(data.daoOverview);
	chainStore.set({ stacks: data.stacksInfo });
}
