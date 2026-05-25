import { c32addressDecode } from "c32check";
import { hexToBytes } from "@stacks/common";
import { VaultUserChain } from "@bigmarket/bm-types";
import { bufferCV } from "@stacks/transactions";
import { normalizeVaultSourceChain } from "../vault.js";

/** Matches `CHAIN_*` constants in bme050-0-vault.clar */
export const VAULT_CHAIN_ID = {
  evm: hexToBytes("0x00000001"),
  stacks: hexToBytes("0x00000003"),
  solana: hexToBytes("0x00000004"),
} as const;

type VaultSourceChain = keyof typeof VAULT_CHAIN_ID;

export function vaultChainIdCV(sourceChain: string) {
  const normalized = normalizeVaultSourceChain(sourceChain) as VaultSourceChain;
  return bufferCV(Buffer.from(VAULT_CHAIN_ID[normalized]));
}

/** Left-pad a 20-byte address to 32 bytes (vault storage format). */
export function padAddress20To32(addr20: Uint8Array): Uint8Array {
  if (addr20.length !== 20) {
    throw new Error(`Expected 20-byte address, got ${addr20.length}`);
  }
  const out = new Uint8Array(32);
  out.set(addr20, 12);
  return out;
}

export function vaultChainIdBuffer(chain: VaultUserChain): Uint8Array {
  return VAULT_CHAIN_ID[chain];
}

export function vaultUserAddressBuffer(
  chain: VaultUserChain,
  sourceAddress: string,
): Uint8Array {
  if (chain === "evm") {
    const hex = sourceAddress.trim().replace(/^0x/i, "");
    if (hex.length !== 40) {
      throw new Error("EVM address must be 20 bytes (40 hex chars)");
    }
    return padAddress20To32(hexToBytes(hex));
  }

  if (chain === "stacks") {
    const [, hash160hex] = c32addressDecode(sourceAddress);
    return padAddress20To32(hexToBytes(hash160hex));
  }

  if (chain === "solana") {
    const hex = sourceAddress.trim().replace(/^0x/i, "");
    const bytes = hexToBytes(hex.length > 0 ? `0x${hex}` : sourceAddress);
    if (bytes.length !== 32) {
      throw new Error("Solana address must be 32 bytes");
    }
    return bytes;
  }

  return padAddress20To32(new Uint8Array(20));
}
