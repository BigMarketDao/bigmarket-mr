import { getNetworkFromUrl, getAppConfig, getDaoConfig } from '@bigmarket/bm-config';
import type { LayoutServerLoad } from './$types';
import { getCached, setCached } from '$lib/core/server/cache/cache';
import { fetchExchangeRates } from '$lib/core/server/loaders/exchangeRateLoaders';
import { fetchStacksInfo } from '$lib/core/server/loaders/blockchainLoaders';
import { getDaoOverview } from '$lib/core/server/loaders/daoLoaders';
import { getAllowedTokens, getMarketCategories } from '$lib/core/server/loaders/marketLoaders';

const CACHE_TTL_MS = 60_000;

export const load: LayoutServerLoad = async ({ url }) => {
	const network = getNetworkFromUrl(url);
	const appConfig = getAppConfig(network);
	const daoConfig = getDaoConfig(network);
	const key = `layout-data-${network}`;

	const cached = getCached(key);
	if (cached) {
		return cached;
	}

	console.log(`CACHE MISS: layout key=${key}`);

	try {
		const [exchangeRates, stacksInfo, daoOverview, tokens, marketCategories] = await Promise.all([
			fetchExchangeRates(appConfig.VITE_BIGMARKET_API),
			fetchStacksInfo(appConfig.VITE_STACKS_API),
			getDaoOverview(appConfig.VITE_BIGMARKET_API),
			getAllowedTokens(appConfig.VITE_BIGMARKET_API),
			getMarketCategories(appConfig.VITE_BIGMARKET_API)
		]);

		const result = {
			exchangeRates,
			stacksInfo,
			daoOverview,
			tokens,
			marketCategories,
			network,
			appConfig,
			daoConfig
		};

		setCached(key, result, CACHE_TTL_MS);
		return result;
	} catch (error) {
		console.error('layout load failed:', error);
		return {
			exchangeRates: [],
			stacksInfo: {},
			daoOverview: {},
			tokens: [],
			marketCategories: [],
			network,
			appConfig,
			daoConfig
		};
	}
};
