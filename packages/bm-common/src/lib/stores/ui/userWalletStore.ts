import { persisted } from "svelte-local-storage-store";
import { UserWalletType } from "./userWalletTypes";

export const userWalletStore = persisted(
  "userWalletStore",
  {} as UserWalletType,
);
