import { MarketCategory } from "@bigmarket/bm-types";
import { writable } from "svelte/store";

const initial: MarketCategory[] = [];
export const marketSystemCategoriesStore = writable<MarketCategory[]>(initial);
