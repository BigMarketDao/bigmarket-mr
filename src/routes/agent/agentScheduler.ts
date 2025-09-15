import cron from 'node-cron';
import { createScalarMarketsOnChain, sweepAndResolveScalarMarkets, resolveUndisputedScalarMarketsOnChain } from './scalar-markets.js';
import { sweepAndResolveCategoricalMarkets } from './resolver-helper.js';

// every 10 minutes: */10 * * * *'
export const initResolveMarketsJob = cron.schedule('*/10 * * * *', async (fireDate) => {
	console.log('Running: initResolveMarketsJob at: ' + fireDate);
	try {
		await sweepAndResolveScalarMarkets();
		await sweepAndResolveCategoricalMarkets();
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

// 40 0 * * 1,4 = At 00:40 (12:00 AM) every Monday and Thursday
// 30 0 * * 0 = 10 past midnight on Sunday
export const initCreateMarketsJobBitcoin = cron.schedule('26 15 * * 3', async (fireDate) => {
	console.log('Running: initCreateMarketsJob at: ' + fireDate);
	try {
		await createScalarMarketsOnChain(1);
	} catch (err: any) {
		console.log('initCreateMarketsJobBitcoin: ', err);
	}
});
// 40 0 * * 1,4 = At 00:40 (12:20 AM) every Monday and Thursday
// 30 0 * * 0 = 20 past midnight on Sunday
export const initCreateMarketsJobStacks = cron.schedule('29 15 * * 3', async (fireDate) => {
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
// 40 0 * * 1,4 = At 00:40 (12:40 AM) every Monday and Thursday
// 30 0 * * 0 = Half past midnight on Sunday
export const initCreateMarketsJobEthereum = cron.schedule('23 15 * * 3', async (fireDate) => {
	console.log('Running: initCreateMarketsJob at: ' + fireDate);
	try {
		await createScalarMarketsOnChain(4);
	} catch (err: any) {
		console.log('initCreateMarketsJobEthereum: ', err);
	}
});
