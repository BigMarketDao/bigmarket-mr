import express from 'express';
import { sweepAndResolveMarket, sweepAndResolveCategoricalMarkets } from './resolver-helper.js';
import { createMarketByDiscovery, createMarketBySuggestion } from './create-market-helper.js';
import { createScalarMarketsOnChain, fetchScalarMarketData, resolveScalarMarketOnChain, sweepAndResolveScalarMarkets, resolveUndisputedScalarMarketsOnChain } from './scalar-markets.js';
import { fetchMarket } from '../predictions/markets_helper.js';
import { asyncHandler } from '../../lib/utils.js';
import { fetchStacksInfo, StacksInfo } from '@mijoco/stx_helpers';
import { getConfig } from '../../lib/config.js';

const router = express.Router();

router.get('/resolve-markets/scalar', async (req, res) => {
	const markets = await sweepAndResolveScalarMarkets();
	res.json(markets);
});

router.get('/resolve-markets/categorical', async (req, res) => {
	const markets = await sweepAndResolveCategoricalMarkets();
	res.json(markets);
});

router.get('/resolve-markets-undisputed', async (req, res) => {
	const markets = await resolveUndisputedScalarMarketsOnChain();
	res.json(markets);
});

router.get('/create-auto/scalar/:chain', async (req, res) => {
	const markets = await createScalarMarketsOnChain(Number(req.params.chain));
	res.json(markets);
});

router.get('/quick/scalar/:chain', async (req, res) => {
	const markets = await fetchScalarMarketData(Number(req.params.chain));
	res.json(markets);
});

router.get('/resolve/:marketId/:marketType', async (req, res) => {
	const marketType = Number(req.params.marketType);
	const marketId = Number(req.params.marketId);
	if (marketType !== 2) {
		const markets = await sweepAndResolveMarket(marketId, marketType);
		res.json(markets);
	} else {
		const market = await fetchMarket(marketId, marketType);
		const stacksInfo = (await fetchStacksInfo(getConfig().stacksApi)) || ({} as StacksInfo);
		const blockHeight = stacksInfo.burn_block_height;
		const endCool = market.marketData.marketStart! + market.marketData.marketDuration! + market.marketData.coolDownPeriod!;
		if (blockHeight >= endCool) {
			const markets = await resolveScalarMarketOnChain(market);
			res.json(markets);
		} else {
			res.status(500);
		}
	}
});

// router.post('/create/by-discovery', async (req, res) => {
// 	const { proposer, source } = req.body;
// 	const markets = await createMarketByDiscovery(proposer, source);
// 	res.json(markets);
// });
router.post(
	'/create/by-discovery',
	asyncHandler(async (req, res) => {
		const { proposer, source } = req.body ?? {};
		if (!proposer || !source) {
			return res.status(400).json({ error: 'Missing proposer or source' });
		}

		// If this throws/rejects, it goes to errorHandler automatically
		const markets = await createMarketByDiscovery(proposer, source);

		res.json(markets);
	})
);

router.post('/create/by-suggestion', async (req, res) => {
	const { proposer, suggestion } = req.body;
	const markets = await createMarketBySuggestion(proposer, suggestion);
	res.json(markets);
});

export { router as agentRoutes };
