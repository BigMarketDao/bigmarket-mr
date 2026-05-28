import { get } from "svelte/store";
import type { Chain, WalletAccount, WalletState } from "@bigmarket/bm-types";
import { wallet, getEvmUsdcBalance } from "@bigmarket/sdk";
import { userWalletStore } from "./ui/userWalletStore.js";
import { persisted } from "svelte-local-storage-store";

const browser = typeof (globalThis as any).window !== "undefined";

// ---- STATE ----
const initial: WalletState = {
  status: "unknown",
  chain: "stacks",
  accounts: [],
};
export const walletState = persisted<WalletState>("walletState", initial);

function setWalletChain(chain: Chain) {
  wallet.setChain(chain);

  walletState.update((s) => ({
    ...s,
    chain,
  }));
}

export async function getCreateMappedStacksAddress(
  bmApiUrl: string,
  sourceChain: string,
  sourceAddress: string,
): Promise<{ mappedAddress: string }> {
  const path = `${bmApiUrl}/cross-chain/mappings/${sourceChain}/${sourceAddress}`;
  const response = await fetch(path);
  const mappedAddress = await response.json();
  return mappedAddress;
}

async function getWalletSession(bmApiUrl?: string) {
  const current: WalletState = get(walletState);
  const session = await wallet.getSession();
  if (!session?.connected) return null;

  let mappedAddress: string | undefined = current.activeAccount?.mappedAddress;

  const sol = session.addresses?.solana ?? null;
  const evm = session.addresses?.ethereum ?? null;
  const stx = session.addresses?.stacks ?? null;
  const btc = session.addresses?.bitcoin ?? null;
  const ord = session.addresses?.ordinal ?? null;

  if (current.chain === "solana" && !mappedAddress && sol && bmApiUrl) {
    const result = await getCreateMappedStacksAddress(bmApiUrl, "solana", sol);
    mappedAddress = result.mappedAddress;
  }

  if (current.chain === "ethereum" && !mappedAddress && evm && bmApiUrl) {
    const result = await getCreateMappedStacksAddress(bmApiUrl, "evm", evm);
    mappedAddress = result.mappedAddress;
  }

  if (current.chain === "stacks" && !mappedAddress && stx && bmApiUrl) {
    const result = await getCreateMappedStacksAddress(bmApiUrl, "stacks", stx);
    mappedAddress = result.mappedAddress;
  }

  const accounts: WalletAccount[] = [
    ...(sol
      ? [
          {
            chain: "solana" as const,
            address: sol,
            type: "sol",
            mappedAddress:
              current.chain === "solana" ? mappedAddress : undefined,
          },
        ]
      : []),
    ...(stx
      ? [
          {
            chain: "stacks" as const,
            address: stx,
            type: "stx",
            mappedAddress:
              current.chain === "stacks" ? mappedAddress : undefined,
          },
        ]
      : []),
    ...(btc ? [{ chain: "stacks" as const, address: btc, type: "btc" }] : []),
    ...(ord
      ? [{ chain: "stacks" as const, address: ord, type: "ordinal" }]
      : []),
    ...(evm
      ? [
          {
            chain: "ethereum" as const,
            address: evm,
            type: "eth",
            mappedAddress:
              current.chain === "ethereum" ? mappedAddress : undefined,
          },
        ]
      : []),
  ];

  const activeAccount =
    (current.chain === "solana"
      ? accounts.find((a) => a.type === "sol")
      : undefined) ??
    (current.chain === "ethereum"
      ? accounts.find((a) => a.type === "eth")
      : undefined) ??
    accounts.find((a) => a.type === "stx") ??
    accounts[0];

  return {
    connected: true as const,
    accounts,
    activeAccount,
  };
}

async function refreshWalletState(bmApiUrl?: string): Promise<void> {
  const current = get(walletState);
  const session = await getWalletSession(bmApiUrl);
  if (session?.connected && session?.accounts?.length > 0) {
    // Spread current first so cached fields (e.g. ethUsdcBalance) survive the
    // refresh. Session fields (accounts, activeAccount) override as expected.
    walletState.set({
      ...current,
      status: "connected",
      chain: current.chain,
      ...session,
    });
  } else {
    walletState.set({
      status: "disconnected",
      chain: current.chain,
      accounts: [],
    });
  }
}

// ---- INIT (called in layout or app start) ----
export async function initWallet(bmApiUrl?: string): Promise<void> {
  if (!browser) return;

  wallet.setChain(get(walletState).chain);
  await refreshWalletState(bmApiUrl);
}

// ---- ACTIONS ----
export async function connectWallet(
  bmApiUrl?: string,
  chain?: Chain,
  opts?: any,
) {
  if (!browser) return;
  if (chain) {
    setWalletChain(chain);
  }
  await wallet.connect(opts);
  await refreshWalletState(bmApiUrl);
}

export async function disconnectWallet() {
  if (!browser) return;
  await wallet.disconnect();
  wallet.setChain("stacks");
  walletState.set({ status: "disconnected", chain: "stacks", accounts: [] });
}

// ---- ON-CHAIN DATA ----

/**
 * Read the connected EVM wallet's USDC balance (6 dp micro-units) via
 * MetaMask's eth_call and persist it in walletState.ethUsdcBalance.
 *
 * Only updates the store when the fetch succeeds (non-null result).
 * A null result means MetaMask was unavailable, the chain is unsupported,
 * or the call failed — in those cases the previously stored value is kept
 * so a temporary unavailability does not zero out a known balance.
 */
export async function fetchEvmUsdcBalance(ethAddress: string): Promise<void> {
  if (!browser) return;
  const balance = await getEvmUsdcBalance(ethAddress);
  if (balance === null) return;
  walletState.update((s) => ({ ...s, ethUsdcBalance: balance.toString() }));
}

export async function fetchWalletData(stacksApi: string): Promise<void> {
  if (!browser) return;
  const stxAddr = getStxAddress();
  if (!stxAddr || stxAddr === "??" || stxAddr === "?") return;

  try {
    const [balRes, infoRes] = await Promise.all([
      fetch(`${stacksApi}/extended/v1/address/${stxAddr}/balances`),
      fetch(`${stacksApi}/v2/info`),
    ]);

    if (balRes.ok) {
      const data = await balRes.json();
      const stxBalance = {
        ...data.stx,
        balance: parseInt(data.stx?.balance ?? "0", 10),
      };
      const normalized = { ...data, stx: stxBalance };
      userWalletStore.update((s) => ({
        ...s,
        balances: normalized,
        tokenBalances: normalized,
      }));
    }

    if (infoRes.ok) {
      const stacksInfo = await infoRes.json();
      userWalletStore.update((s) => ({ ...s, stacksInfo }));
    }
  } catch {
    // Non-fatal — balances remain at persisted/default values.
  }
}

// ---- SELECTORS ----
export function isLoggedIn(): boolean {
  const s = get(walletState);
  return s.status === "connected" && s.accounts.length > 0;
}

export function getStxAddress(): string {
  const s = get(walletState);
  if (s.status !== "connected") return "unknown";
  if (s.chain === "solana" || s.chain === "ethereum") {
    return s.activeAccount?.mappedAddress ?? "?";
  }
  return (
    s.accounts.find((a: WalletAccount) => a.type === "stx")?.address ?? "?"
  );
}

/** Returns the mapped relay Stacks address for the active account (all chains). */
export function getMappedAddress(): string {
  return get(walletState).activeAccount?.mappedAddress ?? "";
}

export function getBtcAddress(): string {
  const s = get(walletState);
  if (s.status !== "connected") return "??";
  return (
    s.accounts.find((a: WalletAccount) => a.type === "btc")?.address ?? "?"
  );
}

export function getOrdAddress(): string {
  const s = get(walletState);
  if (s.status !== "connected") return "??";
  return (
    s.accounts.find((a: WalletAccount) => a.type === "ordinal")?.address ?? "?"
  );
}

export function getWalletStatus(): WalletState["status"] {
  return get(walletState).status;
}
