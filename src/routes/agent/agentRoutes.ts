import express from 'express';
import { sweepAndResolveMarkets } from './resolver-helper';
import { createMarketByDiscovery, createMarketBySuggestion } from './create-market-helper';

const router = express.Router();

router.get('/resolve', async (req, res) => {
	const markets = await sweepAndResolveMarkets();
	res.json(markets);
});

router.get('/create/by-discovery/:proposer/:source', async (req, res) => {
	const markets = await createMarketByDiscovery(req.params.proposer, req.params.source);
	res.json(markets);
});

router.get('/create/by-suggestion/:proposer/:source', async (req, res) => {
	const markets = await createMarketBySuggestion(req.params.proposer, req.params.source);
	res.json(markets);
});

export { router as agentRoutes };
