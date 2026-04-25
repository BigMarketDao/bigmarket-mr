import {
  GateKeeper,
  MarketCategoricalOption,
  PredictionMarketCreateEvent,
  SharesPerCost,
  Sip10Data,
  TokenPermissionEvent,
  UserStake,
  type DaoConfig,
} from "@bigmarket/bm-types";
import { callContract } from "./tx.js";
import {
  bufferCV,
  Cl,
  type ClarityValue,
  contractPrincipalCV,
  ListCV,
  listCV,
  noneCV,
  Pc,
  PostCondition,
  principalCV,
  serializeCV,
  someCV,
  stringAsciiCV,
  tupleCV,
  uintCV,
} from "@stacks/transactions";
import { callContractReadOnly } from "./utils/contract.js";
import {
  CREATE_MARKET_TIER,
  getFungibleTokenName,
  getTierBalance,
  isSTX,
  mapToMinMaxStrings,
  STAKING_TIER,
} from "@bigmarket/bm-utilities";
import {
  getBigRPostConditionNft,
  getSip10PostConditions,
} from "./utils/postConditions.js";
import { getStxAddress } from "@stacks/connect";
import { hexToBytes } from "@stacks/common";
import {
  generateMerkleProof,
  generateMerkleTreeUsingStandardPrincipal,
  proofToClarityValue,
} from "./utils/gateKeeper.js";

async function getClarityProofForCreateMarket(
  gateKeeper: GateKeeper,
  stxAddress: string,
): Promise<ListCV<ClarityValue>> {
  // const path = `${bigMarketApi}/gating/create-market`;
  // const response = await fetch(path);
  // const gateKeeper = await response.json();
  const { tree, root } = generateMerkleTreeUsingStandardPrincipal(
    gateKeeper.merkleRootInput,
  );
  const { proof, valid } = generateMerkleProof(tree, stxAddress);
  if (!valid)
    throw new Error(
      "Invalid proof - user will be denied this operation in contract",
    );
  return proofToClarityValue(proof);
}

async function getCreateMarketPostConditions(
  daoConfig: DaoConfig,
  tier: number,
  tokenEvent: TokenPermissionEvent,
  address: string,
  microAmount: number,
  balance: number,
) {
  const postConditions: Array<PostCondition> = [];
  // the market token post condition
  if (!isSTX(tokenEvent.token)) {
    const formattedToken = (tokenEvent.token.split(".")[0] +
      "." +
      tokenEvent.token.split(".")[1]) as `${string}.${string}`;
    const tokenName = getFungibleTokenName(tokenEvent.token);
    const postConditionFt = Pc.principal(address)
      .willSendLte(microAmount)
      .ft(formattedToken, tokenName);
    postConditions.push(postConditionFt);
  } else {
    postConditions.push(Pc.principal(address).willSendLte(microAmount).ustx());
  }
  // the market token post condition
  // const isMainnet = getConfig().VITE_NETWORK === 'mainnet';
  if (tier > -1) {
    const bigrPostConditionNFt = await getBigRPostConditionNft(
      daoConfig.VITE_DAO_DEPLOYER,
      daoConfig.VITE_DAO_REPUTATION_TOKEN,
      tier,
      address,
      balance || 0,
    );
    if (bigrPostConditionNFt) postConditions.push(bigrPostConditionNFt);
  }
  return postConditions;
}

async function getArgsCV(
  gateKeeper: GateKeeper,
  creationGated: boolean,
  token: string,
  treasury: string,
  stxAddress: string,
  marketFee: number,
  dataHash: string,
  marketInitialLiquidity: number,
  priceFeedIdOrCatData: string | Array<MarketCategoricalOption>,
  marketDuration: number,
  coolDownDuration: number,
  hedgeStrategy?: string,
): Promise<ClarityValue[]> {
  const [contractAddress, contractName] = token.split(".");
  if (!contractAddress || !contractName) {
    throw new Error("Invalid token format. Expected 'address.contract-name'");
  }

  const marketFeeCV =
    marketFee === 0 ? noneCV() : someCV(uintCV(marketFee * 100));
  const hedgeCV = hedgeStrategy
    ? contractPrincipalCV(
        hedgeStrategy.split(".")[0],
        hedgeStrategy.split(".")[1],
      )
    : noneCV();
  // Assumes `dataHash` is a 64-character hex string (32 bytes)
  const metadataHash = bufferCV(hexToBytes(dataHash));
  let proof = creationGated
    ? await getClarityProofForCreateMarket(gateKeeper, stxAddress)
    : Cl.list([]);
  if (typeof priceFeedIdOrCatData === "string") {
    console.log("priceFeedId ===> " + priceFeedIdOrCatData);
    return [
      marketFeeCV,
      contractPrincipalCV(contractAddress, contractName),
      metadataHash,
      proof,
      principalCV(treasury),
      someCV(uintCV(marketDuration)),
      someCV(uintCV(coolDownDuration)),
      Cl.bufferFromHex(priceFeedIdOrCatData),
      uintCV(marketInitialLiquidity),
      hedgeCV,
    ];
  } else {
    console.log("CatData ===> ", priceFeedIdOrCatData);
    const cats = listCV(
      priceFeedIdOrCatData.map((o) => stringAsciiCV(o.label)),
    );
    return [
      cats,
      marketFeeCV,
      contractPrincipalCV(contractAddress, contractName),
      metadataHash,
      proof,
      principalCV(treasury),
      someCV(uintCV(marketDuration)),
      someCV(uintCV(coolDownDuration)),
      uintCV(marketInitialLiquidity),
      hedgeCV,
    ];
  }
}

export function createMarketsClient(daoConfig: DaoConfig) {
  const deployer = daoConfig.VITE_DAO_DEPLOYER;
  const call = (contract: string, fn: string, args: ClarityValue[]) =>
    callContract(deployer, contract, daoConfig.VITE_NETWORK, fn, args);

  return {
    async buyShares(
      market: PredictionMarketCreateEvent,
      token: TokenPermissionEvent,
      index: number,
      sender: string,
      userCostMicro: number,
      minShares: number,
      tierBalance?: number,
    ) {
      //const [addr, name] = marketContract.split(".");

      const functionName = "predict-category";
      const contractAddress = market.extension.split(".")[0];
      const contractName = market.extension.split(".")[1];
      const categorical = mapToMinMaxStrings(market.marketData.categories)[
        index
      ];
      const address = sender;
      const postConditions = await getSip10PostConditions(
        daoConfig.VITE_DAO_DEPLOYER,
        daoConfig.VITE_DAO_REPUTATION_TOKEN,
        STAKING_TIER,
        token,
        address,
        userCostMicro,
        tierBalance || 0,
      );
      let functionArgs = [
        Cl.uint(market.marketId),
        Cl.uint(minShares),
        Cl.stringAscii(categorical),
        Cl.principal(market.marketData.token),
        Cl.uint(userCostMicro),
      ];
      if (market.marketType === 2) {
        functionArgs = [
          Cl.uint(market.marketId),
          Cl.uint(minShares),
          Cl.uint(index),
          Cl.principal(market.marketData.token),
          Cl.uint(userCostMicro),
        ];
      }

      return callContract(
        contractAddress,
        contractName,
        daoConfig.VITE_NETWORK,
        functionName,
        functionArgs,
        postConditions,
        "deny",
      );
    },

    async createMarket(
      contractName: string,
      gateKeeper: GateKeeper,
      creationGated: boolean,
      tokenEvent: TokenPermissionEvent,
      treasury: string,
      stxAddress: string,
      marketFee: number,
      dataHash: string,
      marketInitialLiquidity: number,
      priceFeedIdOrCatData: string | Array<MarketCategoricalOption>,
      marketDuration: number,
      coolDownDuration: number,
      tierBalance: number,
      hedgeStrategy?: string,
    ) {
      let functionArgs: ClarityValue[] = [];
      try {
        functionArgs = await getArgsCV(
          gateKeeper,
          creationGated,
          tokenEvent.token,
          treasury,
          stxAddress,
          marketFee,
          dataHash,
          marketInitialLiquidity,
          priceFeedIdOrCatData,
          marketDuration,
          coolDownDuration,
          hedgeStrategy,
        );
        // Function arguments prepared successfully
      } catch (error) {
        console.error("getArgsCV call failed:", error);
        console.error("Error details:", {
          name: error instanceof Error ? error.name : "Unknown",
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : "No stack trace",
        });
        throw new Error(
          `Failed to prepare function arguments: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      const postConditions = await getCreateMarketPostConditions(
        daoConfig,
        CREATE_MARKET_TIER,
        tokenEvent,
        stxAddress,
        marketInitialLiquidity,
        tierBalance,
      );
      const functionName = "create-market";
      return callContract(
        daoConfig.VITE_DAO_DEPLOYER,
        contractName,
        daoConfig.VITE_NETWORK,
        functionName,
        functionArgs,
        postConditions,
        "deny",
      );
    },

    castVote(
      vFor: number,
      amount: number,
      sender: string,
      market: PredictionMarketCreateEvent,
      sip10Data: Sip10Data,
    ) {
      const contractAddress = market.extension.split(".")[0];
      const contractName = daoConfig.VITE_DAO_MARKET_VOTING;
      let functionName = "vote";

      const mult = isSTX(market.marketData.token)
        ? 1_000_000
        : Number(`1e${sip10Data.decimals}`);
      const microStxAmount = Math.round(parseFloat(String(amount)) * mult);
      const postConditions: Array<PostCondition> = [];
      const formattedToken = (daoConfig.VITE_DAO_DEPLOYER +
        "." +
        daoConfig.VITE_DAO_GOVERNANCE_TOKEN) as `${string}.${string}`;
      const postConditionFt = Pc.principal(sender)
        .willSendEq(microStxAmount)
        .ft(formattedToken, "bmg-token");
      postConditions.push(postConditionFt);
      // const postConditions = await getPostConditions(microStxAmount);
      const functionArgs = [
        principalCV(market.extension),
        uintCV(market.marketId),
        uintCV(vFor),
        uintCV(microStxAmount),
        noneCV(), //reclaim gov. tokens from this vote
      ];
      return callContract(
        contractAddress,
        contractName,
        daoConfig.VITE_NETWORK,
        functionName,
        functionArgs,
        [],
        "allow",
      );
    },
    resolveMarket(
      outcome: string | number,
      market: PredictionMarketCreateEvent,
    ) {
      const contractAddress = market.extension.split(".")[0];
      const contractName = market.extension.split(".")[1];
      let functionName = "resolve-market";
      let functionArgs = [
        uintCV(market.marketId),
        stringAsciiCV(outcome as string),
      ];
      if (market.marketType === 2) {
        //functionArgs = [uintCV(market.marketId), uintCV(stacksHeight)]; // height needed with dia
        functionArgs = [uintCV(market.marketId)]; // height not needed with pyth
      }

      return callContract(
        contractAddress,
        contractName,
        daoConfig.VITE_NETWORK,
        functionName,
        functionArgs,
        [],
        "deny",
      );
    },

    concludeVote(market: PredictionMarketCreateEvent) {
      const contractAddress = market.extension.split(".")[0];
      const contractName = daoConfig.VITE_DAO_MARKET_VOTING;
      let functionName = "conclude-market-vote";
      const functionArgs = [
        Cl.contractPrincipal(
          daoConfig.VITE_DAO_DEPLOYER,
          daoConfig.VITE_DAO_MARKET_PREDICTING,
        ),
        uintCV(market.marketId),
      ];

      return callContract(
        contractAddress,
        contractName,
        daoConfig.VITE_NETWORK,
        functionName,
        functionArgs,
        [],
        "deny",
      );
    },

    async fetchUserStake(
      stacksApi: string,
      marketId: number,
      contractAddress: string,
      contractName: string,
      user: string,
      stacksHiroKey?: string,
    ): Promise<UserStake> {
      try {
        const data = {
          contractAddress,
          contractName,
          functionName: "get-stake-balances",
          functionArgs: [
            `0x${serializeCV(uintCV(marketId))}`,
            `0x${serializeCV(principalCV(user))}`,
          ],
        };
        const result = await callContractReadOnly(
          stacksApi,
          data,
          stacksHiroKey,
        );
        if (!result.value) return { stakes: [] };
        const stakes =
          result.value.value.map((item: any) => Number(item.value)) || [];
        return {
          stakes,
        };
      } catch (err: any) {
        return { stakes: [] };
      }
    },

    async getMaxShares(
      stacksApi: string,
      marketId: number,
      index: number,
      totalCost: number,
      contractAddress: string,
      contractName: string,
    ): Promise<SharesPerCost> {
      const data = {
        contractAddress,
        contractName,
        functionName: "get-max-shares",
        functionArgs: [
          `0x${serializeCV(uintCV(marketId))}`,
          `0x${serializeCV(uintCV(index))}`,
          `0x${serializeCV(uintCV(totalCost))}`,
        ],
      };
      try {
        const result = await callContractReadOnly(stacksApi, data);
        const fee = Number(result.value.value.fee.value);
        const shares = Number(result.value.value.shares.value);
        const costLessFee = Number(result.value.value["cost-of-shares"].value);
        return {
          index,
          fee,
          shares,
          costLessFee,
        };
      } catch (err: any) {
        return {
          index,
          fee: 0,
          shares: 0,
          costLessFee: 0,
        };
      }
    },

    async fetchUserTokens(
      stacksApi: string,
      marketId: number,
      contractAddress: string,
      contractName: string,
      user: string,
      stacksHiroKey?: string,
    ): Promise<UserStake> {
      try {
        const data = {
          contractAddress,
          contractName,
          functionName: "get-token-balances",
          functionArgs: [
            `0x${serializeCV(uintCV(marketId))}`,
            `0x${serializeCV(principalCV(user))}`,
          ],
        };
        const result = await callContractReadOnly(
          stacksApi,
          data,
          stacksHiroKey,
        );
        const stakes =
          result.value?.value.map((item: any) => Number(item.value)) ||
          undefined;
        if (!result.value) return { stakes: [] };
        return {
          stakes,
        };
      } catch (err: any) {
        return { stakes: [] };
      }
    },
  };
}
