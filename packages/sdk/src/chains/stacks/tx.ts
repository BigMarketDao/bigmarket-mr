import type { TxResult } from "@bigmarket/bm-types";
import { type ClarityValue, type PostCondition } from "@stacks/transactions";

export async function callContract(
  contractAddress: string,
  contractName: string,
  network: string,
  functionName: string,
  functionArgs: Array<ClarityValue>,
  postConditions?: Array<PostCondition>,
  postConditionMode: "allow" | "deny" = "deny",
): Promise<TxResult> {
  const { request } = await import("@stacks/connect");

  try {
    const res = await request("stx_callContract", {
      contract: `${contractAddress}.${contractName}`,
      functionName,
      functionArgs,
      network,
      postConditions: postConditions ?? [],
      postConditionMode,
    });

    const txid = (res as { txid?: unknown } | null | undefined)?.txid;

    if (typeof txid !== "string" || txid.length === 0) {
      return { success: false, error: "Wallet response missing txid" };
    }

    return { success: true, txid };
  } catch (e) {
    console.error("Wallet request failed", e);

    return {
      success: false,
      error: e instanceof Error ? e.message : "Wallet request failed",
    };
  }
}
