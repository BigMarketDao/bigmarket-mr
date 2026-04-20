import { persisted } from "svelte-local-storage-store";
import { UserReputation } from "./reputationTypes";

export const userReputationStore = persisted(
  "userReputationStore",
  {} as UserReputation,
);
