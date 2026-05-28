/**
 * EVM token balance helpers.
 *
 * Reads ERC-20 balanceOf via the injected MetaMask provider (eth_call) so
 * no additional RPC URL or API key is required — MetaMask routes the call
 * to whichever network it is currently connected to.
 */

import { findMetaMask } from "./injected.js";

/** USDC contract addresses keyed by EVM chainId. */
const USDC_BY_CHAIN: Record<number, string> = {
  1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",         // Ethereum Mainnet
  11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Sepolia
  5: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",          // Goerli (legacy)
};

function usdcContractAddress(chainId: number): string | undefined {
  return USDC_BY_CHAIN[chainId];
}

/**
 * Read the ERC-20 USDC balance for `ethAddress` on whatever network
 * MetaMask is currently connected to.
 *
 * Returns `null` when the balance cannot be determined (MetaMask not
 * available, unsupported chain, or any call error) so callers can
 * distinguish "fetch failed" from "balance is genuinely 0".
 *
 * Returns `0n` only when the on-chain call succeeds and the contract
 * reports a zero balance.
 *
 * USDC uses 6 decimal places on all supported chains.
 */
export async function getEvmUsdcBalance(
  ethAddress: string,
): Promise<bigint | null> {
  try {
    const provider = findMetaMask();
    if (!provider) return null;

    const chainIdHex = await provider.request<string>({ method: "eth_chainId" });
    const chainId = parseInt(chainIdHex, 16);
    const contract = usdcContractAddress(chainId);
    if (!contract) return null;

    // ERC-20 balanceOf(address) — selector 0x70a08231
    const paddedAddr = ethAddress.toLowerCase().replace(/^0x/, "").padStart(64, "0");
    const data = `0x70a08231${paddedAddr}`;

    const result = await provider.request<string>({
      method: "eth_call",
      params: [{ to: contract, data }, "latest"],
    });

    if (!result || result === "0x" || result === "0x0") return 0n;
    return BigInt(result);
  } catch {
    return null;
  }
}
