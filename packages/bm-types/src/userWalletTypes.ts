import type { StacksInfo } from "./chainTypes.js";
import type { TokenPermissionEvent } from "./eventTypes.js";

export type VaultBalance = {
  tokenContract: string;
  amount: number;
};
export type WalletBalances = {
  stacks: {
    address: string;
    amount: number;
  };
  cardinal: {
    address: string;
    amount: number;
  };
  ordinal: {
    address: string;
    amount: number;
  };
};
export type AddressMempoolObject = {
  address: string;
  chain_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
  mempool_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
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
  tokenBalances?: TokenBalances;
  /** Token balances for the mapped relay address.
   *  For Stacks users this is a separate ephemeral relay address.
   *  For EVM/Solana users this is the same as tokenBalances (the relay IS their Stacks address). */
  mappedTokenBalances?: TokenBalances;
  /** Vault ledger balance for USDCx (micro). Loaded on wallet init; vault path only applies to USDCx markets. */
  vaultUsdcxBalanceMicro?: number;
  walletBalances?: WalletBalances;
  stxBalance?: number;
  bnsNameInfo?: any;
  cardinalInfo?: AddressMempoolObject;
  ordinalInfo?: AddressMempoolObject;
  btcPubkeySegwit0?: string;
  btcPubkeySegwit1?: string;
  walletSigningMode?: boolean;
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
