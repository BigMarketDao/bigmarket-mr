export type Currency = {
  code: string;
  name: string;
  flag: string;
  symbol: string;
};

export const currencies: Currency[] = [
  { code: "USD", name: "US Dollar", flag: "USD", symbol: "$" },
  { code: "EUR", name: "Euro", flag: "EUR", symbol: "€" },
  { code: "GBP", name: "British Pound", flag: "GBP", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", flag: "JPY", symbol: "¥" },
  { code: "CNY", name: "Chinese Yuan", flag: "CNY", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", flag: "INR", symbol: "₹" },
  { code: "BRL", name: "Brazilian Real", flag: "BRL", symbol: "R$" },
];
