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
export const getFungibleTokenName = (tokenContract: string) => {
  if (tokenContract.indexOf("governance-token") > -1) {
    return "bmg-token";
  } else if (tokenContract.indexOf("pepe") > -1) {
    return "pepe-token";
  } else if (tokenContract.indexOf("usdh") > -1) {
    return "usdh-token";
  } else if (tokenContract.indexOf("sbtc") > -1) {
    return "sbtc-token";
  } else if (tokenContract.indexOf("wrapped-stx") > -1) {
    return "stx";
    // } else if (sip10Data.symbol.toLowerCase().indexOf('bigr') > -1) {
    // 	return 'bigr-token';
  } else if (tokenContract.indexOf("play") > -1) {
    return "bmg-play";
  }
  return "bigr-token";
};

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
export async function getSellCategoryPostConditions(
  deployer: string,
  extension: string,
  tokenEvent: TokenPermissionEvent,
  microAmount: number,
) {
  const postConditions: Array<PostCondition> = [];
  let postConditionFt: PostCondition | null = null;
  // the market token post condition
  if (!isSTX(tokenEvent.token)) {
    const formattedToken = (tokenEvent.token.split(".")[0] +
      "." +
      tokenEvent.token.split(".")[1]) as `${string}.${string}`;
    const tokenName = tokenEvent.token;
    postConditionFt = Pc.principal(`${deployer}.${extension}`)
      .willSendGte(microAmount)
      .ft(formattedToken, tokenName);
  } else {
    postConditionFt = Pc.principal(`${deployer}.${extension}`)
      .willSendGte(microAmount)
      .ustx();
  }
  postConditions.push(postConditionFt);
  return postConditions;
}
export async function getClaimLPPostConditions(
  deployer: string,
  extension: string,
  tokenEvent: TokenPermissionEvent,
  microAmount: number,
) {
  const postConditions: Array<PostCondition> = [];
  let postConditionFt: PostCondition | null = null;
  // the market token post condition
  if (!isSTX(tokenEvent.token)) {
    const formattedToken = (tokenEvent.token.split(".")[0] +
      "." +
      tokenEvent.token.split(".")[1]) as `${string}.${string}`;
    const tokenName = tokenEvent.token;
    postConditionFt = Pc.principal(`${deployer}.${extension}`)
      .willSendLte(microAmount)
      .ft(formattedToken, tokenName);
  } else {
    postConditionFt = Pc.principal(`${deployer}.${extension}`)
      .willSendLte(microAmount)
      .ustx();
  }
  postConditions.push(postConditionFt);
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

export function pcForDeposit(
  token: string,
  senderAddress: string,
  microAmount: number,
): Array<PostCondition> {
  const postConditions: Array<PostCondition> = [];
  // the market token post condition
  if (!isSTX(token)) {
    const formattedToken = (token.split(".")[0] +
      "." +
      token.split(".")[1]) as `${string}.${string}`;
    const tokenName = getFungibleTokenName(token);
    const postConditionFt = Pc.principal(senderAddress)
      .willSendLte(microAmount)
      .ft(formattedToken, tokenName);
    postConditions.push(postConditionFt);
  } else {
    postConditions.push(
      Pc.principal(senderAddress).willSendEq(microAmount).ustx(),
    );
  }
  return postConditions;
}
