import express from 'express';
import { sweepAndResolveMarket, sweepAndResolveMarkets } from './resolver-helper.js';
import { createMarketByDiscovery, createMarketBySuggestion } from './create-market-helper.js';
import { createScalarMarketsOnChain, fetchScalarMarketData, resolveScalarMarketOnChain, resolveScalarMarketsOnChain, resolveUndisputedScalarMarketsOnChain } from './scalar-markets.js';
import { fetchMarket } from '../predictions/markets_helper.js';
import { asyncHandler } from '../../lib/utils.js';

const router = express.Router();

router.get('/resolve-auto/scalar', async (req, res) => {
	const markets = await resolveScalarMarketsOnChain();
	res.json(markets);
});

router.get('/resolve-auto-undisputed/scalar', async (req, res) => {
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
		const markets = await resolveScalarMarketOnChain(market);
		res.json(markets);
	}
});

router.get('/resolve', async (req, res) => {
	const markets = await sweepAndResolveMarkets();
	res.json(markets);
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
