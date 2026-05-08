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
  let response;
  try {
    // console.log("callContractReadOnly: url: ", url);
    response = await fetch(url, {
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
    if (!response.ok) {
      console.error(
        "callContractReadOnly4: response not ok: for data: ",
        response,
      );
      console.error(
        "callContractReadOnly4: response not ok: for data: ",
        await response.text(),
      );
      console.error("callContractReadOnly4: response not ok: for data: ", data);
      return null;
    }
    val = await response.json();
  } catch (err) {
    console.error("callContractReadOnly4: ", err);
    //console.log("callContractReadOnly4: response:  ", response);
    return null;
  }
  try {
    if (!val.result) return null;
    const result = cvToJSON(deserializeCV(val.result));
    return result;
  } catch (err: any) {
    console.error("Error: callContractReadOnly: ", val);
    return val;
  }
}
