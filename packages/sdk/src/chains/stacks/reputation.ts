import {
  ClarityValue,
  cvToValue,
  listCV,
  principalCV,
  serializeCV,
  uintCV,
} from "@stacks/transactions";
import { callContractReadOnly } from "./utils/contract.js";
import { callContract } from "./tx.js";
import { DaoConfig } from "@bigmarket/bm-types";

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
      return result.value;
    },

    async fetchWeightedSupply(
      stacksApi: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-weighted-supply",
        functionArgs: [],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return Number(result?.value?.value || -1);
    },

    async fetchWeightedReputation(
      stacksApi: string,
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
      console.log(
        "--------------------> fetchWeightedReputation: result: ",
        result,
      );
      return Number(result?.value?.value || -1);
    },

    async fetchMintedInEpoch(
      stacksApi: string,
      epoch: number,
      stacksHiroKey?: string,
    ): Promise<any> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-minted-in-epoch",
        functionArgs: [`0x${serializeCV(uintCV(epoch))}`],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      console.log("--------------------> fetchMintedInEpoch: result: ", result);
      return Number(result?.value || -1);
    },

    async fetchMintedInEpochBy(
      stacksApi: string,
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
      return Number(result?.value || -1);
    },

    async fetchBurnedInEpoch(
      stacksApi: string,
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
      return Number(result?.value || -1);
    },

    async fetchBurnedInEpochBy(
      stacksApi: string,
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
      return Number(result?.value || -1);
    },

    async fetchEpoch(
      stacksApi: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-epoch",
        functionArgs: [],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return Number(result?.value || -1);
    },

    async fetchLastClaimedEpoch(
      stacksApi: string,
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
      return Number(result?.value || -1);
    },

    async fetchLatestClaimableEpoch(
      stacksApi: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-latest-claimable-epoch",
        functionArgs: [],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return result.value.type === "uint" ? result.value.value : result.value;
    },

    async fetchBalanceAtTier(
      stacksApi: string,
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
      return Number(result?.value?.value || -1);
    },

    async fetchOverallBalance(
      stacksApi: string,
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
      return Number(result?.value?.value || -1);
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
      return result.value;
    },

    async fetchTotalWeightedSupplyAt(
      stacksApi: string,
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
      return Number(result?.value?.value || -1);
    },

    async fetchOverallSupply(
      stacksApi: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-overall-supply",
        functionArgs: [],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return Number(result?.value?.value || -1);
    },

    async fetchTierWeight(
      stacksApi: string,
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
      return Number(result?.value?.value || -1);
    },

    async fetchTotalSupplyPerNft(
      stacksApi: string,
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
      return Number(result?.value?.value || -1);
    },

    async fetchTotalWeightedSupply(
      stacksApi: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-total-weighted-supply",
        functionArgs: [],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return Number(result?.value?.value || -1);
    },

    async fetchTokenName(
      stacksApi: string,
      stacksHiroKey?: string,
    ): Promise<string> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-name",
        functionArgs: [],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return result.value?.value || ""; // ? cvToValue(result.value) : "";
    },

    async fetchTokenSymbol(
      stacksApi: string,
      stacksHiroKey?: string,
    ): Promise<string> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-symbol",
        functionArgs: [],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return result.value?.value || ""; // ? cvToValue(result.value) : "";
    },

    async fetchTokenDecimals(
      stacksApi: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-decimals",
        functionArgs: [],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return Number(result?.value.value || 1);
    },

    async fetchEpochDuration(
      stacksApi: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-epoch-duration",
        functionArgs: [],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return Number(result?.value.value || -1);
    },

    async fetchRewardPerEpoch(
      stacksApi: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-reward-per-epoch",
        functionArgs: [],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return Number(result?.value?.value || -1);
    },

    async fetchLaunchHeight(
      stacksApi: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-launch-height",
        functionArgs: [],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return Number(result?.value?.value || -1);
    },

    async fetchTokenUri(
      stacksApi: string,
      nftTokenId: number,
      stacksHiroKey?: string,
    ): Promise<string> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-token-uri",
        functionArgs: [`0x${serializeCV(uintCV(nftTokenId))}`],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return result.value?.value || ""; // ? cvToValue(result.value) : "";
    },
  };
}
