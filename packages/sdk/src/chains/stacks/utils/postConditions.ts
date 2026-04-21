import { TokenPermissionEvent } from "@bigmarket/bm-types";
import {
  Cl,
  NonFungiblePostCondition,
  Pc,
  PostCondition,
} from "@stacks/transactions";

export function isSTX(token: string) {
  return token.toLowerCase().indexOf("stx") > -1;
}

export async function getSip10PostConditions(
  deployer: string,
  repContract: string,
  tier: number,
  tokenEvent: TokenPermissionEvent,
  address: string,
  microAmount: number,
  tierBalance: number,
) {
  const postConditions: Array<PostCondition> = [];
  // the market token post condition
  if (!isSTX(tokenEvent.token)) {
    const formattedToken = (tokenEvent.token.split(".")[0] +
      "." +
      tokenEvent.token.split(".")[1]) as `${string}.${string}`;
    const tokenName = tokenEvent.token;
    const postConditionFt = Pc.principal(address)
      .willSendLte(microAmount)
      .ft(formattedToken, tokenName);
    postConditions.push(postConditionFt);
  } else {
    postConditions.push(Pc.principal(address).willSendLte(microAmount).ustx());
  }
  // the market token post condition
  // const isMainnet = appConfig.VITE_NETWORK === 'mainnet';
  if (tier > -1) {
    const bigrPostConditionNFt = await getBigRPostConditionNft(
      deployer,
      repContract,
      tier,
      address,
      tierBalance,
    );
    if (bigrPostConditionNFt) postConditions.push(bigrPostConditionNFt);
  }
  return postConditions;
}
export async function getBigRPostConditionNft(
  deployer: string,
  repContract: string,
  tier: number,
  address: string,
  tierBalance: number,
) {
  // if (!balance) {
  // 	balance = await getTierBalance(tier, address);
  // 	if (balance === 0) return;
  // }
  if (tierBalance === 0) return;

  const postConditionForNFT: NonFungiblePostCondition = Pc.principal(address)
    .willSendAsset()
    .nft(
      `${deployer}.${repContract}::bigr-id`,
      Cl.tuple({ "token-id": Cl.uint(tier), owner: Cl.principal(address) }),
    );

  return postConditionForNFT;
}
