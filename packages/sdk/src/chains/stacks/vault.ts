import type { DaoConfig, VaultUserChain } from "@bigmarket/bm-types";
import { hexToBytes } from "@stacks/common";
import {
  broadcastTransaction,
  bufferCV,
  contractPrincipalCV,
  getAddressFromPrivateKey,
  makeContractCall,
  noneCV,
  PostConditionMode,
  principalCV,
  serializeCV,
  serializeTransaction,
  standardPrincipalCV,
  uintCV,
} from "@stacks/transactions";
import { callContract } from "./tx.js";
import { callContractReadOnly } from "./utils/contract.js";
import { pcForDeposit, pcForWithdraw } from "./utils/postConditions.js";
import {
  vaultChainIdBuffer,
  vaultChainIdCV,
  vaultUserAddressBuffer,
  VAULT_CHAIN_ID,
} from "./utils/vaultIdentity.js";
import { STACKS_DEVNET, STACKS_MAINNET, STACKS_TESTNET } from "@stacks/network";
import {
  buildBmp1Message,
  amountToSlot,
  slotHighLow,
  BMP1_OPCODES,
  BMP1_CHAINS,
} from "../../protocol/bmp1.js";

export function resolveStacksNetwork(network: string) {
  if (network === "testnet") return STACKS_TESTNET;
  if (network === "devnet") return STACKS_DEVNET;
  return STACKS_MAINNET;
}

export function normalizeVaultSourceChain(sourceChain: string): VaultUserChain {
  const s = sourceChain.toLowerCase();
  if (s === "eth" || s === "ethereum" || s === "evm") return "evm";
  if (s === "sol" || s === "solana") return "solana";
  if (s === "stx" || s === "stacks") return "stacks";
  throw new Error(`Unsupported source chain: ${sourceChain}`);
}

export {
  vaultChainIdBuffer,
  vaultChainIdCV,
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
      const val = BigInt(res?.value?.value || 0);
      return BigInt(val);
    },

    /**
     * Query the vault balance for a user by calling `get-balance` directly.
     *
     * Builds the exact key the contract uses:
     *   { controller-chain, controller-address (buff 32), mapped-address, token }
     *
     * - `sourceAddress`: the identity that controls the balance.
     *     Stacks chain → STX principal (hash160 derived internally).
     *     EVM chain    → 0x-prefixed or bare 40-char hex address (padded to 32 bytes).
     * - `mappedAddress`: the Stacks principal (SP.../ST...) stored in the balance key.
     *     For a direct native-Stacks deposit this equals `sourceAddress`.
     *     For the relay flow it is the ephemeral relayer-controlled address.
     */
    async getVaultUsdcxBalance(
      stacksApi: string,
      userChain: VaultUserChain,
      sourceAddress: string,
      mappedAddress?: string,
    ): Promise<bigint> {
      const chain = normalizeVaultSourceChain(userChain);
      const resolvedMapped = mappedAddress ?? sourceAddress;

      const controllerChainArg = `0x${serializeCV(bufferCV(vaultChainIdBuffer(chain)))}`;
      const controllerAddrArg = `0x${serializeCV(bufferCV(vaultUserAddressBuffer(chain, sourceAddress)))}`;
      const mappedAddressArg = `0x${serializeCV(principalCV(resolvedMapped))}`;
      const tokenArg = `0x${serializeCV(contractPrincipalCV(usdcxAddr, usdcxContractName))}`;

      const res = await callContractReadOnly(stacksApi, {
        contractAddress: deployer,
        contractName: vaultName,
        functionName: "get-balance",
        functionArgs: [
          controllerChainArg,
          controllerAddrArg,
          mappedAddressArg,
          tokenArg,
        ],
      });
      return BigInt(res?.value || 0);
    },

    /** Vault ledger balance for an arbitrary whitelisted SIP-010 token. */
    async getVaultTokenBalance(
      stacksApi: string,
      userChain: VaultUserChain,
      sourceAddress: string,
      mappedAddress: string,
      tokenContract: string,
    ): Promise<bigint> {
      const chain = normalizeVaultSourceChain(userChain);
      const [tokenAddr, tokenName] = tokenContract.split(".");
      const controllerChainArg = `0x${serializeCV(bufferCV(vaultChainIdBuffer(chain)))}`;
      const controllerAddrArg = `0x${serializeCV(bufferCV(vaultUserAddressBuffer(chain, sourceAddress)))}`;
      const mappedAddressArg = `0x${serializeCV(principalCV(mappedAddress))}`;
      const tokenArg = `0x${serializeCV(contractPrincipalCV(tokenAddr, tokenName))}`;

      const res = await callContractReadOnly(stacksApi, {
        contractAddress: deployer,
        contractName: vaultName,
        functionName: "get-balance",
        functionArgs: [
          controllerChainArg,
          controllerAddrArg,
          mappedAddressArg,
          tokenArg,
        ],
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

    /**
     * Fetch the current withdrawal nonce for a controller identity from the vault.
     * Must be embedded in the BMP1 message to prevent replay.
     */
    /** Per-controller nonce shared across all BMP1 vault opcodes. */
    async getControllerNonce(
      stacksApi: string,
      userChain: VaultUserChain,
      sourceAddress: string,
    ): Promise<bigint> {
      const chain = normalizeVaultSourceChain(userChain);
      const chainArg = `0x${serializeCV(bufferCV(vaultChainIdBuffer(chain)))}`;
      const addrArg = `0x${serializeCV(bufferCV(vaultUserAddressBuffer(chain, sourceAddress)))}`;

      const res = await callContractReadOnly(stacksApi, {
        contractAddress: deployer,
        contractName: vaultName,
        functionName: "get-nonce",
        functionArgs: [chainArg, addrArg],
      });
      return BigInt(res?.value ?? 0);
    },

    /** @deprecated Use getControllerNonce */
    getWithdrawNonce(
      stacksApi: string,
      userChain: VaultUserChain,
      sourceAddress: string,
    ) {
      return this.getControllerNonce(stacksApi, userChain, sourceAddress);
    },

    buildBuySharesBmp1(params: {
      userChain: VaultUserChain;
      sourceAddress: string;
      nonce: bigint;
      tokenPrincipalCommit: Uint8Array;
      mappedAddressCommit: Uint8Array;
      marketExtensionCommit: Uint8Array;
      marketId: bigint;
      outcomeIndex: bigint;
      maxCostMicro: bigint;
      minShares: bigint;
      expiryBlock?: bigint;
    }): Uint8Array {
      const chain = normalizeVaultSourceChain(params.userChain);
      return buildBmp1Message({
        opcode: BMP1_OPCODES.BUY_SHARES,
        chain: BMP1_CHAINS[chain],
        controllerAddress: vaultUserAddressBuffer(
          chain,
          params.sourceAddress,
        ),
        nonce: params.nonce,
        slots: [
          params.tokenPrincipalCommit,
          params.mappedAddressCommit,
          slotHighLow(params.outcomeIndex, params.marketId),
          params.marketExtensionCommit,
          slotHighLow(params.maxCostMicro, params.minShares),
          amountToSlot(params.expiryBlock ?? 0n),
        ],
      });
    },

    buildSellSharesBmp1(params: {
      userChain: VaultUserChain;
      sourceAddress: string;
      nonce: bigint;
      tokenPrincipalCommit: Uint8Array;
      mappedAddressCommit: Uint8Array;
      marketExtensionCommit: Uint8Array;
      marketId: bigint;
      outcomeIndex: bigint;
      minRefundMicro: bigint;
      sharesIn: bigint;
      expiryBlock?: bigint;
    }): Uint8Array {
      const chain = normalizeVaultSourceChain(params.userChain);
      return buildBmp1Message({
        opcode: BMP1_OPCODES.SELL_SHARES,
        chain: BMP1_CHAINS[chain],
        controllerAddress: vaultUserAddressBuffer(
          chain,
          params.sourceAddress,
        ),
        nonce: params.nonce,
        slots: [
          params.tokenPrincipalCommit,
          params.mappedAddressCommit,
          slotHighLow(params.outcomeIndex, params.marketId),
          params.marketExtensionCommit,
          slotHighLow(params.minRefundMicro, params.sharesIn),
          amountToSlot(params.expiryBlock ?? 0n),
        ],
      });
    },

    buildClaimWinningsBmp1(params: {
      userChain: VaultUserChain;
      sourceAddress: string;
      nonce: bigint;
      tokenPrincipalCommit: Uint8Array;
      mappedAddressCommit: Uint8Array;
      marketExtensionCommit: Uint8Array;
      marketId: bigint;
      expiryBlock?: bigint;
    }): Uint8Array {
      const chain = normalizeVaultSourceChain(params.userChain);
      return buildBmp1Message({
        opcode: BMP1_OPCODES.CLAIM_WINNINGS,
        chain: BMP1_CHAINS[chain],
        controllerAddress: vaultUserAddressBuffer(
          chain,
          params.sourceAddress,
        ),
        nonce: params.nonce,
        slots: [
          params.tokenPrincipalCommit,
          params.mappedAddressCommit,
          amountToSlot(params.marketId),
          params.marketExtensionCommit,
          undefined,
          amountToSlot(params.expiryBlock ?? 0n),
        ],
      });
    },

    /**
     * Build a 256-byte BMP1 withdrawal message ready for signing.
     *
     * Slot layout for OP_WITHDRAW:
     *   slot0 = keccak256( to-consensus-buff?(token-contract) )
     *   slot1 = keccak256( to-consensus-buff?(mapped-address) )
     *   slot2 = keccak256( to-consensus-buff?(recipient) )
     *   slot3 = amountToSlot(amountMicro)
     *   slot4 = amountToSlot(expiryBlock)  — 0 means no expiry
     *
     * Callers must supply the keccak256 commitment bytes (use
     * `keccak_256(hexToBytes(serializeCV(principalCV(addr))))` from @noble/hashes).
     */
    buildWithdrawBmp1(params: {
      userChain: VaultUserChain;
      sourceAddress: string;
      nonce: bigint;
      tokenPrincipalCommit: Uint8Array;
      mappedAddressCommit: Uint8Array;
      recipientCommit: Uint8Array;
      amountMicro: bigint;
      expiryBlock?: bigint;
    }): Uint8Array {
      const chain = normalizeVaultSourceChain(params.userChain);
      return buildBmp1Message({
        opcode: BMP1_OPCODES.WITHDRAW,
        chain: BMP1_CHAINS[chain],
        controllerAddress: vaultUserAddressBuffer(chain, params.sourceAddress),
        nonce: params.nonce,
        slots: [
          params.tokenPrincipalCommit,
          params.mappedAddressCommit,
          params.recipientCommit,
          amountToSlot(params.amountMicro),
          amountToSlot(params.expiryBlock ?? 0n),
        ],
      });
    },

    /**
     * Call vault `withdraw-direct`: the tx-sender (Leather / Xverse) IS the
     * controller, so no off-chain signature is required.
     *
     * Post-condition: the vault contract sends exactly `amountMicro` USDCx
     * to `recipientStxAddress`.
     */
    withdrawDirect(params: {
      amountMicro: bigint;
      /** Stacks principal that receives the tokens (may equal senderStxAddress). */
      recipientStxAddress: string;
      senderStxAddress: string;
    }) {
      const amount = params.amountMicro;
      if (amount <= 0n)
        throw new Error("Withdraw amount must be greater than zero");

      const vaultPrincipal = `${deployer}.${vaultName}`;
      const postConditions = pcForWithdraw(
        usdcx,
        vaultPrincipal,
        Number(amount),
      );

      return callContract(
        deployer,
        vaultName,
        network,
        "withdraw-direct",
        [
          contractPrincipalCV(usdcxAddr, usdcxContractName),
          uintCV(amount),
          principalCV(params.recipientStxAddress),
        ],
        postConditions,
        "deny",
      );
    },

    depositSip10ToVault(params: {
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
          // bufferCV(vaultChainIdBuffer(params.userChain)),
          // bufferCV(
          //   vaultUserAddressBuffer(params.userChain, params.sourceAddress),
          // ),
        ],
        postConditions,
        "deny",
      );
    },
  };
}

export type RelayerDepositParams = {
  /** Hex private key (compressed, "01" suffix) of the mapped/sender address. */
  privateKey: string;
  /** The Stacks address that holds the tokens and will send the tx. */
  senderAddress: string;
  amount: bigint;
  fee?: number;
  nonce?: number;
};

export type RelayerDepositForParams = RelayerDepositParams & {
  /** Normalised source chain identifier, e.g. 'stacks' | 'evm' | 'solana'. */
  sourceChain: string;
  /** Original cross-chain source address (STX addr for native Stacks, hex EVM addr, etc.). */
  sourceAddress: string;
  /** UUID-string intent id — hex chars (dashes stripped) are packed into a 32-byte buffer. */
  intentId: string;
};

/**
 * Server-side vault client. Builds and broadcasts Stacks transactions directly
 * using a private key rather than going through Stacks Connect.
 *
 * Used by the API relayer to sweep tokens into the vault on behalf of users.
 */
export function createVaultRelayerClient(daoConfig: DaoConfig) {
  const deployer = daoConfig.VITE_DAO_DEPLOYER;
  const vaultName = daoConfig.VITE_DAO_VAULT;
  const stacksNetwork = resolveStacksNetwork(daoConfig.VITE_NETWORK);
  const usdcxAddr = daoConfig.VITE_USDCX_CONTRACT_ADDRESS;
  const usdcxName = daoConfig.VITE_USDCX_CONTRACT_NAME;

  async function broadcast(
    params: RelayerDepositParams,
    functionName: string,
    functionArgs: ReturnType<typeof uintCV>[],
    fee: number,
  ) {
    const resolvedFee = BigInt(params.fee ?? fee);
    const resolvedNonce =
      params.nonce !== undefined ? BigInt(params.nonce) : undefined;

    const derivedAddress = getAddressFromPrivateKey(
      params.privateKey,
      stacksNetwork,
    );
    console.log("[vault-relayer] broadcast diagnostics:", {
      functionName,
      senderAddress: params.senderAddress,
      derivedAddress,
      addressMatch: derivedAddress === params.senderAddress,
      fee: resolvedFee.toString(),
      nonce: resolvedNonce?.toString() ?? "unset (auto)",
      network:
        stacksNetwork.transactionVersion === 0
          ? "mainnet(0x00)"
          : "testnet/devnet(0x80)",
      broadcastUrl: stacksNetwork.client.baseUrl,
    });

    const tx = await makeContractCall({
      contractAddress: deployer,
      contractName: vaultName,
      functionName,
      functionArgs,
      senderKey: params.privateKey,
      network: stacksNetwork,
      fee: resolvedFee,
      ...(resolvedNonce !== undefined ? { nonce: resolvedNonce } : {}),
      postConditionMode: PostConditionMode.Allow,
      postConditions: [],
    });

    const txHex = Buffer.from(serializeTransaction(tx)).toString("hex");
    console.log(
      "[vault-relayer] tx hex (first 200 chars):",
      txHex.slice(0, 200),
    );

    const result = await broadcastTransaction({
      transaction: tx,
      network: stacksNetwork,
    });

    if ("error" in result) {
      throw new Error(
        `broadcast failed: ${(result as { error: string }).error}` +
          ((result as { reason?: string }).reason
            ? ` — ${(result as { reason: string }).reason}`
            : ""),
      );
    }

    return { txid: result.txid };
  }

  return {
    /**
     * Vault `deposit` — tx-sender holds the tokens and calls this directly.
     * The vault credits CHAIN_STACKS against the sender's hash160.
     *
     * Mirrors Clarity:
     *   (deposit (token <sip010>) (amount uint))
     */
    async depositFromMappedAddress(
      params: RelayerDepositParams,
      defaultFee = 250_000,
    ) {
      if (params.amount <= 0n) throw new Error("amount must be > 0");

      return broadcast(
        params,
        "deposit",
        [
          contractPrincipalCV(usdcxAddr, usdcxName) as any,
          uintCV(params.amount) as any,
        ],
        defaultFee,
      );
    },

    /**
     * Vault `deposit-for` — relayer holds the ephemeral mapped key, sweeps
     * tokens to the vault and credits the real cross-chain identity.
     *
     * Mirrors Clarity:
     *   (deposit-for (token) (amount) (controller-chain buff4)
     *                (controller-address buff32) (mapped-address principal)
     *                (intent-id buff32))
     */
    async depositForFromMappedAddress(
      params: RelayerDepositForParams,
      defaultFee = 250_000,
    ) {
      if (params.amount <= 0n) throw new Error("amount must be > 0");

      console.log("depositForFromMappedAddress: params = ", params);

      const chain = normalizeVaultSourceChain(params.sourceChain);
      const controllerChain = bufferCV(vaultChainIdBuffer(chain));
      const controllerAddress = bufferCV(
        vaultUserAddressBuffer(chain, params.sourceAddress),
      );
      // For native Stacks source, credit the vault slot keyed by the user's own
      // STX address (sourceAddress) so that direct-deposit and relay-sweep both
      // accumulate to the same balance entry.
      // For EVM/Solana sources the mapped Stacks principal is the credit address.
      const vaultCreditAddress =
        chain === "stacks" ? params.sourceAddress : params.senderAddress;
      const mappedAddressCV = standardPrincipalCV(vaultCreditAddress);
      // UUID intentId: strip dashes then hex-decode into 16 bytes, zero-pad to 32
      const intentHex = params.intentId.replace(/-/g, "");
      const intentBytes = new Uint8Array(32);
      intentBytes.set(hexToBytes(`0x${intentHex}`), 16);
      const intentIdCV = bufferCV(intentBytes);

      return broadcast(
        params,
        "deposit-for",
        [
          contractPrincipalCV(usdcxAddr, usdcxName) as any,
          uintCV(params.amount) as any,
          controllerChain as any,
          controllerAddress as any,
          mappedAddressCV as any,
          intentIdCV as any,
        ],
        defaultFee,
      );
    },
  };
}
