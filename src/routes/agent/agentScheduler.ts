import cron from 'node-cron';
import { createScalarMarketsOnChain, resolveScalarMarketsOnChain } from './scalar-markets.js';

// every 10 minutes: */10 * * * *'
export const initResolveMarketsJob = cron.schedule('*/10 * * * *', async (fireDate) => {
	console.log('Running: initResolveMarketsJob at: ' + fireDate);
	try {
		await resolveScalarMarketsOnChain();
	} catch (err: any) {
		console.log('initScanDaoEventsJob: ', err);
	}
});

// every 10 minutes: * */1 * * *'
export const initCreateMarketsJob = cron.schedule('0 12 * * *', async (fireDate) => {
	console.log('Running: initCreateMarketsJob at: ' + fireDate);
	try {
		await createScalarMarketsOnChain(true);
		await createScalarMarketsOnChain(false);
	} catch (err: any) {
		console.log('initScanDaoEventsJob: ', err);
	}
});
