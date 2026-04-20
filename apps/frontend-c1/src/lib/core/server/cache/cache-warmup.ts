import { getCached, setCached } from './cache';
import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';
import { get } from 'svelte/store';
import { getLeaderBoard } from '../loaders/reputationLoaders';
import { fetchStacksInfo } from '../loaders/blockchainLoaders';
import { fetchExchangeRates } from '../loaders/exchangeRateLoaders';
import { fetchMarkets, getAllowedTokens } from '../loaders/marketLoaders';
import { getDaoOverview } from '../loaders/daoLoaders';

// startCacheWarming();

// const PORT = process.env.PORT || 3000;

// ✅ Inline cache warmer
export function startCacheWarming() {
	const layoutKey = 'layout-data-testnet';
	const homeKey = 'home-page';
	const appConfig = requireAppConfig(get(appConfigStore));

	setInterval(async () => {
		try {
			if (!getCached(layoutKey)) {
				console.log('[warm] layout...');

				const [exchangeRates, stacksInfo, daoOverview, tokens] = await Promise.all([
					fetchExchangeRates(appConfig.VITE_BIGMARKET_API),
					fetchStacksInfo(appConfig.VITE_STACKS_API),
					getDaoOverview(appConfig.VITE_BIGMARKET_API),
					getAllowedTokens(appConfig.VITE_BIGMARKET_API)
				]);
				setCached(layoutKey, { exchangeRates, stacksInfo, daoOverview, tokens }, 1000 * 30);
			}

			if (!getCached(homeKey)) {
				console.log('[warm] home...');
				const [markets, leaderBoard] = await Promise.all([
					fetchMarkets(appConfig.VITE_BIGMARKET_API),
					getLeaderBoard(appConfig.VITE_BIGMARKET_API)
				]);
				setCached(homeKey, { markets, leaderBoard }, 1000 * 30);
			}
		} catch (err) {
			console.error('[warm] error:', err);
		}
	}, 1000 * 25);
}
