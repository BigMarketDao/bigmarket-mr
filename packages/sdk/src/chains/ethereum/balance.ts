/**
 * EVM token balance helpers.
 *
 * Reads ERC-20 balanceOf preferring the injected MetaMask provider.
 * When the app's configured network disagrees with MetaMask's current chain
 * (e.g. app is testnet but MetaMask is on mainnet) the call is re-routed to
 * a public JSON-RPC for the expected chain so the balance always reflects the
 * network the app is actually running on.
 */

import { findMetaMask } from "./injected.js";

/** USDC contract addresses keyed by EVM chainId. */
const USDC_BY_CHAIN: Record<number, string> = {
  1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",         // Ethereum Mainnet
  11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Sepolia
  5: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",          // Goerli (legacy)
};

/**
 * Public JSON-RPC endpoints used as fallback when MetaMask is on the wrong
 * network. No API key required.
 */
const PUBLIC_RPC_BY_CHAIN: Record<number, string> = {
  1: "https://ethereum.publicnode.com",
  11155111: "https://ethereum-sepolia-rpc.publicnode.com",
};

/**
 * Map from BigMarket app network name → EVM chain ID.
 * devnet and testnet both target Sepolia.
 */
const APP_NETWORK_TO_CHAIN_ID: Record<string, number> = {
  mainnet: 1,
  testnet: 11155111,
  devnet: 11155111,
};

function usdcContractAddress(chainId: number): string | undefined {
  return USDC_BY_CHAIN[chainId];
}

/** Raw JSON-RPC eth_call to an arbitrary endpoint (used when MetaMask is on the wrong chain). */
async function ethCallViaRpc(
  rpcUrl: string,
  to: string,
  data: string,
): Promise<string> {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to, data }, "latest"],
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result as string;
}

/**
 * Read the ERC-20 USDC balance for `ethAddress` on the chain that matches
 * the app's configured network.
 *
 * - When `appNetwork` is supplied (e.g. "mainnet" | "testnet" | "devnet")
 *   the expected EVM chain ID is derived from it.  If MetaMask is already on
 *   that chain it is used directly; otherwise the balance is fetched via a
 *   public JSON-RPC for the expected chain so the result always reflects the
 *   right network.
 * - When `appNetwork` is omitted the behaviour falls back to using whatever
 *   chain MetaMask is currently on (original behaviour).
 *
 * Returns `null` when the balance cannot be determined (provider unavailable,
 * unsupported chain, call failed) so callers can distinguish "fetch failed"
 * from "balance is genuinely 0".
 *
 * Returns `0n` only when the on-chain call succeeds and the contract reports
 * a zero balance.
 *
 * USDC uses 6 decimal places on all supported chains.
 */
export async function getEvmUsdcBalance(
  ethAddress: string,
  appNetwork?: string,
): Promise<bigint | null> {
  try {
    // Determine target chain: prefer app-network mapping, fall back to MetaMask's current chain.
    const targetChainId = appNetwork
      ? APP_NETWORK_TO_CHAIN_ID[appNetwork]
      : undefined;

    // ERC-20 balanceOf(address) — selector 0x70a08231
    const paddedAddr = ethAddress.toLowerCase().replace(/^0x/, "").padStart(64, "0");
    const data = `0x70a08231${paddedAddr}`;

    let result: string;

    const provider = findMetaMask();

    if (provider) {
      const chainIdHex = await provider.request<string>({ method: "eth_chainId" });
      const metaMaskChainId = parseInt(chainIdHex, 16);
      const resolvedChainId = targetChainId ?? metaMaskChainId;
      const contract = usdcContractAddress(resolvedChainId);
      if (!contract) return null;

      if (metaMaskChainId === resolvedChainId) {
        // MetaMask is on the correct chain — use it directly (no extra RPC needed).
        result = await provider.request<string>({
          method: "eth_call",
          params: [{ to: contract, data }, "latest"],
        }) as string;
      } else {
        // MetaMask is on a different chain — route to the public RPC for the target chain.
        const rpcUrl = PUBLIC_RPC_BY_CHAIN[resolvedChainId];
        if (!rpcUrl) return null;
        result = await ethCallViaRpc(rpcUrl, contract, data);
      }
    } else {
      // No MetaMask available — try public RPC if we know the target chain.
      if (!targetChainId) return null;
      const contract = usdcContractAddress(targetChainId);
      if (!contract) return null;
      const rpcUrl = PUBLIC_RPC_BY_CHAIN[targetChainId];
      if (!rpcUrl) return null;
      result = await ethCallViaRpc(rpcUrl, contract, data);
    }

    if (!result || result === "0x" || result === "0x0") return 0n;
    return BigInt(result);
  } catch {
    return null;
  }
}
