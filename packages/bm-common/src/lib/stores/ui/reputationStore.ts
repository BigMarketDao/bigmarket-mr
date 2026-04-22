import { UserReputation } from "@bigmarket/bm-types";
import { persisted } from "svelte-local-storage-store";

export const userReputationStore = persisted(
  "userReputationStore",
  {} as UserReputation,
);
