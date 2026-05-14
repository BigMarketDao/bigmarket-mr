import type { WalletAdapter, WalletSession } from "../../wallet/types.js";
import { findMetaMask, getMetaMask } from "./injected.js";

/** MetaMask session only — no Web3/Allbridge (safe for SSR bundles via {@link ../internal/registry.js}). */
export const ethereumWalletAdapter: WalletAdapter = {
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
