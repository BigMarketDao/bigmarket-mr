/**
 * Stacks-wallet BMP1 withdrawal flow.
 *
 * Step 1 — sign:   requestWithdrawSignatureStacks()
 *   Builds the 256-byte BMP1 OP_WITHDRAW message, wraps it in a
 *   SIP-018 structured-data envelope, and asks the Stacks wallet
 *   (Leather / Xverse) to sign it via stx_signStructuredMessage.
 *   Returns the raw message bytes + 65-byte RSV signature + compressed pubkey.
 *
 * Step 2 — submit: submitWithdrawStacks()
 *   Calls the vault contract's `withdraw` function via stx_callContract,
 *   passing the signed message, signature, and padded pubkey.  The user
 *   sees a second wallet popup (the on-chain transaction).
 */

import type { DaoConfig, TxResult } from "@bigmarket/bm-types";
import { bytesToHex, hexToBytes } from "@stacks/common";
import { contractPrincipalCV, principalCV, serializeCV } from "@stacks/transactions";
import { createVaultClient } from "../chains/stacks/vault.js";
import {
  buildStacksWithdrawMessageCv,
  stacksBmp1DomainCv,
} from "./stacksSip18.js";

export { buildStacksWithdrawMessageCv } from "./stacksSip18.js";

export type StacksWithdrawParams = {
  daoConfig: DaoConfig;
  /** BigMarket API base URL used by the relay step (e.g. http://localhost:3020/bigmarket-api). */
  apiBaseUrl: string;
  /** Stacks API base URL (e.g. http://localhost:3999 for devnet). */
  stacksApi: string;
  /** The user's Stacks address (ST… / SP…). */
  stxAddress: string;
  /** Amount in micro-units (6 decimals for USDCx). */
  amountMicro: bigint;
  /**
   * Stacks principal that receives the tokens.
   * Equals stxAddress for a self-withdrawal.
   */
  recipientAddress: string;
  controllerAddress?: string;
};

/**
 * JSON-serialisable form of a signed withdrawal sent to the relayer API.
 * All byte arrays are hex-encoded strings for safe JSON transport.
 */
export type WithdrawFromVaultRequest = {
  /** Hex of the 256-byte BMP1 message. */
  message: string;
  /** Hex of the 65-byte RSV secp256k1 signature. */
  signature: string;
  /** Hex of the 64-byte padded pubkey (33-byte compressed key + 31 zero bytes). */
  pubkey: string;
  /** The user's Stacks address — used as `mapped-address` in the contract call. */
  stxAddress: string;
  /** Destination Stacks address for the withdrawn tokens. */
  recipientAddress: string;
  /**
   * EVM (0x…) address of the user whose mapped Stacks address holds the funds.
   * When present the server derives the mapped private key via
   * deriveStacksPrivateKey(walletKey, controllerAddress) and uses it as the
   * tx senderKey instead of the global walletKey.
   * Omit for Stacks-native withdrawals where the server's walletKey is the relay.
   */
  controllerAddress?: string;
};

export type SignedWithdrawMessage = {
  /** Raw 256-byte BMP1 message. */
  message: Uint8Array;
  /** 65-byte RSV secp256k1 signature from stx_signStructuredMessage. */
  signature: Uint8Array;
  /**
   * 33-byte compressed pubkey, zero-padded to 64 bytes to match the
   * vault contract's (buff 64) parameter.  The contract does NOT use
   * this for CHAIN_STACKS verification (the key is recovered directly
   * from the signature), but it is included for transparency.
   */
  pubkey64: Uint8Array;
};

/**
 * Step 1: build the BMP1 message and ask the Stacks wallet to sign it
 * via SIP-018 structured data signing (stx_signStructuredMessage).
 *
 * The SIP-018 envelope the wallet computes is reproduced on-chain by
 * the vault contract's `verify-stacks-sip18` function using the
 * precomputed BigMarket domain hashes.
 */
export async function requestWithdrawSignatureStacks(
  params: StacksWithdrawParams,
): Promise<SignedWithdrawMessage> {
  const { daoConfig, stacksApi, stxAddress, amountMicro, recipientAddress } =
    params;

  // ── Dynamic imports (heavy bundles, tree-shaken at call-time) ────────────
  const [{ keccak_256 }, { sha256 }] = await Promise.all([
    import("@noble/hashes/sha3"),
    import("@noble/hashes/sha256"),
  ]);

  const usdcxAddr = daoConfig.VITE_USDCX_CONTRACT_ADDRESS;
  const usdcxName = daoConfig.VITE_USDCX_CONTRACT_NAME;

  // ── Build keccak256 commitments for the BMP1 commitment slots ────────────
  const tokenCommit = keccak_256(
    hexToBytes(serializeCV(contractPrincipalCV(usdcxAddr, usdcxName))),
  );
  const mappedCommit = keccak_256(
    hexToBytes(serializeCV(principalCV(stxAddress))),
  );
  const recipientCommit = keccak_256(
    hexToBytes(serializeCV(principalCV(recipientAddress))),
  );

  // ── Fetch current nonce ──────────────────────────────────────────────────
  const vault = createVaultClient(daoConfig);
  const nonce = await vault.getWithdrawNonce(stacksApi, "stacks", stxAddress);

  // ── Build BMP1 message ───────────────────────────────────────────────────
  const bmp1 = vault.buildWithdrawBmp1({
    userChain: "stacks",
    sourceAddress: stxAddress,
    nonce,
    tokenPrincipalCommit: tokenCommit,
    mappedAddressCommit: mappedCommit,
    recipientCommit,
    amountMicro,
  });

  // ── Build human-readable SIP-018 message tuple ───────────────────────────
  // sha256(bmp1) binds the signature to the full BMP1 payload while letting
  // the wallet show named fields (amount, nonce, token, recipient) instead
  // of a raw 256-byte binary blob.
  const bmp1Hash = sha256(bmp1);

  const messageCv = buildStacksWithdrawMessageCv({
    usdcxAddr,
    usdcxName,
    recipientAddress,
    amountMicro,
    nonce,
    bmp1Hash,
  });
  const domainCv = stacksBmp1DomainCv(daoConfig);

  const { request } = await import("@stacks/connect");
  const result = await request("stx_signStructuredMessage", {
    message: messageCv,
    domain: domainCv,
  });

  if (!result?.signature || !result?.publicKey) {
    throw new Error("Wallet did not return a signature.");
  }

  const sigBytes = hexToBytes(result.signature);
  const compressedPubkey = hexToBytes(result.publicKey); // 33 bytes

  // Pad compressed pubkey to 64 bytes (first 33 bytes used, remaining 31 = 0x00)
  const pubkey64 = new Uint8Array(64);
  pubkey64.set(compressedPubkey.slice(0, 33));

  return { message: bmp1, signature: sigBytes, pubkey64 };
}

/**
 * Step 2: relay the signed BMP1 withdrawal to the BigMarket API server.
 *
 * The server uses its own private key (`walletKey`) to broadcast the
 * `withdraw` transaction, so the user does NOT need a second wallet
 * popup and does NOT need STX for gas.
 *
 * Returns the Stacks txid on success.
 */
export async function relayWithdrawToServer(
  params: StacksWithdrawParams,
  signed: SignedWithdrawMessage,
): Promise<TxResult> {
  const body: WithdrawFromVaultRequest = {
    message: bytesToHex(signed.message),
    signature: bytesToHex(signed.signature),
    pubkey: bytesToHex(signed.pubkey64),
    stxAddress: params.stxAddress,
    recipientAddress: params.recipientAddress,
    controllerAddress: params.controllerAddress,
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
