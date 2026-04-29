import {
  ClarityValue,
  listCV,
  principalCV,
  serializeCV,
  uintCV,
} from "@stacks/transactions";
import { callContractReadOnly } from "./utils/contract.js";
import { unwrapClarityValue } from "./markets.js";
import { callContract } from "./tx.js";
import { DaoConfig } from "@bigmarket/bm-types";
import { uint } from "@stacks/transactions/dist/cl.js";

export function createReputationClient(daoConfig: DaoConfig) {
  const contractAddress = daoConfig.VITE_DAO_DEPLOYER;
  const contractName = daoConfig.VITE_DAO_REPUTATION_TOKEN;
  const network = daoConfig.VITE_NETWORK;
  return {
    claimBigReward(extension: string, sender: string) {
      let functionName = "claim-big-reward";
      let functionArgs = [] as ClarityValue[];
      return callContract(
        contractAddress,
        contractName,
        network,
        functionName,
        functionArgs,
        [],
        "deny",
      );
    },

    claimBigRewardBatch(eligibleUsers: Array<string>) {
      let functionName = "claim-big-reward-batch";
      const principalList = listCV(
        eligibleUsers.map((user) => principalCV(user)),
      );
      let functionArgs = [principalList] as ClarityValue[];

      return callContract(
        contractAddress,
        contractName,
        network,
        functionName,
        functionArgs,
        [],
        "deny",
      );
    },

    async fetchLastEpochClaimed(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      sender: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-last-claimed-epoch",
        functionArgs: [`0x${serializeCV(principalCV(sender))}`],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchWeightedSupply(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-weighted-supply",
        functionArgs: [],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchWeightedRep(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      sender: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-weighted-rep",
        functionArgs: [`0x${serializeCV(principalCV(sender))}`],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchMintedInEpoch(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      epoch: number,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-minted-in-epoch",
        functionArgs: [`0x${serializeCV(uintCV(epoch))}`],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchMintedInEpochBy(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      epoch: number,
      sender: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-minted-in-epoch-by",
        functionArgs: [
          `0x${serializeCV(uintCV(epoch))}`,
          `0x${serializeCV(principalCV(sender))}`,
        ],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchBurnedInEpoch(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      epoch: number,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-burned-in-epoch",
        functionArgs: [`0x${serializeCV(uintCV(epoch))}`],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchBurnedInEpochBy(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      epoch: number,
      sender: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-burned-in-epoch-by",
        functionArgs: [
          `0x${serializeCV(uintCV(epoch))}`,
          `0x${serializeCV(principalCV(sender))}`,
        ],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchEpoch(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      sender: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-epoch",
        functionArgs: [],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchLastClaimedEpoch(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      sender: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-last-claimed-epoch",
        functionArgs: [`0x${serializeCV(principalCV(sender))}`],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchLatestClaimableEpoch(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      sender: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-latest-claimable-epoch",
        functionArgs: [],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchBalance(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      nftTokenId: number,
      who: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-balance",
        functionArgs: [
          `0x${serializeCV(uintCV(nftTokenId))}`,
          `0x${serializeCV(principalCV(who))}`,
        ],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchOverallBalance(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      nftTokenId: number,
      who: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-overall-balance",
        functionArgs: [`0x${serializeCV(principalCV(who))}`],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchJoinEpoch(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      nftTokenId: number,
      who: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-join-epoch",
        functionArgs: [`0x${serializeCV(principalCV(who))}`],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchTotalWeightedSupplyAt(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      epochId: number,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-total-weighted-supply-at",
        functionArgs: [`0x${serializeCV(uintCV(epochId))}`],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchTierWeight(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      nftTokenId: number,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-tier-weight",
        functionArgs: [`0x${serializeCV(uintCV(nftTokenId))}`],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchTotalSupply(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      nftTokenId: number,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-total-supply",
        functionArgs: [`0x${serializeCV(uintCV(nftTokenId))}`],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchTotalWeightedSupply(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-total-weighted-supply",
        functionArgs: [],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchUserTotalRep(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-total-weighted-supply",
        functionArgs: [],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchName(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-name",
        functionArgs: [],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchSymbol(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-symbol",
        functionArgs: [],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchDecimals(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-decimals",
        functionArgs: [],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchEpochDuration(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-epoch-duration",
        functionArgs: [],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchRewardPerEpoch(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-reward-per-epoch",
        functionArgs: [],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchLaunchHeight(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-launch-height",
        functionArgs: [],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },

    async fetchTokenUri(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      nftTokenId: number,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-token-uri",
        functionArgs: [`0x${serializeCV(uintCV(nftTokenId))}`],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return unwrapClarityValue(result);
    },
  };
}
