import type { TokenPermissionEvent } from '@bigmarket/bm-types';
import type { LayoutData } from '../types';
import {
	allowedTokenStore,
	chainStore,
	daoOverviewStore,
	marketSystemCategoriesStore
} from '@bigmarket/bm-common';

function dedupeBy<T, K extends keyof T>(arr: T[], key: K): T[] {
	return Array.from(new Map(arr.map((item) => [item[key], item])).values());
}

export async function loadSystemData(data: LayoutData) {
	const allowedTokens = data.tokens.filter((o: TokenPermissionEvent) => o.allowed);
	allowedTokenStore.set(dedupeBy(allowedTokens, 'token'));
	marketSystemCategoriesStore.set(data.marketCategories);
	daoOverviewStore.set(data.daoOverview);
	chainStore.set({ stacks: data.stacksInfo });
}
