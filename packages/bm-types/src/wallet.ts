export type Chain = "stacks" | "solana" | "sui";

export type WalletAccount = {
  chain: Chain;
  address: string;
  type?: string; // e.g. 'payment', 'ordinal'
};

export type WalletState =
  | { status: "unknown" }
  | { status: "disconnected" }
  | {
      status: "connected";
      accounts: WalletAccount[];
      activeAccount?: WalletAccount;
      raw?: unknown;
    };
