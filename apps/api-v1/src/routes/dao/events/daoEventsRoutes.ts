import express from 'express';
import { fetchBaseDaoEvents, fetchExtensionEvent, fetchExtensions, getStacksAddressFromPost, readDaoEvents } from './dao_events_helper.js';
import { readDaoExtensionEvents } from './dao_events_extension_helper.js';
import { getGovernanceData, isExecutiveTeamMember, isExtension } from './extension.js';
import { getDaoConfig } from '../../../lib/config_dao.js';
import { coordinators } from '../../../lib/config.js';
import { updateUICache } from '../../cache/cache_utils.js';

const router = express.Router();

router.post('/extensions/:daoContractId', async (req, res, next) => {
	try {
		const { message, signature } = req.body;
		const address = getStacksAddressFromPost(signature, message);
		if (!address || coordinators.findIndex((a) => a.stxAddress === address) === -1) {
			console.error('post(/extensions/:daoContractId: :address' + address);
			res.status(401).json({ error: 'Invalid request' });
		} else {
			console.debug('post(/extensions/:daoContractId: dao' + req.params.daoContractId);
			await readDaoEvents(true, req.params.daoContractId);
			console.debug('post(/extensions/:daoContractId: dao' + req.params.daoContractId);
			await readDaoExtensionEvents(true, req.params.daoContractId);
			const events = await fetchBaseDaoEvents();
			// await readPredictionEvents(false, req.params.daoContractId, getDaoConfig().VITE_DAO_DEPLOYER + '.' + getDaoConfig().VITE_DAO_MARKET_PREDICTING);
			// await readScalarEvents(false, getDaoConfig().VITE_DAO_DEPLOYER + '.bigmarket-dao', getDaoConfig().VITE_DAO_DEPLOYER + '.' + getDaoConfig().VITE_DAO_MARKET_SCALAR);
			// await readBitcoinEvents(true, getDaoConfig().VITE_DAO_DEPLOYER + '.bigmarket-dao', getDaoConfig().VITE_DAO_DEPLOYER + '.' + getDaoConfig().VITE_DAO_MARKET_BITCOIN);
			res.send(events);
		}
	} catch (error) {
		console.log('Error in routes: ', error);
		next('An error occurred fetching pox-info.');
	}
});

router.post('/latest-events/:daoContractId', async (req, res, next) => {
	try {
		await readDaoEvents(true, req.params.daoContractId);
		console.debug('post(/latest-events/:daoContractId: dao' + req.params.daoContractId);
		await readDaoExtensionEvents(true, req.params.daoContractId);
		await updateUICache();
		//const events = await fetchBaseDaoEvents();
		// await readPredictionEvents(false, req.params.daoContractId, getDaoConfig().VITE_DAO_DEPLOYER + '.' + getDaoConfig().VITE_DAO_MARKET_PREDICTING);
		// await readScalarEvents(false, getDaoConfig().VITE_DAO_DEPLOYER + '.bigmarket-dao', getDaoConfig().VITE_DAO_DEPLOYER + '.' + getDaoConfig().VITE_DAO_MARKET_SCALAR);
		// await readBitcoinEvents(true, getDaoConfig().VITE_DAO_DEPLOYER + '.bigmarket-dao', getDaoConfig().VITE_DAO_DEPLOYER + '.' + getDaoConfig().VITE_DAO_MARKET_BITCOIN);
		res.send({ success: true });
	} catch (error) {
		console.log('Error in routes: ', error);
		next('An error occurred fetching pox-info.');
	}
});

router.get('/extensions/:daoContractId', async (req, res, next) => {
	try {
		res.send(await fetchExtensions(req.params.daoContractId));
	} catch (error) {
		console.log('Error in routes: ', error);
		next('An error occurred fetching pox-info.');
	}
});

router.get('/extensions/is-core-team-member/:emergencyExecuteContractId/:stacksAddress', async (req, res, next) => {
	try {
		const result = isExecutiveTeamMember(req.params.emergencyExecuteContractId, req.params.stacksAddress);
		res.send(result);
	} catch (error: any) {
		console.log('Error in routes: ', error.message);
		next('An error occurred fetching executive-team-member.');
	}
});

router.get('/extensions/is-core-team-member/:stacksAddress', async (req, res, next) => {
	try {
		const emergencyExecuteContractId = getDaoConfig().VITE_DAO_DEPLOYER + '.' + getDaoConfig().VITE_DAO_EMERGENCY_EXECUTE_EXTENSION;
		const result = await isExecutiveTeamMember(emergencyExecuteContractId, req.params.stacksAddress);
		res.send(result);
	} catch (error: any) {
		console.log('Error in routes: ', error.message);
		next('An error occurred fetching executive-team-member.');
	}
});

router.get('/extensions/get-governance-data/:daoContractId/:stacksAddress', async (req, res, next) => {
	try {
		const result = getGovernanceData(req.params.daoContractId.split('.')[0], req.params.stacksAddress);
		res.send(result);
	} catch (error) {
		console.log('Error in routes: ', error);
		next('An error occurred fetching pox-info.');
	}
});

router.get('/extensions/is-extension/:extensionCid', async (req, res, next) => {
	try {
		const extensionEvent = await fetchExtensionEvent(req.params.extensionCid);

		const result = await isExtension(extensionEvent.daoContract.split('.')[0], extensionEvent.daoContract.split('.')[1], req.params.extensionCid);
		console.log('isExtension:', result);
		res.send(result);
	} catch (error) {
		console.log('Error in routes: ', error);
		next('An error occurred fetching pox-info.');
	}
});

router.get('/extensions/get-signals/:daoContractId/:stacksAddress', async (req, res, next) => {
	try {
		const result = getGovernanceData(req.params.daoContractId.split('.')[0], req.params.stacksAddress);
		res.send(result);
	} catch (error) {
		console.log('Error in routes: ', error);
		next('An error occurred fetching pox-info.');
	}
});

export { router as daoEventRoutes };
