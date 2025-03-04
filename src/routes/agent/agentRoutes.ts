import express from 'express';
import { sweepAndResolveMarket, sweepAndResolveMarkets } from './resolver-helper';
import { createMarketByDiscovery, createMarketBySuggestion } from './create-market-helper';
import { timingSafeEqual } from 'crypto';

const router = express.Router();

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
