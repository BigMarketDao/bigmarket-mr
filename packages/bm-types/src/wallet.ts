export type Chain = "stacks" | "solana" | "sui";

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
  raw?: unknown;
};
