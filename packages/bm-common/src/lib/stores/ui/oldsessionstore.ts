// import {
//   AddressObject,
//   DaoOverview,
//   ExchangeRate,
//   MarketCategory,
//   SharesPerCost,
//   Sip10Data,
//   StacksBalance,
//   StacksInfo,
//   StoredOpinionPoll,
//   TokenBalances,
//   TokenPermissionEvent,
//   UserReputationContractData,
// } from "@bigmarket/bm-helpers";
// import { persisted } from "svelte-local-storage-store";
// import { writable } from "svelte/store";
// import { type Currency } from "@bigmarket/bm-types";

// export const sessionStore = persisted(
//   "sessionStore",
//   {} as BigMarketSessionStore,
// );
// export const selectedCurrency = persisted("selectedCurrency", {
//   code: "USD",
//   name: "US Dollar",
//   flag: "USD",
//   symbol: "$",
// } as Currency);

// export type UserSettings = {
//   executiveTeamMember: boolean;
// };

// export type BigMarketSessionStore = {
//   name: string;
//   loggedIn: boolean;
//   balances?: StacksBalance;
//   keySets: { [key: string]: AddressObject };
//   userSettings: UserSettings;
//   exchangeRates: Array<ExchangeRate>;
//   systemCategories: Array<MarketCategory>;
//   stacksInfo: StacksInfo;
//   tokens: Array<TokenPermissionEvent>;
//   daoOverview: DaoOverview;
//   userReputationData?: UserReputationContractData;
//   tokenBalances: TokenBalances;
//   walletSigningMode: boolean;
// };

// // stores.ts

// // Track user input amount
// export const searchType = writable("all");
// export const constructed = writable(false);
// export const sortState = writable("ending-soon");
// export const searchState = writable("all");
// export const categoryState = writable("all");
// export const marketState = writable("all");
// export const marketType = writable("all");
// export const showOnRampModal = writable(false);
// export const isLocalhost = writable(false);
// export const bitcoinMode = writable(false);
// export const stakeAmount = writable(0);
// export const stakeAmountHome = writable(0);
