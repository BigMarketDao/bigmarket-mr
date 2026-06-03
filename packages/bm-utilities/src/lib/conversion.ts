import type { Currency, ExchangeRate, Sip10Data } from "@bigmarket/bm-types";

export function convertCryptoToFiatNumber(
  exchangeRates: ExchangeRate[],
  selectedCurrency: Currency,
  stacks: boolean,
  amountNative: number,
): number {
  const rate = exchangeRates.find((c) => c.currency === selectedCurrency.code);
  if (!rate) return 0.0;
  let amountFiat = 0;
  if (stacks)
    amountFiat = rate.stxToBtc ?? 0 * amountNative * (rate.fifteen || 0);
  else amountFiat = amountNative * (rate.fifteen || 0);
  return parseFloat(amountFiat.toFixed(2));
}
export function convertSip10ToBtc(
  exchangeRates: ExchangeRate[],
  currency: Currency,
  sip10Data: Sip10Data,
  amount: number,
): number {
  // const microAmount = fmtStxMicro(amount, decimals); //Math.round(amount * mult);
  const rate = exchangeRates.find((c) => c.currency === currency.code);
  if (!rate) return 0;
  let amountNative = 0;
  if (sip10Data.symbol === "STX") amountNative = amount * (rate.stxToBtc ?? 0);
  else if (sip10Data.symbol.toLowerCase() === "sbtc") amountNative = amount;
  return parseFloat(amountNative.toFixed(sip10Data.decimals)); //fmtStxMicro(amountNative, sip10Data.decimals);
}

function isStxToken(token: string): boolean {
  return token.toLowerCase().includes("stx");
}

/** USD-pegged SIP-10 tokens where ~1 USD ≈ 1 token unit. */
function isUsdPeggedToken(token: string): boolean {
  const t = token.toLowerCase();
  return t.includes("usdc") || t.includes("usdh");
}

function convertFiatToStx(
  amountUsd: number,
  rate: ExchangeRate,
  asMicro = false,
): number {
  // price of 1 STX in USD
  const usdPerStx = (rate.stxToBtc ?? 0) * (rate.fifteen ?? 0);

  // how many STX for this USD amount
  const stx = amountUsd / usdPerStx;

  if (asMicro) {
    return Math.round(stx * 1e6); // for contract calls
  }
  return parseFloat(stx.toFixed(6)); // for UI — human STX, not micro
}

/**
 * Convert a fiat amount to human-readable native token units for staking UI.
 *
 * Returns **human** amounts (e.g. 2.5 STX, 1.0 USDCx) — not micro-units.
 * Call `fmtStxMicro()` when you need micro for contract calls.
 */
export function convertFiatToNative(
  exchangeRates: ExchangeRate[],
  amountFiat: number,
  currency: string,
  marketToken?: string,
): number {
  const rate = exchangeRates.find((c) => c.currency === currency);
  if (!rate) return 0;

  // USD-pegged market token: $1 quick-buy ≈ 1 token unit
  if (marketToken && !isStxToken(marketToken) && isUsdPeggedToken(marketToken)) {
    return parseFloat(amountFiat.toFixed(6));
  }

  return convertFiatToStx(amountFiat, rate);
}
