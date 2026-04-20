import { ExchangeRate } from '@mijoco/stx_helpers/dist/index.js';
import { currencies } from './utils_currencies.js';
import { exchangeRatesCollection } from '../../lib/data/db_models.js';

export async function getRates(): Promise<any> {
	const rates = await getExchangeRates();
	return rates;
}

export async function getStxToBtc(): Promise<any> {
	const url = 'https://www.blockchain.com/en/tobtc?currency=STX&value=1';
	const response = await fetch(url);
	const info = await response.json();
	return info;
}

export async function getEthToBtc(): Promise<any> {
	const url = 'https://www.blockchain.com/en/tobtc?currency=ETH&value=1';
	const response = await fetch(url);
	const info = await response.json();
	return info;
}
export async function getSolToBtc(): Promise<any> {
	const url = 'https://www.blockchain.com/en/tobtc?currency=SOL&value=1';
	const response = await fetch(url);
	const info = await response.json();
	return info;
}

export async function getSuiToBtc(): Promise<any> {
	const url = 'https://www.blockchain.com/en/tobtc?currency=SUI&value=1';
	const response = await fetch(url);
	const info = await response.json();
	return info;
}

export async function getTonToBtc(): Promise<any> {
	const url = 'https://www.blockchain.com/en/tobtc?currency=TON&value=1';
	const response = await fetch(url);
	const info = await response.json();
	return info;
}

export async function updateExchangeRates() {
	try {
		const stxToBtc = await getStxToBtc();
		const ethToBtc = await getEthToBtc();
		const solToBtc = await getSolToBtc();
		const suiToBtc = await getSuiToBtc();
		const tonToBtc = await getTonToBtc();
		const url = 'https://blockchain.info/ticker';
		const response = await fetch(url);
		const info = await response.json();
		for (var key in info) {
			const dbRate: ExchangeRate = await findExchangeRateByCurrency(key);
			if (!dbRate) {
				const newRate = {
					currency: key,
					fifteen: info[key]['15m'],
					last: info[key].last,
					buy: info[key].buy,
					sell: info[key].sell,
					symbol: currencies[key].symbol,
					name: currencies[key].name,
					stxToBtc,
					ethToBtc,
					solToBtc,
					suiToBtc,
					tonToBtc
				};
				saveNewExchangeRate(newRate);
			} else {
				updateExchangeRate(dbRate, {
					currency: key,
					fifteen: info[key]['15m'],
					last: info[key].last,
					buy: info[key].buy,
					sell: info[key].sell,
					symbol: currencies[key].symbol,
					name: currencies[key].name,
					stxToBtc,
					ethToBtc,
					solToBtc,
					suiToBtc,
					tonToBtc
				});
			}
		}
		return getExchangeRates();
	} catch (err) {
		console.log(err);
	}
}

/** Exchnage rate mongo db helper functions */
export async function delExchangeRates() {
	await exchangeRatesCollection.deleteMany();
	return;
}
export async function setExchangeRates(ratesObj: any) {
	return await exchangeRatesCollection.insertMany(ratesObj);
}
export async function getExchangeRates(): Promise<Array<ExchangeRate>> {
	const result = await exchangeRatesCollection.find({}).sort({ currency: -1 }).toArray();
	return result as unknown as Array<ExchangeRate>;
}
export async function findExchangeRateByCurrency(currency: string): Promise<any> {
	const result = await exchangeRatesCollection.findOne({ currency });
	return result;
}
export async function saveNewExchangeRate(exchangeRate: any) {
	const result = await exchangeRatesCollection.insertOne(exchangeRate);
	return result;
}
export async function updateExchangeRate(exchangeRate: any, changes: any) {
	const result = await exchangeRatesCollection.updateOne(
		{
			_id: exchangeRate._id
		},
		{ $set: changes }
	);
	return result;
}
