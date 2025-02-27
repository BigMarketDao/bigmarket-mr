import express from 'express';
import { sweepAndResolveMarkets } from './resolver-helper';

const router = express.Router();

router.get('/resolve', async (req, res) => {
	const markets = await sweepAndResolveMarkets();
	res.json(markets);
});

export { router as resolverRoutes };
