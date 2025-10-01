import express from 'express';
import { VotingEventProposeProposal } from '@mijoco/stx_helpers/dist/index.js';
import { fetchAllProposals, fetchBootstrapProposals, fetchConcludedProposals, fetchExecutedProposal, fetchExecutedProposalsByDao, fetchLatestProposal, fetchProposals, fetchProposedProposals } from './proposal.js';
import { getVotesByProposal } from '../events/processors/process_core_voting_events.js';

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

router.get('/proposals', async (req, res, next) => {
	try {
		res.send(await fetchProposals());
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

router.get('/executed-proposal/:proposalContractId', async (req, res, next) => {
	try {
		res.send(await fetchExecutedProposal(req.params.proposalContractId));
	} catch (error) {
		console.log('Error in routes: ', error);
		next('An error occurred fetching pox-info.');
	}
});

router.get('/concluded', async (req, res, next) => {
	try {
		res.send(await fetchConcludedProposals());
	} catch (error) {
		console.log('Error in routes: ', error);
		next('An error occurred fetching pox-info.');
	}
});

router.get('/executed', async (req, res, next) => {
	try {
		res.send(await fetchConcludedProposals());
	} catch (error) {
		console.log('Error in routes: ', error);
		next('An error occurred fetching pox-info.');
	}
});

router.get('/proposal/:proposalContractId', async (req, res, next) => {
	try {
		const proposal: VotingEventProposeProposal = await fetchLatestProposal(req.params.proposalContractId);
		console.log('/proposal/:proposalContractId', proposal.proposalData);
		if (!proposal) res.sendStatus(404);
		res.send(proposal);
	} catch (error) {
		res.sendStatus(404);
	}
});

export { router as daoProposalRoutes };
