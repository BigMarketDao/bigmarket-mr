import { persisted } from "svelte-local-storage-store";
import { UserReputationStore } from "./reputationTypes";

export const sessionStore = persisted("userStore", {} as UserReputationStore);
