export type Chain = "stacks" | "sui" | "solana" | "ethereum";

export type WalletSession = {
  connected: boolean;
  addresses: Record<string, string | null>;
  /** Hex chain id from `eth_chainId`, when available (EIP-155). */
  chainId?: string;
  raw?: any;
};

export interface WalletAdapter {
  connect(opts?: any): Promise<void>;
  disconnect(): Promise<void>;
  getSession(): Promise<WalletSession>;
}
