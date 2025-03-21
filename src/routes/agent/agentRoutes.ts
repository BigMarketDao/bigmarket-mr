import express from 'express';
import { sweepAndResolveMarket, sweepAndResolveMarkets } from './resolver-helper.js';
import { createMarketByDiscovery, createMarketBySuggestion } from './create-market-helper.js';
import { createScalarMarketsOnChain, resolveScalarMarketsOnChain, resolveUndisputedScalarMarketsOnChain } from './scalar-markets.js';

const router = express.Router();

router.get('/resolve-auto/scalar', async (req, res) => {
	const markets = await resolveScalarMarketsOnChain();
	res.json(markets);
});

router.get('/resolve-auto-undisputed/scalar', async (req, res) => {
	const markets = await resolveUndisputedScalarMarketsOnChain();
	res.json(markets);
});

// router.get('/create-auto/scalar/:chain', async (req, res) => {
// 	const markets = await createScalarMarketsOnChain(Number(req.params.chain));
// 	res.json(markets);
// });

router.get('/resolve/:marketId/:marketType', async (req, res) => {
	const markets = await sweepAndResolveMarket(Number(req.params.marketId), Number(req.params.marketType));
	res.json(markets);
});

router.get('/resolve', async (req, res) => {
	const markets = await sweepAndResolveMarkets();
	res.json(markets);
});

router.post('/create/by-discovery', async (req, res) => {
	const { proposer, source } = req.body;
	const markets = await createMarketByDiscovery(proposer, source);
	res.json(markets);
});

router.post('/create/by-suggestion', async (req, res) => {
	const { proposer, suggestion } = req.body;
	const markets = await createMarketBySuggestion(proposer, suggestion);
	res.json(markets);
});

export { router as agentRoutes };
