import { UserShareCosts } from "@bigmarket/bm-types";
import { writable } from "svelte/store";

export const shareCosts = writable({} as UserShareCosts);
