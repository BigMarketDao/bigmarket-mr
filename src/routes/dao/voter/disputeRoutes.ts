import express from 'express';
import { getMarketVotes, getMarketVotesByMarket, getMarketVotesUser } from './voter.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
	try {
		const response = await getMarketVotes();
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

router.get('/:market/:marketId', async (req, res, next) => {
	try {
		const response = await getMarketVotesByMarket(req.params.market, Number(req.params.marketId));
		res.send(response);
	} catch (error) {
		console.log('Error in routes: ', error);
		next('An error occurred fetching pox-info.');
	}
});

export { router as disputeRoutes };
