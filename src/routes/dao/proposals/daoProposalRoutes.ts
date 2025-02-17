import express from 'express';
import { VotingEventProposeProposal } from '@mijoco/stx_helpers/dist/index';
import { fetchAllProposals, fetchBootstrapProposals, fetchExecutedProposals, fetchExecutedProposalsByDao, fetchLatestProposal, fetchProposedProposals, fetchProposedProposalsByDao } from './proposal';
import { getVotesByProposal } from '../events/dao_events_extension_helper';

const router = express.Router();

router.get('/votes/:proposal', async (req, res, next) => {
	try {
		const response = await getVotesByProposal(req.params.proposal);
		res.send(response);
	} catch (error) {
		console.log('Error in routes: ', error);
		next('An error occurred fetching pox-info.');
	}
});

router.get('/proposed/:daoContractId', async (req, res, next) => {
	try {
		res.send(await fetchProposedProposalsByDao(req.params.daoContractId));
	} catch (error) {
		console.log('Error in routes: ', error);
		next('An error occurred fetching pox-info.');
	}
});

router.get('/proposed', async (req, res, next) => {
	try {
		res.send(await fetchProposedProposals());
	} catch (error) {
		console.log('Error in routes: ', error);
		next('An error occurred fetching pox-info.');
	}
});

router.get('/', async (req, res, next) => {
	try {
		res.send(await fetchAllProposals());
	} catch (error) {
		console.log('Error in routes: ', error);
		next('An error occurred fetching pox-info.');
	}
});

router.get('/executed/:daoContractId', async (req, res, next) => {
	try {
		res.send(await fetchExecutedProposalsByDao(req.params.daoContractId));
	} catch (error) {
		console.log('Error in routes: ', error);
		next('An error occurred fetching pox-info.');
	}
});

router.get('/bootstrap', async (req, res, next) => {
	try {
		res.send(await fetchBootstrapProposals());
	} catch (error) {
		console.log('Error in routes: ', error);
		next('An error occurred fetching pox-info.');
	}
});

router.get('/executed', async (req, res, next) => {
	try {
		res.send(await fetchExecutedProposals());
	} catch (error) {
		console.log('Error in routes: ', error);
		next('An error occurred fetching pox-info.');
	}
});

router.get('/proposal/:proposalContractId', async (req, res, next) => {
	try {
		const proposal: VotingEventProposeProposal = await fetchLatestProposal(req.params.proposalContractId);
		if (!proposal) res.sendStatus(404);
		res.send(proposal);
	} catch (error) {
		res.sendStatus(404);
	}
});

export { router as daoProposalRoutes };
