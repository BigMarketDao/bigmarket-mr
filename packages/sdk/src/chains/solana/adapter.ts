import { PhantomSolanaProvider } from "@bigmarket/bm-types";
import type { WalletAdapter, WalletSession } from "../../wallet/types.js";

declare global {
  interface Window {
    phantom?: { solana?: PhantomSolanaProvider };
  }
}

function getPhantom(): PhantomSolanaProvider {
  const provider = window.phantom?.solana;

  if (!provider?.isPhantom) {
    throw new Error("Phantom wallet not found");
  }

  return provider;
}

export const solanaAdapter: WalletAdapter = {
  async connect(opts?: { onlyIfTrusted?: boolean }) {
    const phantom = getPhantom();
    phantom?.on("accountChanged", async (publicKey) => {
      console.log("accountChanged", publicKey);
      await solanaAdapter.disconnect();
    });
    // For button-driven wallet flow:
    await phantom.connect(opts);
  },

  async disconnect() {
    const phantom = getPhantom();

    if (phantom?.isConnected) {
      await phantom.disconnect();
    }
  },

  async getSession(): Promise<WalletSession> {
    const phantom = getPhantom();

    if (!phantom?.isPhantom) {
      return { connected: false, addresses: {} };
    }

    // Do NOT call connect() here if you want to avoid silent reconnect.
    const publicKey = phantom.publicKey?.toString() ?? null;

    return {
      connected: Boolean(phantom.isConnected && publicKey),
      addresses: {
        solana: publicKey,
      },
      raw: phantom,
    };
  },
};
