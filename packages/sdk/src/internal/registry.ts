import type { Chain, WalletAdapter } from "../wallet/types";
import { stacksAdapter } from "../chains/stacks/adapter";

const adapters: Record<Chain, WalletAdapter> = {
  stacks: stacksAdapter,
  sui: undefined as any, // placeholder
  solana: undefined as any, // placeholder
};

export function getAdapter(chain: Chain): WalletAdapter {
  const adapter = adapters[chain];
  if (!adapter) throw new Error(`No adapter for chain: ${chain}`);
  return adapter;
}
