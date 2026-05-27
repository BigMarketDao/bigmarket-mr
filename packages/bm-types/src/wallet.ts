export type Chain = "stacks" | "solana" | "sui" | "ethereum";

export type WalletAccount = {
  chain: Chain;
  address: string;
  mappedAddress?: string;
  type?: string; // e.g. 'payment', 'ordinal'
};

export type WalletState = {
  status: "connected" | "unknown" | "disconnected";
  chain: Chain;
  accounts: WalletAccount[];
  activeAccount?: WalletAccount;
  /** EVM wallet USDC balance in micro-units (6 dp), serialised as string for localStorage. */
  ethUsdcBalance?: string;
  raw?: unknown;
};
