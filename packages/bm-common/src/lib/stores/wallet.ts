import { get } from "svelte/store";
import type { Chain, WalletAccount, WalletState } from "@bigmarket/bm-types";
import { wallet } from "@bigmarket/sdk";
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

  if (current.chain === "solana" && !mappedAddress && sol && bmApiUrl) {
    const result = await getCreateMappedStacksAddress(bmApiUrl, "solana", sol);
    mappedAddress = result.mappedAddress;
  }

  if (current.chain === "ethereum" && !mappedAddress && evm && bmApiUrl) {
    const result = await getCreateMappedStacksAddress(
      bmApiUrl,
      "ethereum",
      evm,
    );
    mappedAddress = result.mappedAddress;
  }

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
            mappedAddress:
              current.chain === "solana" || current.chain === "ethereum"
                ? mappedAddress
                : undefined,
          },
        ]
      : []),
    ...(stx ? [{ chain: "stacks" as const, address: stx, type: "stx" }] : []),
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
    walletState.set({
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
