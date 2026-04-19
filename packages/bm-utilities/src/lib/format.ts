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

export function fmtNumber(amount: number | undefined) {
  if (amount === 0) return "0";
  if (amount) return new Intl.NumberFormat().format(amount);
}

export function fmtMicroToStx(amount: number, decimals?: number): string {
  const conv = Number(`1e${decimals}`);
  if (!decimals) {
    return String(amount / 1e6);
  }
  return (amount / conv).toFixed(decimals);
}
