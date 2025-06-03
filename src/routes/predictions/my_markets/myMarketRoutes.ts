import express from 'express';
import { getMyClaimedMarket, getMyStakesAndClaims } from './my_markets_helper.js';

const router = express.Router();

router.get('/:voter', async (req, res) => {
	const stakes = await getMyStakesAndClaims(req.params.voter);
	res.json(stakes);
});

router.get('/claimed/:marketId/:extension/:claimer', async (req, res) => {
	const stakes = await getMyClaimedMarket(Number(req.params.marketId), req.params.extension, req.params.claimer);
	res.json(stakes);
});
export { router as myMarketRoutes };
