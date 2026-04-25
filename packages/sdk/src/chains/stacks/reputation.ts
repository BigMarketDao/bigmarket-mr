import { principalCV, serializeCV } from "@stacks/transactions";
import { callContractReadOnly } from "./utils/contract.js";

export function createReputationClient() {
  return {
    async fetchLastEpochClaimed(
      stacksApi: string,
      contractAddress: string,
      contractName: string,
      address: string,
      stacksHiroKey?: string,
    ): Promise<number> {
      const data = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: "get-last-claimed-epoch",
        functionArgs: [`0x${serializeCV(principalCV(address))}`],
      };
      const result = await callContractReadOnly(stacksApi, data, stacksHiroKey);
      return Number(result.value?.value || 0);
    },

    // getBalance(stacksApi: string, userAddress: string, token: string) {
    //   const [tokenAddress, tokenName] = token.split(".");
    //   return callContractReadOnly(stacksApi, {
    //     contractAddress: daoConfig.VITE_DAO_DEPLOYER,
    //     contractName: daoConfig.VITE_DAO_MARKET_PREDICTING,
    //     functionName: "get-balance",
    //     functionArgs: [
    //       `0x${serializeCV(principalCV(userAddress))}`,
    //       `0x${serializeCV(Cl.contractPrincipal(tokenAddress, tokenName))}`,
    //     ],
    //   });
    // },
  };
}
