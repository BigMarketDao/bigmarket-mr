import { type Eip1193Provider } from "@bigmarket/bm-types";

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
