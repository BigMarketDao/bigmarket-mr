export declare const formatter: Intl.NumberFormat;
export declare function fmtAmount(amount: number, currency: string): string;
export declare function fmtNumberStacksFloor(amount: number | undefined): string | undefined;
export declare function fmtStxMicro(amountStx: number, decimals?: number): number;
export declare function fmtNumber(amount: number | undefined): string | undefined;
export declare function fmtMicroToStx(amount: number, decimals?: number, currencyCode?: string): string;
export declare function bitcoinToSats(amountBtc: number): number;
export declare function fmtSatoshiToBitcoin(amountSats: number): string;
export declare function satsToBitcoin(amountSats: number): number;
export declare function userSatBtc(amount: number, denomination: string): number;
export declare function fmtMicroToStxFormatted(amountStx: number): string;
export declare function fmtRoundToNDecimalPlaces(value: number, n: number): number;
export declare function fmtMicroToStxNumber(amount: number, decimals?: number): number;
export declare function trimTrailingZeros(value: number | string): string;
//# sourceMappingURL=format.d.ts.map