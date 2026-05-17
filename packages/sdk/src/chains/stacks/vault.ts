import type { DaoConfig, VaultUserChain } from "@bigmarket/bm-types";
import { hexToBytes } from "@stacks/common";
import {
  bufferCV,
  contractPrincipalCV,
  principalCV,
  serializeCV,
  uintCV,
} from "@stacks/transactions";
import { callContract } from "./tx.js";
import { callContractReadOnly } from "./utils/contract.js";
import { pcForDeposit } from "./utils/postConditions.js";
import {
  vaultChainIdBuffer,
  vaultUserAddressBuffer,
} from "./utils/vaultIdentity.js";

export {
  vaultChainIdBuffer,
  vaultUserAddressBuffer,
} from "./utils/vaultIdentity.js";

function usdcxPrincipal(daoConfig: DaoConfig): string {
  return `${daoConfig.VITE_USDCX_CONTRACT_ADDRESS}.${daoConfig.VITE_USDCX_CONTRACT_NAME}`;
}

function parseClarityUint(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  if (typeof value === "string") return BigInt(value);
  return 0n;
}

export function createVaultClient(daoConfig: DaoConfig) {
  const deployer = daoConfig.VITE_DAO_DEPLOYER;
  const vaultName = daoConfig.VITE_DAO_VAULT;
  const network = daoConfig.VITE_NETWORK;
  const usdcx = usdcxPrincipal(daoConfig);
  const [usdcxAddr, usdcxContractName] = usdcx.split(".");

  return {
    usdcxPrincipal: usdcx,

    async getUsdcxBalance(stacksApi: string, owner: string): Promise<bigint> {
      const res = await callContractReadOnly(stacksApi, {
        contractAddress: usdcxAddr,
        contractName: usdcxContractName,
        functionName: "get-balance",
        functionArgs: [`0x${serializeCV(principalCV(owner))}`],
      });
      return parseClarityUint(res?.value);
    },

    async getVaultUsdcxBalance(
      stacksApi: string,
      userChain: VaultUserChain,
      sourceAddress: string,
    ): Promise<bigint> {
      const tokenArg = `0x${serializeCV(contractPrincipalCV(usdcxAddr, usdcxContractName))}`;

      if (userChain === "stacks") {
        const res = await callContractReadOnly(stacksApi, {
          contractAddress: deployer,
          contractName: vaultName,
          functionName: "get-stacks-balance",
          functionArgs: [
            `0x${serializeCV(principalCV(sourceAddress))}`,
            tokenArg,
          ],
        });
        return parseClarityUint(res?.value);
      }

      const ethHex = sourceAddress.trim().replace(/^0x/i, "");
      if (ethHex.length !== 40) {
        throw new Error("EVM address must be 40 hex characters");
      }
      const eth20 = hexToBytes(`0x${ethHex}`);

      const res = await callContractReadOnly(stacksApi, {
        contractAddress: deployer,
        contractName: vaultName,
        functionName: "get-evm-balance",
        functionArgs: [`0x${serializeCV(bufferCV(eth20))}`, tokenArg],
      });
      return parseClarityUint(res?.value);
    },

    depositUsdcxToVault(params: {
      amountMicro: bigint;
      userChain: VaultUserChain;
      sourceAddress: string;
      senderStxAddress: string;
    }) {
      const amount = params.amountMicro;
      if (amount <= 0n) {
        throw new Error("Deposit amount must be greater than zero");
      }

      const postConditions = pcForDeposit(
        usdcx,
        params.senderStxAddress,
        Number(amount),
      );

      return callContract(
        deployer,
        vaultName,
        network,
        "deposit",
        [
          contractPrincipalCV(usdcxAddr, usdcxContractName),
          uintCV(amount),
          bufferCV(vaultChainIdBuffer(params.userChain)),
          bufferCV(
            vaultUserAddressBuffer(params.userChain, params.sourceAddress),
          ),
        ],
        postConditions,
        "deny",
      );
    },
  };
}
