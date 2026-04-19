export type Chain = "stacks" | "sui" | "solana";

export type WalletSession = {
  connected: boolean;
  addresses: Record<string, string | null>;
  raw?: any;
};

export interface WalletAdapter {
  connect(opts?: any): Promise<void>;
  disconnect(): Promise<void>;
  getSession(): Promise<WalletSession>;
}