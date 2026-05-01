import type { TxResult } from "@bigmarket/bm-types";
import {
  deserializeCV,
  type ClarityValue,
  type PostCondition,
} from "@stacks/transactions";

export async function callContract(
  contractAddress: string,
  contractName: string,
  network: string,
  functionName: string,
  functionArgs: Array<ClarityValue>,
  postConditions: Array<PostCondition> = [],
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
export async function isDaoConstructed(
  stacksApi: string,
  contractAddress: string,
): Promise<boolean> {
  let constructed = false;
  try {
    const result = await fetchDataVar(
      stacksApi,
      contractAddress.split(".")[0],
      contractAddress.split(".")[1],
      "executive",
    );
    if (result && result.data) {
      const clarityValue = deserializeCV(result.data);
      // executive is only given a value by the construct call
      if (clarityValue && clarityValue.type === "contract") constructed = true;
    }
  } catch (err: any) {}
  return constructed;
}

export async function fetchDataVar(
  stacksApi: string,
  contractAddress: string,
  contractName: string,
  dataVarName: string,
  stacksHiroKey?: string,
) {
  let url: string = "";
  let result: any | null = null;
  try {
    //checkAddressForNetwork(getConfig().network, contractAddress)
    url = `${stacksApi}/v2/data_var/${contractAddress}/${contractName}/${dataVarName}`;
    const response = await fetch(url, {
      headers: { ...(stacksHiroKey ? { "x-api-key": stacksHiroKey } : {}) },
    });
    result = await response.json();
    return result;
  } catch (err) {
    console.log("fetchDataVar: url: " + url);
    console.log("fetchDataVar: result: " + result);
    console.log(
      "fetchDataVar: dataVarName: " +
        dataVarName +
        " : " +
        (err as { message: string }).message +
        " contractName: " +
        contractName,
    );
  }
}
