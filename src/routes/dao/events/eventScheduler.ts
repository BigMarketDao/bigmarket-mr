import cron from 'node-cron';
import { readDaoEvents } from './dao_events_helper.js';
import { daoEventCollection } from '../../../lib/data/db_models.js';
import { readDaoExtensionEvents } from './dao_events_extension_helper.js';
import { readPredictionEvents } from '../../predictions/dao_events_prediction_market_helper.js';
import { getDaoConfig } from '../../../lib/config_dao.js';
import { readScalarEvents } from '../../predictions/scalar/dao_events_scalar_market_helper.js';
import { readBitcoinEvents } from '../../predictions/bitcoin/dao_events_bitcoin_market_helper.js';

// 30 mins past every second hour: 30 */2 * * *'
export const initScanDaoEventsJob = cron.schedule('* * * * *', async (fireDate) => {
	//console.log('Running: initScanDaoEventsJob at: ' + fireDate);
	try {
		const distinctDaoContracts = await daoEventCollection
			.aggregate([
				{ $group: { _id: '$daoContract' } }, // Group by `daoContract`
				{ $project: { _id: 0, daoContract: '$_id' } } // Extract `daoContract`
			])
			.toArray();
		//console.log('Running: distinctDaoContracts: ', distinctDaoContracts);
		if (distinctDaoContracts.length === 0) {
			distinctDaoContracts.push({
				daoContract: getDaoConfig().VITE_DOA_DEPLOYER + '.' + getDaoConfig().VITE_DOA
			});
		}

		for (const dao of distinctDaoContracts) {
			const docContract = dao.daoContract;
			//console.log('Running: dao: ' + docContract);
			try {
				await readDaoEvents(true, docContract);
			} catch (err) {
				console.log('Error running: ecosystem-dao: ', err);
			}
			await readDaoExtensionEvents(true, docContract);
		}
		await readPredictionEvents(true, getDaoConfig().VITE_DOA_DEPLOYER + '.bigmarket-dao', getDaoConfig().VITE_DOA_DEPLOYER + '.' + getDaoConfig().VITE_DAO_MARKET_PREDICTING);
		await readScalarEvents(true, getDaoConfig().VITE_DOA_DEPLOYER + '.bigmarket-dao', getDaoConfig().VITE_DOA_DEPLOYER + '.' + getDaoConfig().VITE_DAO_MARKET_SCALAR);
		await readBitcoinEvents(true, getDaoConfig().VITE_DOA_DEPLOYER + '.bigmarket-dao', getDaoConfig().VITE_DOA_DEPLOYER + '.' + getDaoConfig().VITE_DAO_MARKET_BITCOIN);
	} catch (err: any) {
		console.log('initScanDaoEventsJob: ', err);
	}
});

// // runs at 01:01 AM every Sunday'
// export const initScanVotingEventsJob = cron.schedule(
//   "1 1 * * 0",
//   async (fireDate) => {
//     console.log("Running: initScanVotingEventsJob at: " + fireDate);
//     try {
//       await scanVoting(true);
//     } catch (err) {
//       console.log("Error running: ede007-snapshot-proposal-voting: ", err);
//     }
//   }
// );
