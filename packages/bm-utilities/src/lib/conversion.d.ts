import type { Currency, ExchangeRate, Sip10Data } from "@bigmarket/bm-types";
export declare function convertCryptoToFiatNumber(exchangeRates: ExchangeRate[], selectedCurrency: Currency, stacks: boolean, amountNative: number): number;
export declare function convertSip10ToBtc(exchangeRates: ExchangeRate[], currency: Currency, sip10Data: Sip10Data, amount: number): number;
export declare function convertFiatToNative(exchangeRates: ExchangeRate[], amountFiat: number, currency: string): number;
//# sourceMappingURL=conversion.d.ts.map