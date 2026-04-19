import { writable } from "svelte/store";
import { ExchangeRate } from "./exchangeRatesTypes";

const initial: ExchangeRate[] = [];
export const exchangeRatesStore = writable<ExchangeRate[]>(initial);
