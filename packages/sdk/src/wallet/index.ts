import type { Chain, WalletSession } from "./types";
import { getAdapter } from "../internal/registry";

let currentChain: Chain = "stacks";

export function setChain(chain: Chain) {
  currentChain = chain;
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
