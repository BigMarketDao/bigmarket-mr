/**
 * EVM (MetaMask) BMP1 withdrawal flow.
 *
 * Step 1 — sign:   requestWithdrawSignatureEvm()
 *   Builds the 256-byte BMP1 OP_WITHDRAW message for CHAIN_EVM, then
 *   asks MetaMask to sign it via eth_signTypedData_v4 (EIP-712).
 *
 *   The signed EIP-712 struct mirrors the Stacks SIP-018 withdraw tuple:
 *     BMP1Withdraw(address controller, uint256 amount, bytes32 bmp1Hash,
 *                  uint256 nonce, string operation, string recipient, string token)
 *
 *   Recovers the caller's uncompressed secp256k1 public key (X||Y, 64 bytes)
 *   from the signature for on-chain verification.
 *
 * Step 2 — submit: relayEvmWithdrawToServer()
 *   Posts the signed message to the BigMarket API server, which broadcasts
 *   the vault `withdraw` call.  The contract verifies the EVM secp256k1
 *   signature and transfers USDCx to the user's mapped Stacks address.
 *
 * After step 2 succeeds the caller's USDCx balance has moved from the vault
 * into the mapped Stacks address.  AllBridge can then bridge it to Ethereum.
 */

import type { DaoConfig, TxResult } from "@bigmarket/bm-types";
import { bytesToHex, hexToBytes } from "@stacks/common";
import {
  contractPrincipalCV,
  principalCV,
  serializeCV,
} from "@stacks/transactions";
import { createVaultClient } from "../chains/stacks/vault.js";
import {
  buildEvmBmp1TypedData,
  computeEvmBmp1Digest,
} from "./evmSip18.js";
import type { WithdrawFromVaultRequest } from "./stacksWithdraw.js";

export type EvmWithdrawParams = {
  daoConfig: DaoConfig;
  /** BigMarket API base URL (e.g. http://localhost:3020/bigmarket-api). */
  apiBaseUrl: string;
  /** Stacks API base URL (e.g. http://localhost:3999 for devnet). */
  stacksApi: string;
  /** Connected Ethereum address (0x…). */
  ethAddress: string;
  /**
   * The user's mapped Stacks address (ST… / SP…) – derived server-side
   * from the ethAddress and stored in walletState.activeAccount.mappedAddress.
   * This is both the `mapped-address` and `recipient` in the vault withdraw call.
   */
  mappedAddress: string;
  /** Amount in micro-units (6 decimals for USDCx). */
  amountMicro: bigint;
};

export type SignedEvmWithdrawMessage = {
  /** Raw 256-byte BMP1 message. */
  message: Uint8Array;
  /**
   * 65-byte signature in R(32) || S(32) || V(1) order (RSV), V normalised to 0 or 1.
   * This is what Clarity's secp256k1-recover? expects.
   * NOTE: noble/secp256k1 recoverPublicKey needs V||R||S (VRS); they are different orderings.
   */
  signature: Uint8Array;
  /**
   * 64-byte uncompressed pubkey (X||Y, no 04 prefix).
   * The vault contract's `verify-evm` function accepts (buff 64).
   */
  pubkey64: Uint8Array;
};

/**
 * Step 1: build the BMP1 message, sign it with MetaMask (EIP-712), and recover
 * the caller's uncompressed secp256k1 public key.
 */
export async function requestWithdrawSignatureEvm(
  params: EvmWithdrawParams,
): Promise<SignedEvmWithdrawMessage> {
  const { daoConfig, stacksApi, ethAddress, mappedAddress, amountMicro } =
    params;

  // ── Keccak-256 slot commitments ─────────────────────────────────────────
  const { keccak_256 } = await import("@noble/hashes/sha3");

  const tokenPrincipal = `${daoConfig.VITE_USDCX_CONTRACT_ADDRESS}.${daoConfig.VITE_USDCX_CONTRACT_NAME}`;
  const [usdcxAddr, usdcxName] = tokenPrincipal.split(".");

  const tokenCommit = keccak_256(
    hexToBytes(serializeCV(contractPrincipalCV(usdcxAddr, usdcxName))),
  );
  // Both mapped-address and recipient are the user's mapped Stacks address
  const mappedCommit = keccak_256(
    hexToBytes(serializeCV(principalCV(mappedAddress))),
  );
  const recipientCommit = keccak_256(
    hexToBytes(serializeCV(principalCV(mappedAddress))),
  );

  // ── Fetch current withdrawal nonce from vault ────────────────────────────
  const vault = createVaultClient(daoConfig);
  const nonce = await vault.getWithdrawNonce(stacksApi, "evm", ethAddress);

  // ── Build BMP1 message ───────────────────────────────────────────────────
  const bmp1 = vault.buildWithdrawBmp1({
    userChain: "evm",
    sourceAddress: ethAddress,
    nonce,
    tokenPrincipalCommit: tokenCommit,
    mappedAddressCommit: mappedCommit,
    recipientCommit,
    amountMicro,
  });

  const typedData = buildEvmBmp1TypedData({
    bmp1,
    ethAddress,
    display: {
      token: tokenPrincipal,
      mappedAddress,
      recipient: mappedAddress,
    },
  });
  const digest = computeEvmBmp1Digest(typedData.primaryType, typedData.message);

  const { getMetaMask } = await import("../chains/ethereum/injected.js");
  const provider = getMetaMask();

  const sigHex = (await provider.request({
    method: "eth_signTypedData_v4",
    params: [ethAddress, JSON.stringify(typedData)],
  })) as string;

  const rawSig = hexToBytes(sigHex.startsWith("0x") ? sigHex.slice(2) : sigHex);
  const v = rawSig[64] >= 27 ? rawSig[64] - 27 : rawSig[64];

  const vrsSig = new Uint8Array(65);
  vrsSig[0] = v;
  vrsSig.set(rawSig.slice(0, 64), 1);

  const rsvSig = new Uint8Array(65);
  rsvSig.set(rawSig.slice(0, 64), 0);
  rsvSig[64] = v;

  const { recoverPublicKey, Point } = await import("@noble/secp256k1");
  const compressedKey = recoverPublicKey(vrsSig, digest, { prehash: false });
  const uncompressedKey = Point.fromBytes(compressedKey).toBytes(false);
  const pubkey64 = uncompressedKey.slice(1);

  return { message: bmp1, signature: rsvSig, pubkey64 };
}

/**
 * Step 2: relay the signed BMP1 withdrawal to the BigMarket API server.
 *
 * The server uses its relayer key to broadcast vault `withdraw`.
 * The contract verifies the EVM secp256k1 signature and transfers
 * USDCx from the vault to the user's mapped Stacks address.
 *
 * Returns the Stacks txid on success.
 */
export async function relayEvmWithdrawToServer(
  params: EvmWithdrawParams,
  signed: SignedEvmWithdrawMessage,
): Promise<TxResult> {
  const body: WithdrawFromVaultRequest = {
    message: bytesToHex(signed.message),
    signature: bytesToHex(signed.signature),
    pubkey: bytesToHex(signed.pubkey64),
    stxAddress: params.mappedAddress,
    recipientAddress: params.mappedAddress,
    controllerAddress: params.ethAddress,
  };

  const url = `${params.apiBaseUrl}/cross-chain/protocol/withdraw-from-vault`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Relay failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { txid?: string; error?: string };
  if (data.error) throw new Error(data.error);
  if (!data.txid) throw new Error("Relayer did not return a txid.");

  return { success: true, txid: data.txid };
}
