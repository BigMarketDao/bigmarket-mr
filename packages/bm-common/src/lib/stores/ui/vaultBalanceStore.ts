import { VaultBalance } from "@bigmarket/bm-types";
import { writable } from "svelte/store";

const initial: VaultBalance[] = [];
export const vaultBalanceStore = writable<VaultBalance[]>(initial);
