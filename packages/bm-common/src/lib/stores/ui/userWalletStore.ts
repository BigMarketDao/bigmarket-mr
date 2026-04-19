import { persisted } from "svelte-local-storage-store";
import { UserReputationStore } from "./reputationTypes";
import { UserWalletType } from "./userWalletTypes";

export const sessionStore = persisted("userStore", {} as UserReputationStore);

export const userWalletStore = persisted(
  "userWalletStore",
  {} as UserWalletType,
);
