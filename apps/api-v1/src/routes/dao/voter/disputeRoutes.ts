import express from 'express';
import { getMarketVoteComplete, getMarketVotesByMarket, getMarketVotesComplete, getMarketVotesUser } from './voter.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
	try {
		const response = await getMarketVotesComplete();
		res.send(response);
	} catch (error) {
		console.log('Error in routes: ', error);
		next('An error occurred fetching pox-info.');
	}
});

router.get('/:voter', async (req, res, next) => {
	try {
		const response = await getMarketVotesUser(req.params.voter);
		res.send(response);
	} catch (error) {
		console.log('Error in routes: ', error);
		next('An error occurred fetching pox-info.');
	}
});

router.get('/:marketId/:marketType', async (req, res, next) => {
	try {
		const response = await getMarketVoteComplete(Number(req.params.marketId), Number(req.params.marketType));
		res.send(response);
	} catch (error) {
		console.log('Error in routes: ', error);
		next('An error occurred fetching pox-info.');
	}
});

export { router as disputeRoutes };
