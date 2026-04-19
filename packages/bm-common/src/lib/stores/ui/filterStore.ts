import { persisted } from "svelte-local-storage-store";
import { writable } from "svelte/store";
import { type Currency } from "@bigmarket/bm-types";

export const selectedCurrency = persisted("selectedCurrency", {
  code: "USD",
  name: "US Dollar",
  flag: "USD",
  symbol: "$",
} as Currency);

export type UserSettings = {
  executiveTeamMember: boolean;
};

// Track user input amount
export const searchType = writable("all");
export const constructed = writable(false);
export const sortState = writable("ending-soon");
export const searchState = writable("all");
export const categoryState = writable("all");
export const marketState = writable("all");
export const marketType = writable("all");
export const showOnRampModal = writable(false);
export const isLocalhost = writable(false);
export const bitcoinMode = writable(false);
export const stakeAmount = writable(0);
export const stakeAmountHome = writable(0);
