export type ChainInfo = {
  stacks: StacksInfo;
};

export type StacksInfo = {
  burn_block_height: number;
  stacks_tip_height?: number;
  server_version?: string;
  network_id?: number;
};

export type Contract = {
  tx_id: string;
  source_code?: string;
};

export type PhantomEvent = "connect" | "disconnect" | "accountChanged";

export type PhantomSolanaProvider = {
  isPhantom?: boolean;
  isConnected: boolean;
  publicKey?: { toString(): string };

  connect(opts?: { onlyIfTrusted?: boolean }): Promise<{
    publicKey: { toString(): string };
  }>;

  disconnect(): Promise<void>;

  on(event: PhantomEvent, handler: (...args: any[]) => void): void;
  removeListener?(event: PhantomEvent, handler: (...args: any[]) => void): void;
};

export type CreatedStacksWallet = {
  sourceChain: string;
  sourceAddress: string;
  mappedChain: string;
  mappedAddress: string;
  privateKey: string;
  network: "mainnet" | "testnet" | "devnet";
  createdAt: Date;
};
