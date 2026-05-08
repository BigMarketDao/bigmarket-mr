import { AddressObject } from "@bigmarket/bm-types";
import { persisted } from "svelte-local-storage-store";

export const userWalletStore = persisted(
  "userWalletStore",
  {} as AddressObject,
);
