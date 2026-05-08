import type { Chain, WalletSession } from "./types.js";
import { getAdapter } from "../internal/registry.js";

let currentChain: Chain = "stacks";
let mapped: { chain: Chain; address: string } | null = null;

export function setChain(chain: Chain) {
  currentChain = chain;
}

export function setMappedAddress(chain: Chain, address: string) {
  mapped = { chain, address };
}

export function getMappedAddress() {
  return mapped;
}

export async function connect(opts?: any) {
  const adapter = getAdapter(currentChain);
  await adapter.connect(opts);
}

export async function disconnect() {
  const adapter = getAdapter(currentChain);
  await adapter.disconnect();
}

export async function getSession(): Promise<WalletSession> {
  const adapter = getAdapter(currentChain);
  return adapter.getSession();
}
