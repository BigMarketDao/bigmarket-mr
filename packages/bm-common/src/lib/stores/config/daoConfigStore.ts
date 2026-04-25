import type { DaoConfig } from "@bigmarket/bm-types";
import { stacks } from "@bigmarket/sdk";
import { writable } from "svelte/store";

export const daoConfigStore = writable<DaoConfig | null>(null);

export function requireDaoConfig(config: DaoConfig | null): DaoConfig {
  if (!config) throw new Error("DAO config not loaded");
  return config;
}
export function requireVaultClient(config: DaoConfig | null) {
  return stacks.createVaultClient(requireDaoConfig(config));
}
export function requireContractViewDataClient() {
  return stacks.createContractViewDataClient();
}
type DaoGovernanceClient = ReturnType<typeof stacks.createDaoGovernanceClient>;
export function requireDaoGovernanceClient(
  config: DaoConfig | null,
): DaoGovernanceClient {
  return stacks.createDaoGovernanceClient(requireDaoConfig(config));
}
