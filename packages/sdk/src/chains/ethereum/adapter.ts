import { type Eip1193Provider } from "@bigmarket/bm-types";
import type { WalletAdapter, WalletSession } from "../../wallet/types.js";

function toEip1193(
  provider: Record<string, unknown> | undefined,
): Eip1193Provider | undefined {
  if (!provider || typeof provider !== "object") return undefined;
  if (!("request" in provider) || typeof provider.request !== "function") {
    return undefined;
  }
  return provider as unknown as Eip1193Provider;
}

/** Browsers with multiple extensions expose competing providers on `ethereum.providers`. */
function injectedEthereumCandidates(): Record<string, unknown>[] {
  const root = window.ethereum as
    | (Record<string, unknown> & { providers?: unknown })
    | undefined;
  if (!root) return [];
  const list = root.providers;
  if (Array.isArray(list)) {
    return list.filter(
      (p): p is Record<string, unknown> => p !== null && typeof p === "object",
    );
  }
  return [root];
}

function findMetaMask(): Eip1193Provider | undefined {
  for (const raw of injectedEthereumCandidates()) {
    const p = toEip1193(raw);
    if (p?.isMetaMask) return p;
  }
  return undefined;
}

function getMetaMask(): Eip1193Provider {
  const provider = findMetaMask();

  if (!provider) {
    throw new Error(
      "MetaMask not found. Install MetaMask, or if several wallets are installed, pick MetaMask as the active Ethereum provider (see the wallet extension’s settings).",
    );
  }

  return provider;
}

export const ethereumAdapter: WalletAdapter = {
  async connect() {
    const provider = getMetaMask();

    await provider.request<string[]>({
      method: "eth_requestAccounts",
    });

    provider.on("accountsChanged", (accounts: string[]) => {
      console.log("accountsChanged", accounts);
    });

    provider.on("chainChanged", (chainId: string) => {
      console.log("chainChanged", chainId);
      window.location.reload();
    });
  },

  async disconnect() {
    // MetaMask does not support true programmatic disconnect in the same way Phantom Solana does.
    // Usually you clear your local app session.
  },

  async getSession(): Promise<WalletSession> {
    const provider = findMetaMask();

    if (!provider) {
      return { connected: false, addresses: {} };
    }

    const accounts = await provider.request<string[]>({
      method: "eth_accounts",
    });

    const chainId = await provider.request<string>({
      method: "eth_chainId",
    });

    return {
      connected: accounts.length > 0,
      addresses: {
        ethereum: accounts[0] ?? null,
      },
      chainId,
      raw: provider,
    };
  },
};
