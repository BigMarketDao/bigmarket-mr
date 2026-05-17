const btcPrecision = 100000000;
const stxPrecision = 1000000;
export const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD", //getSelectedCurrency().code
  // These options are needed to round to whole numbers if that's what you want.
  // minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
  // maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
});

export function fmtAmount(amount: number, currency: string) {
  return formatter.format(amount).replace("$", ""); // &#931;
}

export function fmtNumberStacksFloor(amount: number | undefined) {
  if (!amount || amount === 0) return "0";
  return fmtNumber(Math.floor(Number(fmtMicroToStx(amount))));
}
export function fmtStxMicro(amountStx: number, decimals?: number) {
  if (!decimals) {
    return (Math.round(amountStx) * stxPrecision * stxPrecision) / stxPrecision;
  }
  const conversion = Number(`1e${decimals}`);
  return amountStx * conversion;
}

export function fmtNumber(amount: number | undefined) {
  if (amount === 0) return "0";
  if (amount) return new Intl.NumberFormat().format(amount);
}

export function fmtMicroToStx(
  amount: number,
  decimals?: number,
  currencyCode?: string,
): string {
  const conv = Number(`1e${decimals}`);
  if (!decimals) {
    return String(amount / 1e6);
  }
  return (amount / conv).toFixed(decimals);
}

export function bitcoinToSats(amountBtc: number) {
  return Math.round(amountBtc * btcPrecision);
}

export function fmtSatoshiToBitcoin(amountSats: number) {
  return (Math.round(amountSats) / btcPrecision).toFixed(8);
}

export function satsToBitcoin(amountSats: number): number {
  return Number((Math.round(amountSats) / btcPrecision).toFixed(8));
}

export function userSatBtc(amount: number, denomination: string): number {
  if (denomination === "bitcoin") {
    if (amount.toString().indexOf(".") === -1) {
      return Number((Math.round(amount) / btcPrecision).toFixed(8));
    }
    return amount;
  } else {
    return bitcoinToSats(amount);
  }
}

export function fmtMicroToStxFormatted(amountStx: number) {
  const converted = amountStx / 1e6; // Divide by 10^6 to shift 6 decimal places
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 6,
    maximumFractionDigits: 6,
  }).format(converted);

  console.log(formatted); // Outputs: "99,999,999.452471"

  return formatted;
}

export function fmtRoundToNDecimalPlaces(value: number, n: number): number {
  return Number(value.toFixed(n));
}

export function fmtMicroToStxNumber(amount: number, decimals?: number): number {
  const conv = Number(`1e${decimals}`);
  if (!decimals) {
    return amount / 1e6;
  }
  return amount / conv;
}

export function trimTrailingZeros(value: number | string): string {
  return parseFloat(value.toString()).toString();
}

export function fmtProbability(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "<1% chance";
  if (value >= 99.5) return ">99% chance";
  return `${Math.round(value)}% chance`;
}
