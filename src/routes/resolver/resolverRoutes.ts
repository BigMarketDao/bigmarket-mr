import express from 'express';
import { sweepAndResolveMarkets, sweepAndResolveMarketsTest } from './resolver-helper';

const router = express.Router();

router.get('/resolve', async (req, res) => {
	const markets = await sweepAndResolveMarketsTest();
	res.json(markets);
});

export { router as resolverRoutes };
