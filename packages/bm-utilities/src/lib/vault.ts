import type { VaultUserChain } from "@bigmarket/bm-types";

export type MappedDepositToVaultResult = {
  mappedAddress: string;
  amount: string;
  txid: string;
};

export async function requestMappedDepositToVault(
  bmApiUrl: string,
  sourceChain: VaultUserChain,
  sourceAddress: string,
): Promise<MappedDepositToVaultResult> {
  const path = `${bmApiUrl}/cross-chain/mappings/${encodeURIComponent(sourceChain)}/${encodeURIComponent(sourceAddress)}/deposit-to-vault`;
  const res = await fetch(path, { method: "POST" });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}
