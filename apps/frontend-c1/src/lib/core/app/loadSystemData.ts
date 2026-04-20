import type { TokenPermissionEvent } from '@bigmarket/bm-types';
import type { LayoutData } from '../types';
import {
	allowedTokenStore,
	chainStore,
	daoOverviewStore,
	marketSystemCategoriesStore
} from '@bigmarket/bm-common';

export async function loadSystemData(data: LayoutData) {
	const allowedTokens = data.tokens.filter((o: TokenPermissionEvent) => o.allowed);
	allowedTokenStore.set(allowedTokens);
	marketSystemCategoriesStore.set(data.marketCategories);
	daoOverviewStore.set(data.daoOverview);
	chainStore.set({ stacks: data.stacksInfo });
}
