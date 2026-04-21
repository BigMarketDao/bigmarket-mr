import type { ExchangeRate } from '@bigmarket/bm-types';

function convertFiatToStx(amountUsd: number, rate: ExchangeRate, asMicro = false): number {
	// price of 1 STX in USD
	const usdPerStx = (rate.stxToBtc ?? 0) * (rate.fifteen ?? 0);

	// how many STX for this USD amount
	const stx = amountUsd / usdPerStx;

	if (asMicro) {
		return Math.round(stx * 1e6); // for contract calls
	}
	return parseFloat(stx.toFixed(6)); // for UI
}

export function convertFiatToNative(
	exchangeRates: ExchangeRate[],
	amountFiat: number,
	currency: string
): number {
	const rate = exchangeRates.find((c) => c.currency === currency);
	if (!rate) return 0;
	return convertFiatToStx(amountFiat, rate);
}
