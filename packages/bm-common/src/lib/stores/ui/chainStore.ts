import type { ChainInfo } from "@bigmarket/bm-types";
import { writable } from "svelte/store";

const initial: ChainInfo = {
  stacks: { burn_block_height: 0 },
};
export const chainStore = writable<ChainInfo>(initial);
