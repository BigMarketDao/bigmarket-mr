import { getNetworkFromUrl, getAppConfig, getDaoConfig } from '@bigmarket/bm-config';
import type { LayoutServerLoad } from './$types';
import { getCached, setCached } from '$lib/core/server/cache/cache';
import { fetchExchangeRates } from '$lib/core/server/loaders/exchangeRateLoaders';
import { fetchStacksInfo } from '$lib/core/server/loaders/blockchainLoaders';
import { getDaoOverview } from '$lib/core/server/loaders/daoLoaders';
import { getAllowedTokens, getMarketCategories } from '$lib/core/server/loaders/marketLoaders';

export const load: LayoutServerLoad = async ({ url }) => {
	const network = getNetworkFromUrl(url);
	const appConfig = getAppConfig(network);
	const daoConfig = getDaoConfig(network);
	const key = `layout-data-${network}`;
	// console.log('CACHE HIT: using appConfig= ', JSON.stringify(appConfig, null, 2));
	// console.log('CACHE HIT: using daoConfig= ', JSON.stringify(daoConfig, null, 2));
	console.log('layout-data-network: ' + key);
	try {
		const cached = getCached(key);
		if (cached) {
			console.log('CACHE HIT: using key=' + key);
			return cached;
		}

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
		console.log('CACHE HIT: using result= ', JSON.stringify(result, null, 2));

		setCached(key, result, 1000 * 60 * 1); // 30 secs
		return result;
	} catch (error) {
		console.log(error);
	}
	console.log(
		'CACHE MISS: loading: exchangeRates, stacksInfo, daoOverview, tokens using: key=' + key
	);
	return {};
};
