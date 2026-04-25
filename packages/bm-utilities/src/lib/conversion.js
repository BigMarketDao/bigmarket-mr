export function convertCryptoToFiatNumber(exchangeRates, selectedCurrency, stacks, amountNative) {
    const rate = exchangeRates.find((c) => c.currency === selectedCurrency.code);
    if (!rate)
        return 0.0;
    let amountFiat = 0;
    if (stacks)
        amountFiat = rate.stxToBtc ?? 0 * amountNative * (rate.fifteen || 0);
    else
        amountFiat = amountNative * (rate.fifteen || 0);
    return parseFloat(amountFiat.toFixed(2));
}
export function convertSip10ToBtc(exchangeRates, currency, sip10Data, amount) {
    // const microAmount = fmtStxMicro(amount, decimals); //Math.round(amount * mult);
    const rate = exchangeRates.find((c) => c.currency === currency.code);
    if (!rate)
        return 0;
    let amountNative = 0;
    if (sip10Data.symbol === "STX")
        amountNative = amount * (rate.stxToBtc ?? 0);
    else if (sip10Data.symbol.toLowerCase() === "sbtc")
        amountNative = amount;
    return parseFloat(amountNative.toFixed(sip10Data.decimals)); //fmtStxMicro(amountNative, sip10Data.decimals);
}
function convertFiatToStx(amountUsd, rate, asMicro = false) {
    // price of 1 STX in USD
    const usdPerStx = (rate.stxToBtc ?? 0) * (rate.fifteen ?? 0);
    // how many STX for this USD amount
    const stx = amountUsd / usdPerStx;
    if (asMicro) {
        return Math.round(stx * 1e6); // for contract calls
    }
    return parseFloat(stx.toFixed(6)); // for UI
}
export function convertFiatToNative(exchangeRates, amountFiat, currency) {
    const rate = exchangeRates.find((c) => c.currency === currency);
    if (!rate)
        return 0;
    return convertFiatToStx(amountFiat, rate);
}
