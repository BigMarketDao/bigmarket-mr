import type {
  Chain,
  DaoConfig,
  VaultUserChain,
  WalletState,
} from "@bigmarket/bm-types";
import { get } from "svelte/store";
import { stacks } from "@bigmarket/sdk";
import {
  appConfigStore,
  requireAppConfig,
} from "../stores/config/appConfigStore.js";
import {
  daoConfigStore,
  requireDaoConfig,
} from "../stores/config/daoConfigStore.js";
import { isLoggedIn, walletState } from "../stores/wallet.js";
import { userWalletStore } from "../stores/ui/userWalletStore.js";

const browser =
  typeof (globalThis as { window?: unknown }).window !== "undefined";

export type VaultUsdcxBalanceIdentity = {
  userChain: VaultUserChain;
  /** Vault controller (STX principal or EVM address). */
  sourceAddress: string;
  /** Stacks principal in the vault balance key (relay or same as controller). */
  mappedAddress: string;
};

function vaultUsdcxToken(daoConfig: DaoConfig): string {
  return `${daoConfig.VITE_USDCX_CONTRACT_ADDRESS}.${daoConfig.VITE_USDCX_CONTRACT_NAME}`;
}

/** Only USDCx market stakes can spend from the cross-chain vault ledger. */
export function isVaultControlledToken(
  tokenContract: string,
  daoConfig: DaoConfig,
): boolean {
  return tokenContract === vaultUsdcxToken(daoConfig);
}

export function vaultUserChainFromWallet(chain: Chain): VaultUserChain | null {
  if (chain === "ethereum") return "evm";
  if (chain === "stacks") return "stacks";
  return null;
}

/**
 * Vault `get-balance` identity for the connected wallet.
 * Stacks: controller and mapped are both the STX address (matches vault `deposit`).
 * EVM: controller = ETH address; mapped = relay Stacks address (required).
 */
export function resolveVaultUsdcxBalanceIdentity(
  ws: WalletState,
): VaultUsdcxBalanceIdentity | null {
  if (ws.status !== "connected") return null;

  const stx = ws.accounts.find((a) => a.type === "stx")?.address?.trim() ?? "";
  const eth = ws.accounts.find((a) => a.type === "eth")?.address?.trim() ?? "";
  const mappedRelay = ws.activeAccount?.mappedAddress?.trim() ?? "";

  if (ws.chain === "ethereum" && eth) {
    if (!mappedRelay) return null;
    return {
      userChain: "evm",
      sourceAddress: eth,
      mappedAddress: mappedRelay,
    };
  }

  if (ws.chain === "stacks" && stx) {
    return {
      userChain: "stacks",
      sourceAddress: stx,
      mappedAddress: mappedRelay || stx,
    };
  }

  return null;
}

/** On-chain vault USDCx balance; null if wallet/config/identity not ready. */
export async function fetchVaultUsdcxBalanceMicro(): Promise<bigint | null> {
  if (!browser || !isLoggedIn()) return null;

  const appConfig = get(appConfigStore);
  const daoConfig = get(daoConfigStore);
  if (!appConfig || !daoConfig) return null;

  const identity = resolveVaultUsdcxBalanceIdentity(get(walletState));
  if (!identity) return null;

  const vault = stacks.createVaultClient(requireDaoConfig(daoConfig));
  return vault.getVaultUsdcxBalance(
    requireAppConfig(appConfig).VITE_STACKS_API,
    identity.userChain,
    identity.sourceAddress,
    identity.mappedAddress,
  );
}

/** @deprecated Prefer `fetchVaultUsdcxBalanceMicro`; returns null when not ready (never writes 0). */
export async function readVaultUsdcxBalanceMicro(): Promise<number | null> {
  const micro = await fetchVaultUsdcxBalanceMicro();
  if (micro === null) return null;
  return Number(micro);
}

/** Fetch vault balance and persist on `userWalletStore`. Returns null if not ready. */
export async function refreshVaultUsdcxBalance(): Promise<bigint | null> {
  if (!browser) return null;
  const micro = await fetchVaultUsdcxBalanceMicro();
  if (micro === null) return null;
  userWalletStore.update((s) => ({
    ...s,
    vaultUsdcxBalanceMicro: Number(micro),
  }));
  return micro;
}
