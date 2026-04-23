import { PredictionContractData, ResolutionVote } from "@bigmarket/bm-types";
import { fetchDataVar } from "./tx";
import {
  deserializeCV,
  principalCV,
  serializeCV,
  uintCV,
} from "@stacks/transactions";
import { callContractReadOnly } from "./utils/contract";

export function createContractViewDataClient() {
  return {
    async fetchResolutionVote(
      stacksApi: string,
      marketContract: string,
      marketId: number,
      contractAddress: string,
      contractName: string,
      stacksHiroKey?: string,
    ): Promise<ResolutionVote> {
      const data = {
        contractAddress,
        contractName,
        functionName: "get-poll-data",
        functionArgs: [
          `0x${serializeCV(principalCV(marketContract))}`,
          `0x${serializeCV(uintCV(marketId))}`,
        ],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      const votes = result.value.value["votes"].value.map((item: any) =>
        Number(item.value),
      );

      return {
        marketContract,
        marketId,
        proposer: result.value.value.proposer.value,
        endBurnHeight: Number(result.value.value["end-burn-height"].value),
        isGated: false,
        concluded: Boolean(result.value.value.concluded.value),
        votes,
        numCategories: Number(result.value.value["num-categories"].value),
        winningCategory: result.value.value["winning-category"]?.value,
      };
    },
    async getPredictionContractData(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      stacksHiroKey?: string,
    ): Promise<PredictionContractData> {
      // let customMajority = await extractValue(
      //   stacksApi,
      //   contractAddress,
      //   "bme021-0-market-voting",
      //   "custom-majority",
      //   stacksHiroKey,
      // );
      let marketVotingDuration = await extractValue(
        stacksApi,
        contractAddress,
        "bme021-0-market-voting",
        "voting-duration",
        stacksHiroKey,
      );
      let tokenUri = await extractValue(
        stacksApi,
        contractAddress,
        "bme000-0-governance-token",
        "token-uri",
        stacksHiroKey,
      );
      let tokenDecimals = await extractValue(
        stacksApi,
        contractAddress,
        "bme000-0-governance-token",
        "token-decimals",
        stacksHiroKey,
      );
      let tokenSymbol = await extractValue(
        stacksApi,
        contractAddress,
        "bme000-0-governance-token",
        "token-symbol",
        stacksHiroKey,
      );
      let tokenName = await extractValue(
        stacksApi,
        contractAddress,
        "bme000-0-governance-token",
        "token-name",
        stacksHiroKey,
      );
      let coreTeamSunsetHeight = await extractValue(
        stacksApi,
        contractAddress,
        "bme003-0-core-proposals",
        "core-team-sunset-height",
        stacksHiroKey,
      );
      let executiveSignalsRequired = await extractValue(
        stacksApi,
        contractAddress,
        "bme004-0-core-execute",
        "executive-signals-required",
        stacksHiroKey,
      );
      let marketCounter = await extractValue(
        stacksApi,
        contractAddress,
        contractName,
        "market-counter",
        stacksHiroKey,
      );
      let creationGated = await extractValue(
        stacksApi,
        contractAddress,
        contractName,
        "creation-gated",
        stacksHiroKey,
      );

      let devFeeBips = await extractValue(
        stacksApi,
        contractAddress,
        contractName,
        "dev-fee-bips",
        stacksHiroKey,
      );
      // let daoFeeBips = await extractValue(
      //   stacksApi,
      //   contractAddress,
      //   contractName,
      //   "dao-fee-bips",
      //   stacksHiroKey,
      // );
      let marketFeeBipsMax = await extractValue(
        stacksApi,
        contractAddress,
        contractName,
        "market-fee-bips-max",
        stacksHiroKey,
      );
      //let marketInitialLiquidity = await extractValue(stacksApi, contractAddress, contractName, "market-create-fee");

      let disputeWindowLength = await extractValue(
        stacksApi,
        contractAddress,
        contractName,
        "dispute-window-length",
        stacksHiroKey,
      );
      let resolutionAgent = await extractValue(
        stacksApi,
        contractAddress,
        contractName,
        "resolution-agent",
        stacksHiroKey,
      );
      let devFund = await extractValue(
        stacksApi,
        contractAddress,
        contractName,
        "dev-fund",
        stacksHiroKey,
      );
      let daoTreasury = await extractValue(
        stacksApi,
        contractAddress,
        contractName,
        "dao-treasury",
        stacksHiroKey,
      );
      console.log("daoTreasury:", daoTreasury);

      return {
        tokenUri,
        tokenName,
        tokenDecimals,
        tokenSymbol,
        executiveSignalsRequired,
        coreTeamSunsetHeight,
        marketCounter,
        devFeeBips,
        daoFeeBips: -1,
        marketFeeBipsMax,
        marketInitialLiquidity: 100000000,
        disputeWindowLength,
        marketVotingDuration,
        resolutionAgent,
        devFund,
        daoTreasury,
        customMajority: -1, //
        creationGated,
      };
    },
  };
}

async function extractValue(
  stacksApi: string,
  contractAddress: string,
  contractName: string,
  varName: string,
  stacksHiroKey?: string,
): Promise<any> {
  const delayMs: number = 100;
  return new Promise((resolve) => {
    setTimeout(async () => {
      try {
        let token = await fetchDataVar(
          stacksApi,
          contractAddress,
          contractName,
          varName,
          stacksHiroKey,
        );

        if (token.data && token.data === "0x04") return resolve(false);
        if (token.data && token.data === "0x03") return resolve(true);

        const cv = (deserializeCV(token.data) as any).value;
        if (typeof cv === "object") {
          resolve(cv.value.value);
        } else if (typeof cv === "bigint") {
          resolve(Number(cv));
        } else {
          resolve(cv);
        }
      } catch (err) {
        resolve(null);
      }
    }, delayMs);
  });
}
