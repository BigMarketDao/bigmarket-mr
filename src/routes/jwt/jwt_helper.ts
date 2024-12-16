import { getConfig } from "../../lib/config";

let uris: any = {};
const gateway = "https://hashone.mypinata.cloud/";
const gatewayAr = "https://arweave.net/";

async function getNftHoldingsByPage(
  stxAddress: string,
  limit: number,
  offset: number
): Promise<any> {
  const url =
    getConfig().suiApi +
    "/extended/v1/tokens/nft/holdings?principal=" +
    stxAddress +
    "&limit=" +
    limit +
    "&offset=" +
    offset;
  console.log("url: ", url);
  const response = await fetch(url);
  const val = await response.json();
  return val;
}
