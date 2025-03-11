import cron from 'node-cron';
import { updateExchangeRates } from './rates_utils.js';

// 30 mins past every second hour: 30 */2 * * *'
export const initExchangeRatesJob = cron.schedule('*/2 * * * *', (fireDate) => {
	console.log('Running: exchangeRates at: ' + fireDate);
	try {
		updateExchangeRates();
	} catch (err: any) {
		console.log('Error running: exchangeRates: ', err);
	}
});
