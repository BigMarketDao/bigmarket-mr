import cron from 'node-cron';
import { readDaoEvents } from './dao_events_helper.js';
import { daoEventCollection } from '../../../lib/data/db_models.js';
import { readDaoExtensionEvents } from './dao_events_extension_helper.js';
import { getDaoConfig } from '../../../lib/config_dao.js';

// 30 mins past every second hour: 30 */2 * * *'
export const initScanDaoEventsTestnetJob = cron.schedule('0 0 * * *', async (fireDate) => {
	console.log('Running: initScanDaoEventsJob at: ' + fireDate);
	try {
		const daoContract = getDaoConfig().VITE_DOA_DEPLOYER + '.' + getDaoConfig().VITE_DOA;
		console.log('initScanDaoEventsJob: Running: dao: ' + daoContract);
		try {
			await readDaoEvents(true, daoContract);
		} catch (err) {
			console.log('Error running: ecosystem-dao: ', err);
		}
		await readDaoExtensionEvents(false, daoContract);
		// }
		// await readPredictionEvents(true, getDaoConfig().VITE_DOA_DEPLOYER + '.bigmarket-dao', getDaoConfig().VITE_DOA_DEPLOYER + '.' + getDaoConfig().VITE_DAO_MARKET_PREDICTING);
		// await readScalarEvents(true, getDaoConfig().VITE_DOA_DEPLOYER + '.bigmarket-dao', getDaoConfig().VITE_DOA_DEPLOYER + '.' + getDaoConfig().VITE_DAO_MARKET_SCALAR);
		// await readBitcoinEvents(true, getDaoConfig().VITE_DOA_DEPLOYER + '.bigmarket-dao', getDaoConfig().VITE_DOA_DEPLOYER + '.' + getDaoConfig().VITE_DAO_MARKET_BITCOIN);
	} catch (err: any) {
		console.log('initScanDaoEventsJob: ', err);
	}
});
//export const initScanDaoEventsJob = cron.schedule('*/2 * * * *', async (fireDate) => {
export const initScanDaoEventsJob = cron.schedule('*/5 * * * *', async (fireDate) => {
	console.log('Running: initScanDaoEventsJob at: ' + fireDate);
	try {
		const daoContract = getDaoConfig().VITE_DOA_DEPLOYER + '.' + getDaoConfig().VITE_DOA;
		console.log('initScanDaoEventsJob: Running: dao: ' + daoContract);
		try {
			await readDaoEvents(true, daoContract);
		} catch (err) {
			console.log('Error running: ecosystem-dao: ', err);
		}
		await readDaoExtensionEvents(false, daoContract);
		// }
		// await readPredictionEvents(true, getDaoConfig().VITE_DOA_DEPLOYER + '.bigmarket-dao', getDaoConfig().VITE_DOA_DEPLOYER + '.' + getDaoConfig().VITE_DAO_MARKET_PREDICTING);
		// await readScalarEvents(true, getDaoConfig().VITE_DOA_DEPLOYER + '.bigmarket-dao', getDaoConfig().VITE_DOA_DEPLOYER + '.' + getDaoConfig().VITE_DAO_MARKET_SCALAR);
		// await readBitcoinEvents(true, getDaoConfig().VITE_DOA_DEPLOYER + '.bigmarket-dao', getDaoConfig().VITE_DOA_DEPLOYER + '.' + getDaoConfig().VITE_DAO_MARKET_BITCOIN);
	} catch (err: any) {
		console.log('initScanDaoEventsJob: ', err);
	}
});
