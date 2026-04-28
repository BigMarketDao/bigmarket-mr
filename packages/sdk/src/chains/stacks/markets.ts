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
  ClarityType,
  type ClarityValue,
  contractPrincipalCV,
  cvToValue,
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
  ADD_LIQUIDITY_TIER,
  CREATE_MARKET_TIER,
  CLAIM_LIQUIDITY_TIER,
  getFungibleTokenName,
  getTierBalance,
  isSTX,
  mapToMinMaxStrings,
  REMOVE_LIQUIDITY_TIER,
  SELLING_TIER,
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

export function unwrapClarityValue(result: ClarityValue) {
  switch (result.type) {
    case ClarityType.ResponseOk:
      return cvToValue(result.value);

    case ClarityType.ResponseErr:
      throw new Error(
        `Contract error: ${JSON.stringify(cvToValue(result.value))}`,
      );

    default:
      // raw values (bool, uint, optional, tuple, etc.)
      return cvToValue(result);
  }
}

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
  sender: string,
  marketFee: number,
  dataHash: string,
  marketInitialLiquidity: number,
  priceFeedIdOrCatData: string | Array<MarketCategoricalOption>,
  marketDuration: number,
  coolDownDuration: number,
  hedgeStrategy?: string,
  mechanism?: number,
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
  const mechanismCV = mechanism ? someCV(uintCV(mechanism)) : noneCV();
  // Assumes `dataHash` is a 64-character hex string (32 bytes)
  const metadataHash = bufferCV(hexToBytes(dataHash));
  let proof = creationGated
    ? await getClarityProofForCreateMarket(gateKeeper, sender)
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
      mechanismCV,
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
      mechanismCV,
    ];
  }
}

export function createMarketsClient(daoConfig: DaoConfig) {
  const deployer = daoConfig.VITE_DAO_DEPLOYER;
  // const call = (contract: string, fn: string, args: ClarityValue[]) =>
  //   callContract(deployer, contract, daoConfig.VITE_NETWORK, fn, args);

  return {
    async buyShares(
      sender: string,
      market: PredictionMarketCreateEvent,
      token: TokenPermissionEvent,
      index: number,
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
      const postConditions = await getSip10PostConditions(
        daoConfig.VITE_DAO_DEPLOYER,
        daoConfig.VITE_DAO_REPUTATION_TOKEN,
        STAKING_TIER,
        token,
        sender,
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
    async sellShares(
      sender: string,
      market: PredictionMarketCreateEvent,
      token: TokenPermissionEvent,
      index: number,
      sharesIn: number,
      minRefund: number,
    ) {
      const functionName = "sell-category";
      const contractAddress = market.extension.split(".")[0];
      const contractName = market.extension.split(".")[1];

      // categorical string (same mapping as buy)
      const categorical = mapToMinMaxStrings(market.marketData.categories)[
        index
      ];
      const postConditions = await getSip10PostConditions(
        daoConfig.VITE_DAO_DEPLOYER,
        daoConfig.VITE_DAO_REPUTATION_TOKEN,
        SELLING_TIER,
        token,
        sender,
        0, // the contract will send tokens to the user
        0,
      );

      let functionArgs = [
        Cl.uint(market.marketId),
        Cl.uint(minRefund),
        Cl.stringAscii(categorical),
        Cl.principal(market.marketData.token),
        Cl.uint(sharesIn),
      ];

      // scalar variant uses index instead of string
      if (market.marketType === 2) {
        functionArgs = [
          Cl.uint(market.marketId),
          Cl.uint(minRefund),
          Cl.uint(index),
          Cl.principal(market.marketData.token),
          Cl.uint(sharesIn),
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
    async addLiquidity(
      sender: string,
      market: PredictionMarketCreateEvent,
      amount: number,
      expectedTotalStakes: number,
      maxDeviationBips: number,
      tokenEvent: TokenPermissionEvent,
      tierBalance?: number,
    ) {
      const functionName = "add-liquidity";
      const contractAddress = market.extension.split(".")[0];
      const contractName = market.extension.split(".")[1];
      const postConditions = await getSip10PostConditions(
        daoConfig.VITE_DAO_DEPLOYER,
        daoConfig.VITE_DAO_REPUTATION_TOKEN,
        ADD_LIQUIDITY_TIER,
        tokenEvent,
        sender,
        amount,
        tierBalance || 0,
      );
      //(define-public (add-liquidity (market-id uint) (amount uint) (expected-total-stakes uint) (max-deviation-bips uint) (token <ft-token>))
      let functionArgs = [
        Cl.uint(market.marketId),
        Cl.uint(amount),
        Cl.uint(expectedTotalStakes),
        Cl.uint(maxDeviationBips),
        Cl.uint(tokenEvent.token),
      ];
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
    async removeLiquidity(
      sender: string,
      market: PredictionMarketCreateEvent,
      amount: number,
      minRefund: number,
      tokenEvent: TokenPermissionEvent,
      tierBalance?: number,
    ) {
      const functionName = "remove-liquidity";
      const contractAddress = market.extension.split(".")[0];
      const contractName = market.extension.split(".")[1];
      const postConditions = await getSip10PostConditions(
        daoConfig.VITE_DAO_DEPLOYER,
        daoConfig.VITE_DAO_REPUTATION_TOKEN,
        REMOVE_LIQUIDITY_TIER,
        tokenEvent,
        sender,
        0, // user sends 0 tokens - the contract will send tokens to the user
        tierBalance || 0,
      );
      //(define-public (remove-liquidity (market-id uint) (amount uint) (min-refund uint) (token <ft-token>))
      let functionArgs = [
        Cl.uint(market.marketId),
        Cl.uint(amount),
        Cl.uint(minRefund),
        Cl.uint(tokenEvent.token),
      ];
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

    async claimLpFees(
      market: PredictionMarketCreateEvent,
      tokenEvent: TokenPermissionEvent,
    ) {
      const functionName = "claim-lp-fees";
      const contractAddress = market.extension.split(".")[0];
      const contractName = market.extension.split(".")[1];
      //(define-public (claim-lp-fees (market-id uint) (token <ft-token>))
      let functionArgs = [Cl.uint(market.marketId), Cl.uint(tokenEvent.token)];
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
      mechanism?: number,
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
          mechanism, // AMM mechanism
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

    async fetchMaxShares(
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

    //(define-read-only (is-hedging-enabled) (var-get hedging-enabled))
    async fetchIsHedgingEnabled(
      stacksApi: string,
      marketId: number,
      contractAddress: string,
      contractName: string,
      user: string,
      stacksHiroKey?: string,
    ): Promise<UserStake> {
      const data = {
        contractAddress,
        contractName,
        functionName: "is-hedging-enabled",
        functionArgs: [],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchLpFeeSplitBips(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      stacksHiroKey?: string,
    ): Promise<UserStake> {
      const data = {
        contractAddress,
        contractName,
        functionName: "get-lp-fee-split-bips",
        functionArgs: [],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchTokenMinimumSeed(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      token: string,
      stacksHiroKey?: string,
    ): Promise<UserStake> {
      const data = {
        contractAddress,
        contractName,
        functionName: "get-token-minimum-seed",
        functionArgs: [`0x${serializeCV(principalCV(token))}`],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchIsAllowedToken(
      stacksApi: string,
      marketId: number,
      contractAddress: string,
      contractName: string,
      token: string,
      stacksHiroKey?: string,
    ): Promise<UserStake> {
      const data = {
        contractAddress,
        contractName,
        functionName: "is-allowed-token",
        functionArgs: [`0x${serializeCV(principalCV(token))}`],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchExpectedPayout(
      stacksApi: string,
      marketId: number,
      index: number,
      contractAddress: string,
      contractName: string,
      user: string,
      stacksHiroKey?: string,
    ): Promise<UserStake> {
      const data = {
        contractAddress,
        contractName,
        functionName: "get-expected-payout",
        functionArgs: [
          `0x${serializeCV(uintCV(marketId))}`,
          `0x${serializeCV(uintCV(index))}`,
          `0x${serializeCV(principalCV(user))}`,
        ],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },
    async fetchMarketData(
      stacksApi: string,
      marketId: number,
      contractAddress: string,
      contractName: string,
      stacksHiroKey?: string,
    ): Promise<UserStake> {
      const data = {
        contractAddress,
        contractName,
        functionName: "get-market-data",
        functionArgs: [`0x${serializeCV(uintCV(marketId))}`],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },
    async fetchTokenBalances(
      stacksApi: string,
      marketId: number,
      sender: string,
      contractAddress: string,
      contractName: string,
      stacksHiroKey?: string,
    ): Promise<UserStake> {
      const data = {
        contractAddress,
        contractName,
        functionName: "get-token-balances",
        functionArgs: [
          `0x${serializeCV(uintCV(marketId))}`,
          `0x${serializeCV(principalCV(sender))}`,
        ],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },
    async fetchLpBalances(
      stacksApi: string,
      marketId: number,
      sender: string,
      contractAddress: string,
      contractName: string,
      stacksHiroKey?: string,
    ): Promise<UserStake> {
      const data = {
        contractAddress,
        contractName,
        functionName: "get-lp-balances",
        functionArgs: [
          `0x${serializeCV(uintCV(marketId))}`,
          `0x${serializeCV(principalCV(sender))}`,
        ],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },
    async fetchMarketAccounting(
      stacksApi: string,
      marketId: number,
      contractAddress: string,
      contractName: string,
      stacksHiroKey?: string,
    ): Promise<UserStake> {
      const data = {
        contractAddress,
        contractName,
        functionName: "get-market-accounting",
        functionArgs: [`0x${serializeCV(uintCV(marketId))}`],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },
    async fetchShareCost(
      stacksApi: string,
      marketId: number,
      index: number,
      amountShares: number,
      contractAddress: string,
      contractName: string,
      stacksHiroKey?: string,
    ): Promise<UserStake> {
      const data = {
        contractAddress,
        contractName,
        functionName: "get-share-cost",
        functionArgs: [
          `0x${serializeCV(uintCV(marketId))}`,
          `0x${serializeCV(uintCV(index))}`,
          `0x${serializeCV(uintCV(amountShares))}`,
        ],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },
  };
}
