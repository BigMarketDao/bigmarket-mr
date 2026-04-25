import { StoredOpinionPoll } from "@bigmarket/bm-types";
import { writable } from "svelte/store";

export const aiMarket = writable({} as StoredOpinionPoll);
