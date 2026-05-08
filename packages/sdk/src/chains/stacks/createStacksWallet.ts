// sdk/src/stacks/createStacksWallet.ts

import { CreatedStacksWallet } from "@bigmarket/bm-types";
import {
  makeRandomPrivKey,
  getAddressFromPrivateKey,
} from "@stacks/transactions";

export function createStacksWallet(
  sourceChain: string,
  sourceAddress: string,
  network: "mainnet" | "testnet" | "devnet" = "devnet",
): CreatedStacksWallet {
  const privateKey = makeRandomPrivKey();

  const mappedAddress = getAddressFromPrivateKey(privateKey, network);

  return {
    sourceChain,
    sourceAddress,
    mappedChain: "stacks",
    mappedAddress,
    privateKey,
    network,
    createdAt: new Date(),
  };
}
