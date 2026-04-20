import { ExchangeRate } from "@bigmarket/bm-types";
import { writable } from "svelte/store";

const initial: ExchangeRate[] = [];
export const exchangeRatesStore = writable<ExchangeRate[]>(initial);
