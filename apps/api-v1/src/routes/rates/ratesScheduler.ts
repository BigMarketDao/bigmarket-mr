import cron from 'node-cron';
import { updateExchangeRates } from './rates_utils.js';
import { updateDaoOverview } from '../predictions/markets_helper.js';

// 30 mins past every second hour: 30 */2 * * *'
export const initExchangeRatesJob = cron.schedule('*/4 * * * *', (fireDate) => {
	console.log('Running: exchangeRates at: ' + fireDate);
	try {
		updateExchangeRates();
	} catch (err: any) {
		console.log('Error running: exchangeRates: ', err);
	}
});
export const initRefreshDaoOverviewJob = cron.schedule('*/3 * * * *', (fireDate) => {
	console.log('Running: updateDaoOverview at: ' + fireDate);
	try {
		updateDaoOverview();
	} catch (err: any) {
		console.log('Error running: updateDaoOverview: ', err);
	}
});
