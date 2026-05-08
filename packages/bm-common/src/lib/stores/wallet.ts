import { get, writable } from "svelte/store";
import type { Chain, WalletAccount, WalletState } from "@bigmarket/bm-types";
import { wallet } from "@bigmarket/sdk";
import { userWalletStore } from "./ui/userWalletStore.js";
import { persisted } from "svelte-local-storage-store";
import { createStacksWallet } from "@bigmarket/sdk/dist/chains/stacks/createStacksWallet.js";

const browser = typeof (globalThis as any).window !== "undefined";

async function getWalletSession(bmApiUrl?: string) {
  const current: WalletState = get(walletState);
  const session = await wallet.getSession();
  if (!session?.connected) return null;

  let mappedAddress: string | undefined = current.activeAccount?.mappedAddress;
  if (current.chain === "solana" && !current.activeAccount?.mappedAddress) {
    const session = await wallet.getSession();
    const solanaAddress = session.addresses?.solana;

    if (solanaAddress && bmApiUrl) {
      const result = await getCreateMappedStacksAddress(
        bmApiUrl,
        "solana",
        solanaAddress,
      );
      mappedAddress = result.mappedAddress;
    }
  }

  const sol = session.addresses?.solana ?? null;
  const stx = session.addresses?.stacks ?? null;
  const btc = session.addresses?.bitcoin ?? null;
  const ord = session.addresses?.ordinal ?? null;

  const accounts: WalletAccount[] = [
    ...(sol
      ? [
          {
            chain: "solana" as const,
            address: sol,
            type: "sol",
            mappedAddress,
          },
        ]
      : []),
    ...(stx ? [{ chain: "stacks" as const, address: stx, type: "stx" }] : []),
    ...(btc ? [{ chain: "stacks" as const, address: btc, type: "btc" }] : []),
    ...(ord
      ? [{ chain: "stacks" as const, address: ord, type: "ordinal" }]
      : []),
  ];
  return {
    connected: true as const,
    accounts,
    activeAccount: accounts.find((a) => a.type === "stx") ?? accounts[0],
    //raw: session.raw,
  };
}

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

async function refreshWalletState(bmApiUrl?: string): Promise<void> {
  const current = get(walletState);
  const session = await getWalletSession(bmApiUrl);

  if (session?.connected) {
    walletState.set({
      status: "connected",
      chain: current.chain,
      ...session,
    });
  } else {
    walletState.set({
      status: "disconnected",
      chain: current.chain,
      accounts: current.accounts,
    });
  }
}

// ---- INIT (called in layout or app start) ----
// Idempotent: every caller awaits the same one-shot read from the SDK adapter,
// so UI can gate rendering on this promise without racing the store.
let initPromise: Promise<void> | null = null;

export async function initWallet(bmApiUrl?: string): Promise<void> {
  if (!browser) return;

  // if (!initPromise) {
  wallet.setChain(get(walletState).chain);
  await refreshWalletState(bmApiUrl);
  // }

  return;
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
  walletState.set({ status: "disconnected", chain: "stacks", accounts: [] });
}

// ---- ON-CHAIN DATA ----
// Fetches live balances and chain info from the Stacks API and writes them
// into userWalletStore so UI components have real data to display.
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
      // The Stacks API returns STX balance as a string; parse to number for
      // compatibility with the existing StacksBalance / TokenBalances types.
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

// ---- SELECTORS (unchanged idea) ----
export function isLoggedIn(): boolean {
  const s = get(walletState);
  return s.status === "connected" && s.accounts.length > 0;
}

export function getStxAddress(): string {
  const s = get(walletState);
  if (s.status !== "connected") return "unknown";
  if (s.chain === "solana") {
    return s.activeAccount?.mappedAddress ?? "?";
  }
  return (
    s.accounts.find((a: WalletAccount) => a.type === "stx")?.address ?? "?"
  );
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
