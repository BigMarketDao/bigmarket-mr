export type StacksInfo = {
  burn_block_height: number;
  stacks_tip_height?: number;
  server_version?: string;
  network_id?: number;
};

export type UserWalletType = {
  loggedIn: boolean;
  balances?: StacksBalance;
  keySets: { [key: string]: AddressObject };
  tokens: Array<TokenPermissionEvent>;
  tokenBalances: TokenBalances;
  walletSigningMode: boolean;
  stacksInfo?: StacksInfo;
};
export type StacksBalance = {
  stx: {
    balance: number;
    total_sent: number;
    total_received: number;
    total_fees_sent: number;
    total_miner_rewards_received: number;
    lock_tx_id: string;
    locked: number;
    lock_height: number;
    burnchain_lock_height: number;
    burnchain_unlock_height: number;
  };
  fungible_tokens: Array<FungibleToken>;
  non_fungible_tokens: Array<NonFungibleToken>;
};
export type FungibleToken = {
  identifier: {
    balance: number;
    total_sent: number;
    total_received: number;
  };
};
export type NonFungibleToken = {
  identifier: {
    count: number;
    total_sent: number;
    total_received: number;
  };
};
export type AddressObject = {
  stxAddress: string;
  cardinal: string;
  ordinal: string;
  sBTCBalance: number;
  stxBalance?: number;
  bnsNameInfo?: any;
  btcPubkeySegwit0?: string;
  btcPubkeySegwit1?: string;
};
export interface BasicEvent {
  _id?: string;
  event: string;
  event_index: number;
  txId: string;
  daoContract: string;
  extension: string;
}

export interface TokenPermissionEvent extends BasicEvent {
  marketType: number;
  allowed: boolean;
  token: string;
  sip10Data?: Sip10Data;
  minLiquidity?: number;
}
export type Sip10Data = {
  symbol: string;
  name: string;
  decimals: number;
  balance: number;
  totalSupply: number;
  tokenUri: string;
};
export type TokenBalances = {
  stx: {
    balance: number;
    total_sent: number;
    total_received: number;
    lock_tx_id: string;
    locked: number;
    lock_height: number;
    burnchain_lock_height: number;
    burnchain_unlock_height: number;
  };
  fungible_tokens: any;
  non_fungible_tokens: any;
};
