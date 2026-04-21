import { cvToJSON, deserializeCV } from "@stacks/transactions";

export async function callContractReadOnly(
  stacksApi: string,
  data: any,
  stacksHiroKey?: string,
) {
  let url = `${stacksApi}/v2/contracts/call-read/${data.contractAddress}/${data.contractName}/${data.functionName}`;
  if (data.tip) {
    url += "?tip=" + data.tip;
  }
  let val;
  try {
    console.log("callContractReadOnly: url: ", url);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(stacksHiroKey ? { "x-api-key": stacksHiroKey } : {}),
      },
      body: JSON.stringify({
        arguments: data.functionArgs,
        sender: data.contractAddress,
      }),
    });
    val = await response.json();
  } catch (err) {
    console.error("callContractReadOnly4: ", err);
  }
  try {
    const result = cvToJSON(deserializeCV(val.result));
    return result;
  } catch (err: any) {
    console.error("Error: callContractReadOnly: ", val);
    return val;
  }
}
