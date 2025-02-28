import express from 'express';
import { sweepAndResolveMarkets } from './resolver-helper';
import { createMarketByDiscovery, createMarketBySuggestion } from './create-market-helper';

const router = express.Router();

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
