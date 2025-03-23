import cron from 'node-cron';
import { createScalarMarketsOnChain, resolveScalarMarketsOnChain, resolveUndisputedScalarMarketsOnChain } from './scalar-markets.js';

// every 10 minutes: */10 * * * *'
export const initResolveMarketsJob = cron.schedule('*/10 * * * *', async (fireDate) => {
	console.log('Running: initResolveMarketsJob at: ' + fireDate);
	try {
		await resolveScalarMarketsOnChain();
	} catch (err: any) {
		console.log('initResolveMarketsJob: ', err);
	}
});

export const initResolveUndisputedMarketsJob = cron.schedule('15 */1 * * *', async (fireDate) => {
	console.log('Running: initResolveUndisputedMarketsJob at: ' + fireDate);
	try {
		await resolveUndisputedScalarMarketsOnChain();
	} catch (err: any) {
		console.log('initResolveUndisputedMarketsJob: ', err);
	}
});

// midnight monday and thursday
export const initCreateMarketsJobBitcoin = cron.schedule('0 0 * * 1,4', async (fireDate) => {
	console.log('Running: initCreateMarketsJob at: ' + fireDate);
	try {
		await createScalarMarketsOnChain(1);
	} catch (err: any) {
		console.log('initCreateMarketsJobBitcoin: ', err);
	}
});
// 12 pm every tuesday
export const initCreateMarketsJobStacks = cron.schedule('20 0 * * 1,4', async (fireDate) => {
	console.log('Running: initCreateMarketsJob at: ' + fireDate);
	try {
		await createScalarMarketsOnChain(2);
	} catch (err: any) {
		console.log('initCreateMarketsJobStacks: ', err);
	}
});
// 12 pm every wednesday
// export const initCreateMarketsJobSolana = cron.schedule('0 12 * * 3', async (fireDate) => {
// 	console.log('Running: initCreateMarketsJob at: ' + fireDate);
// 	try {
// 		await createScalarMarketsOnChain(3);
// 	} catch (err: any) {
// 		console.log('initCreateMarketsJobSolana: ', err);
// 	}
// });
// 12 pm every thursday
export const initCreateMarketsJobEthereum = cron.schedule('40 0 * * 1,4', async (fireDate) => {
	console.log('Running: initCreateMarketsJob at: ' + fireDate);
	try {
		await createScalarMarketsOnChain(4);
	} catch (err: any) {
		console.log('initCreateMarketsJobEthereum: ', err);
	}
});
