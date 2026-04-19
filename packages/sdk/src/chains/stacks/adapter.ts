import type { WalletAdapter, WalletSession } from "../../wallet/types";

export const stacksAdapter: WalletAdapter = {
  async connect(opts?: any) {
    const { connect, isConnected } = await import("@stacks/connect");

    if (!(await isConnected())) {
      await connect({ forceWalletSelect: true, ...opts });
    }
  },

  async disconnect() {
    const { disconnect } = await import("@stacks/connect");
    await disconnect();
  },

  async getSession(): Promise<WalletSession> {
    const { isConnected, getLocalStorage } = await import("@stacks/connect");

    const connected = await isConnected();

    if (!connected) {
      return { connected: false, addresses: {} };
    }

    const data = await getLocalStorage();

    return {
      connected: true,
      addresses: {
        stacks: data?.addresses?.stx?.[0]?.address ?? null,
        bitcoin: data?.addresses?.btc?.[0]?.address ?? null,
        ordinal: data?.addresses?.btc?.[1]?.address ?? null,
      },
      raw: data,
    };
  },
};
