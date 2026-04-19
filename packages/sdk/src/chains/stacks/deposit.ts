import { type DaoConfig } from "@bigmarket/bm-config";
import { callContract } from "./tx";
import { Cl, uintCV, type ClarityValue } from "@stacks/transactions";

export function parseToken(token: string) {
  const [address, name] = token.split(".");
  return Cl.contractPrincipal(address, name);
}

export function createDaoClient(daoConfig: DaoConfig) {
  const deployer = daoConfig.VITE_DAO_DEPLOYER;
  const call = (contract: string, fn: string, args: ClarityValue[]) =>
    callContract(deployer, contract, daoConfig.VITE_NETWORK, fn, args);

  return {
    deposit(token: string, amount: number) {
      return call(daoConfig.VITE_DAO_VAULT, "deposit", [
        parseToken(token),
        uintCV(amount),
      ]);
    },

    withdraw(token: string, amount: number) {
      return call(daoConfig.VITE_DAO_VAULT, "withdraw", [
        parseToken(token),
        uintCV(amount),
      ]);
    },

    // future functions stay VERY small
    stake(amount: number) {
      return call(daoConfig.VITE_DAO_VAULT, "stake", [uintCV(amount)]);
    },
    claimFaucet(amount: number) {
      return call(daoConfig.VITE_DAO_BIG_PLAY, "faucet", [uintCV(amount)]);
    },
  };
}
