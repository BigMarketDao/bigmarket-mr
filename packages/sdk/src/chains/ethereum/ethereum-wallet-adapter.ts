import type { Eip1193Provider } from "@bigmarket/bm-types";
import type { WalletAdapter, WalletSession } from "../../wallet/types.js";
import { findMetaMask, formatEip1193ConnectError, getMetaMask } from "./injected.js";

let connectInFlight: Promise<void> | null = null;

function attachMetaMaskListeners(provider: Eip1193Provider) {
  provider.on("accountsChanged", (accounts: string[]) => {
    console.log("accountsChanged", accounts);
  });

  provider.on("chainChanged", (chainId: string) => {
    console.log("chainChanged", chainId);
    window.location.reload();
  });
}

/** MetaMask session only — no Web3/Allbridge (safe for SSR bundles via {@link ../internal/registry.js}). */
export const ethereumWalletAdapter: WalletAdapter = {
  async connect() {
    if (connectInFlight) {
      return connectInFlight;
    }

    connectInFlight = (async () => {
      const provider = getMetaMask();

      const existing = await provider.request<string[]>({
        method: "eth_accounts",
      });
      if (existing.length === 0) {
        await provider.request<string[]>({
          method: "eth_requestAccounts",
        });
      }

      attachMetaMaskListeners(provider);
    })().catch((err) => {
      throw new Error(formatEip1193ConnectError(err));
    }).finally(() => {
      connectInFlight = null;
    });

    return connectInFlight;
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
