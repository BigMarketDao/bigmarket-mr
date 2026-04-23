import { persisted } from "svelte-local-storage-store";
import { writable } from "svelte/store";
import { type Currency } from "@bigmarket/bm-types";

export const selectedCurrency = persisted("selectedCurrency", {
  code: "USD",
  name: "US Dollar",
  flag: "USD",
  symbol: "$",
} as Currency);

// Track user input amount

export const constructed = writable(false);
export const showOnRampModal = writable(false);
export const isLocalhost = writable(false);
export const bitcoinMode = writable(false);
export const stakeAmount = writable(0);
export const stakeAmountHome = writable(0);
