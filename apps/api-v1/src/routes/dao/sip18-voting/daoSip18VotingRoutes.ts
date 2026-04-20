import express from 'express';
import { fetchSip18Votes, findSip18VoteById, isPostValid, saveSip18Vote } from './sip18_voting_helper.js';

const router = express.Router();

router.post('/votes/:hash', async (req, res) => {
	const { message, signature } = req.body;
	// console.log("/votes: message: ", message);
	// console.log("/votes: signature: ", signature);
	if (!isPostValid(signature, message)) {
		res.status(401).json({ error: 'Invalid request' });
	} else {
		console.log('/votes: PostValid');
		const vote = await saveSip18Vote(req.params.hash, message, signature);
		res.json(vote);
	}
});

router.get('/votes/process/:processed/:proposal', async (req, res) => {
	const votes = await fetchSip18Votes({
		processed: Boolean(req.params.processed),
		proposal: req.params.proposal
	});
	// process on client.
	//const txId = await sendBatchVote(req.params.processed, votes)
	res.json(votes);
});

router.get('/votes/:proposal', async (req, res) => {
	const votes = await fetchSip18Votes({
		proposal: req.params.proposal
	});
	res.json(votes);
});

router.get('/votes/:id', async (req, res) => {
	const vote = await findSip18VoteById(req.params.id);
	res.json(vote);
});

router.get('/timestamp', async (req, res) => {
	res.json({ serverTime: new Date().getTime() });
});

export { router as daoSip18VotingRoutes };
