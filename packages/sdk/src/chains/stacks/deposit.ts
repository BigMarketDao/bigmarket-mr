import { type DaoConfig } from "@bigmarket/bm-types";
import { callContract } from "./tx";
import {
  Cl,
  Pc,
  PostCondition,
  principalCV,
  serializeCV,
  uintCV,
  type ClarityValue,
} from "@stacks/transactions";
import { fmtStxMicro } from "@bigmarket/bm-utilities";
import { pcForDeposit } from "./utils";
import { callContractReadOnly } from "./utils/contract";

export function parseToken(token: string) {
  const [address, name] = token.split(".");
  return Cl.contractPrincipal(address, name);
}

export function createVaultClient(daoConfig: DaoConfig) {
  const deployer = daoConfig.VITE_DAO_DEPLOYER;
  const call = (
    contract: string,
    fn: string,
    args: ClarityValue[],
    postConditions?: Array<PostCondition>,
    postConditionMode?: "allow" | "deny",
  ) =>
    callContract(
      deployer,
      contract,
      daoConfig.VITE_NETWORK,
      fn,
      args,
      postConditions,
      postConditionMode,
    );

  return {
    deposit(token: string, amount: number, senderAddress: string) {
      const microAmount = fmtStxMicro(amount);
      const postConditions = pcForDeposit(token, senderAddress, microAmount);
      return call(
        daoConfig.VITE_DAO_VAULT,
        "deposit",
        [parseToken(token), uintCV(microAmount)],
        postConditions,
        "deny",
      );
    },

    withdraw(token: string, amount: number, senderAddress: string) {
      return call(daoConfig.VITE_DAO_VAULT, "withdraw", [
        parseToken(token),
        uintCV(amount),
      ]);
    },

    // future functions stay VERY small
    stake(amount: number, senderAddress: string) {
      return call(daoConfig.VITE_DAO_VAULT, "stake", [uintCV(amount)]);
    },

    getBalance(stacksApi: string, userAddress: string, token: string) {
      const [tokenAddress, tokenName] = token.split(".");
      return callContractReadOnly(stacksApi, {
        contractAddress: daoConfig.VITE_DAO_DEPLOYER,
        contractName: daoConfig.VITE_DAO_VAULT,
        functionName: "get-balance",
        functionArgs: [
          `0x${serializeCV(principalCV(userAddress))}`,
          `0x${serializeCV(Cl.contractPrincipal(tokenAddress, tokenName))}`,
        ],
      });
    },

    claimFaucet(token: string, amount: number, senderAddress: string) {
      const microAmount = fmtStxMicro(amount);
      //const postConditions = pcForClaimFaucet(token, senderAddress, microAmount);
      return call(daoConfig.VITE_DAO_BIG_PLAY, "faucet", [uintCV(microAmount)]);
    },
  };
}
