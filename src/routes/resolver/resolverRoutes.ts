import express from 'express';
import { fetchResolvableMarkets } from '../predictions/markets_helper';

const router = express.Router();

router.get('/resolve', async (req, res) => {
	const markets = await fetchResolvableMarkets();
	res.json(markets);
});

export { router as resolverRoutes };
