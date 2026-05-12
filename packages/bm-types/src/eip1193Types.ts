/** EIP-1193 — browser injected Ethereum provider (MetaMask, etc.). */
export type Eip1193RequestArgs = {
  method: string;
  params?: readonly unknown[] | object;
};

export interface Eip1193Provider {
  request<T = unknown>(args: Eip1193RequestArgs): Promise<T>;
  on(event: "accountsChanged", listener: (accounts: string[]) => void): void;
  on(event: "chainChanged", listener: (chainId: string) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
  /** Present when the injected wallet is MetaMask. */
  isMetaMask?: boolean;
}
