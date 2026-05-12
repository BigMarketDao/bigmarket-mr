import type { Chain, WalletAdapter } from "../wallet/types.js";
import { stacksAdapter } from "../chains/stacks/adapter.js";
import { solanaAdapter } from "../chains/solana/adapter.js";
import { ethereumAdapter } from "../chains/ethereum/adapter.js";

const adapters: Record<Chain, WalletAdapter> = {
  stacks: stacksAdapter,
  sui: undefined as any, // placeholder
  solana: solanaAdapter,
  ethereum: ethereumAdapter,
};

export function getAdapter(chain: Chain): WalletAdapter {
  const adapter = adapters[chain];
  if (!adapter) throw new Error(`No adapter for chain: ${chain}`);
  return adapter;
}
