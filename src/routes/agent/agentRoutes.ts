import express from 'express';
import { sweepAndResolveMarkets } from './resolver-helper';
import { createMarketByDiscovery } from './create-market-helper';

const router = express.Router();

router.get('/resolve', async (req, res) => {
	const markets = await sweepAndResolveMarkets();
	res.json(markets);
});

router.get('/create/by-discovery/:proposer/:source', async (req, res) => {
	const markets = await createMarketByDiscovery(req.params.proposer, req.params.source);
	res.json(markets);
});

export { router as agentRoutes };
