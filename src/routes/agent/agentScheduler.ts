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
export const initCreateMarketsJobBitcoin = cron.schedule('0 12 * * *', async (fireDate) => {
	console.log('Running: initCreateMarketsJob at: ' + fireDate);
	try {
		await createScalarMarketsOnChain(1);
	} catch (err: any) {
		console.log('initScanDaoEventsJob: ', err);
	}
});
export const initCreateMarketsJobStacks = cron.schedule('10 12 * * *', async (fireDate) => {
	console.log('Running: initCreateMarketsJob at: ' + fireDate);
	try {
		await createScalarMarketsOnChain(2);
	} catch (err: any) {
		console.log('initScanDaoEventsJob: ', err);
	}
});
export const initCreateMarketsJobSolana = cron.schedule('20 12 * * *', async (fireDate) => {
	console.log('Running: initCreateMarketsJob at: ' + fireDate);
	try {
		await createScalarMarketsOnChain(3);
	} catch (err: any) {
		console.log('initScanDaoEventsJob: ', err);
	}
});
export const initCreateMarketsJobEthereum = cron.schedule('30 12 * * *', async (fireDate) => {
	console.log('Running: initCreateMarketsJob at: ' + fireDate);
	try {
		await createScalarMarketsOnChain(4);
	} catch (err: any) {
		console.log('initScanDaoEventsJob: ', err);
	}
});
