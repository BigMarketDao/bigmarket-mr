import express from 'express';
import { getVotesByProposalAndVoter, getVotesByVoter } from './voter';

const router = express.Router();

router.get('/:voter/:proposal', async (req, res, next) => {
	try {
		const response = await getVotesByProposalAndVoter(req.params.proposal, req.params.voter);
		res.send(response);
	} catch (error) {
		console.log('Error in routes: ', error);
		next('An error occurred fetching pox-info.');
	}
});

router.get('/:voter', async (req, res, next) => {
	try {
		const response = await getVotesByVoter(req.params.voter);
		res.send(response);
	} catch (error) {
		console.log('Error in routes: ', error);
		next('An error occurred fetching pox-info.');
	}
});

export { router as voterRoutes };
