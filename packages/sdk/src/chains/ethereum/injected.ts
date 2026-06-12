import { type Eip1193Provider } from "@bigmarket/bm-types";

export function formatEip1193ConnectError(err: unknown): string {
  const e = err as { code?: number; message?: string };
  if (e?.code === -32002) {
    return "MetaMask already has a connection request open. Check the extension popup and approve it, then try again.";
  }
  if (e?.code === 4001) {
    return "Connection rejected in MetaMask.";
  }
  if (typeof e?.message === "string" && e.message.length > 0) {
    return e.message;
  }
  return String(err);
}

export function toEip1193(
  provider: Record<string, unknown> | undefined,
): Eip1193Provider | undefined {
  if (!provider || typeof provider !== "object") return undefined;
  if (!("request" in provider) || typeof provider.request !== "function") {
    return undefined;
  }
  return provider as unknown as Eip1193Provider;
}

/** Browsers with multiple extensions expose competing providers on `ethereum.providers`. */
export function injectedEthereumCandidates(): Record<string, unknown>[] {
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

export function findMetaMask(): Eip1193Provider | undefined {
  for (const raw of injectedEthereumCandidates()) {
    const p = toEip1193(raw);
    if (p?.isMetaMask) return p;
  }
  return undefined;
}

export function getMetaMask(): Eip1193Provider {
  const provider = findMetaMask();

  if (!provider) {
    throw new Error(
      "MetaMask not found. Install MetaMask, or if several wallets are installed, pick MetaMask as the active Ethereum provider (see the wallet extension’s settings).",
    );
  }

  return provider;
}
