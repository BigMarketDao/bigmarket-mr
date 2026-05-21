import type { DaoConfig, VaultUserChain } from "@bigmarket/bm-types";
import { hexToBytes } from "@stacks/common";
import {
  bufferCV,
  contractPrincipalCV,
  noneCV,
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

export function normalizeVaultSourceChain(sourceChain: string): VaultUserChain {
  const s = sourceChain.toLowerCase();
  if (s === "eth" || s === "ethereum") return "evm";
  if (s === "sol" || s === "solana") return "solana";
  if (s === "stx" || s === "stacks") return "stacks";
  throw new Error(`Unsupported source chain: ${sourceChain}`);
}

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
      return BigInt(res?.value?.value || 0);
    },

    async getVaultUsdcxBalance(
      stacksApi: string,
      userChain: VaultUserChain,
      address: string,
    ): Promise<bigint> {
      const tokenArg = `0x${serializeCV(contractPrincipalCV(usdcxAddr, usdcxContractName))}`;

      if (userChain === "stacks") {
        const res = await callContractReadOnly(stacksApi, {
          contractAddress: deployer,
          contractName: vaultName,
          functionName: "get-stacks-balance",
          functionArgs: [`0x${serializeCV(principalCV(address))}`, tokenArg],
        });
        return BigInt(res?.value || 0);
      }

      const ethHex = address.trim().replace(/^0x/i, "");
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
      return BigInt(res?.value || 0);
    },

    /**
     * SIP-010 transfer: moves USDCx from the user's wallet to any Stacks address.
     * Used to fund a relayer-controlled mapped address before the relayer sweeps to vault.
     */
    transferUsdcxTo(params: {
      amountMicro: bigint;
      senderStxAddress: string;
      recipientStxAddress: string;
    }) {
      const amount = params.amountMicro;
      if (amount <= 0n) {
        throw new Error("Transfer amount must be greater than zero");
      }

      const postConditions = pcForDeposit(
        usdcx,
        params.senderStxAddress,
        Number(amount),
      );

      return callContract(
        usdcxAddr,
        usdcxContractName,
        network,
        "transfer",
        [
          uintCV(amount),
          principalCV(params.senderStxAddress),
          principalCV(params.recipientStxAddress),
          noneCV(),
        ],
        postConditions,
        "deny",
      );
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
