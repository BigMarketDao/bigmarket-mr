import { TokenPermissionEvent } from "@bigmarket/bm-types";
import { writable } from "svelte/store";

const initial: TokenPermissionEvent[] = [];
export const allowedTokenStore = writable<TokenPermissionEvent[]>(initial);
