/**
 * Vault-mediated market participation (buy / sell / claim) via BMP1 + relayer.
 *
 * Flow: build BMP1 → sign (EVM or Stacks) → POST once to `/cross-chain/protocol/vault-market-op`.
 */

import type {
  DaoConfig,
  PredictionMarketCreateEvent,
  TxResult,
  VaultUserChain,
} from "@bigmarket/bm-types";
import { bytesToHex, hexToBytes } from "@stacks/common";
import { createVaultClient } from "../chains/stacks/vault.js";
import { principalCommitment, splitPrincipal } from "./commitments.js";
import { computeEvmBmp1Digest } from "./evmBmp1Digest.js";
import {
  buildStacksBmp1MessageCv,
  stacksBmp1DomainCv,
} from "./stacksSip18.js";

export const VAULT_MARKET_OPERATIONS = {
  BUY_SHARES: "buy-shares",
  SELL_SHARES: "sell-shares",
  CLAIM_WINNINGS: "claim-winnings",
} as const;

export type VaultMarketOperation =
  (typeof VAULT_MARKET_OPERATIONS)[keyof typeof VAULT_MARKET_OPERATIONS];

export type SignedVaultBmp1 = {
  message: Uint8Array;
  signature: Uint8Array;
  pubkey64: Uint8Array;
};

/** Single relay body for all vault market ops (one API handler). */
export type VaultMarketOpRequest = {
  operation: VaultMarketOperation;
  message: string;
  signature: string;
  pubkey: string;
  mappedAddress: string;
  marketExtension: string;
  tokenContract: string;
  controllerAddress?: string;
};

export type VaultMarketBaseParams = {
  daoConfig: DaoConfig;
  apiBaseUrl: string;
  stacksApi: string;
  mappedAddress: string;
  market: PredictionMarketCreateEvent;
  tokenContract: string;
  expiryBlock?: bigint;
};

export type VaultBuyParams = VaultMarketBaseParams & {
  userChain: VaultUserChain;
  sourceAddress: string;
  outcomeIndex: number;
  maxCostMicro: bigint;
  minShares: bigint;
};

export type VaultSellParams = VaultMarketBaseParams & {
  userChain: VaultUserChain;
  sourceAddress: string;
  outcomeIndex: number;
  minRefundMicro: bigint;
  sharesIn: bigint;
};

export type VaultClaimParams = VaultMarketBaseParams & {
  userChain: VaultUserChain;
  sourceAddress: string;
};

function nonceFromBmp1(bmp1: Uint8Array): bigint {
  let nonceVal = 0n;
  for (let i = 48; i < 64; i++) {
    nonceVal = (nonceVal << 8n) + BigInt(bmp1[i]);
  }
  return nonceVal;
}

async function marketCommits(
  tokenContract: string,
  mappedAddress: string,
  marketExtension: string,
) {
  const [tokenCommit, mappedCommit, marketCommit] = await Promise.all([
    principalCommitment(tokenContract, true),
    principalCommitment(mappedAddress, false),
    principalCommitment(marketExtension, true),
  ]);
  return { tokenCommit, mappedCommit, marketCommit };
}

export async function buildVaultBuyBmp1(
  params: VaultBuyParams,
): Promise<Uint8Array> {
  const vault = createVaultClient(params.daoConfig);
  const { tokenCommit, mappedCommit, marketCommit } = await marketCommits(
    params.tokenContract,
    params.mappedAddress,
    params.market.extension,
  );
  const nonce = await vault.getControllerNonce(
    params.stacksApi,
    params.userChain,
    params.sourceAddress,
  );
  return vault.buildBuySharesBmp1({
    userChain: params.userChain,
    sourceAddress: params.sourceAddress,
    nonce,
    tokenPrincipalCommit: tokenCommit,
    mappedAddressCommit: mappedCommit,
    marketExtensionCommit: marketCommit,
    marketId: BigInt(params.market.marketId),
    outcomeIndex: BigInt(params.outcomeIndex),
    maxCostMicro: params.maxCostMicro,
    minShares: params.minShares,
    expiryBlock: params.expiryBlock,
  });
}

export async function buildVaultSellBmp1(
  params: VaultSellParams,
): Promise<Uint8Array> {
  const vault = createVaultClient(params.daoConfig);
  const { tokenCommit, mappedCommit, marketCommit } = await marketCommits(
    params.tokenContract,
    params.mappedAddress,
    params.market.extension,
  );
  const nonce = await vault.getControllerNonce(
    params.stacksApi,
    params.userChain,
    params.sourceAddress,
  );
  return vault.buildSellSharesBmp1({
    userChain: params.userChain,
    sourceAddress: params.sourceAddress,
    nonce,
    tokenPrincipalCommit: tokenCommit,
    mappedAddressCommit: mappedCommit,
    marketExtensionCommit: marketCommit,
    marketId: BigInt(params.market.marketId),
    outcomeIndex: BigInt(params.outcomeIndex),
    minRefundMicro: params.minRefundMicro,
    sharesIn: params.sharesIn,
    expiryBlock: params.expiryBlock,
  });
}

export async function buildVaultClaimBmp1(
  params: VaultClaimParams,
): Promise<Uint8Array> {
  const vault = createVaultClient(params.daoConfig);
  const { tokenCommit, mappedCommit, marketCommit } = await marketCommits(
    params.tokenContract,
    params.mappedAddress,
    params.market.extension,
  );
  const nonce = await vault.getControllerNonce(
    params.stacksApi,
    params.userChain,
    params.sourceAddress,
  );
  return vault.buildClaimWinningsBmp1({
    userChain: params.userChain,
    sourceAddress: params.sourceAddress,
    nonce,
    tokenPrincipalCommit: tokenCommit,
    mappedAddressCommit: mappedCommit,
    marketExtensionCommit: marketCommit,
    marketId: BigInt(params.market.marketId),
    expiryBlock: params.expiryBlock,
  });
}

/**
 * Sign with MetaMask EIP-712 (same digest path as vault tests / `verify-evm`).
 */
export async function signVaultBmp1Evm(params: {
  bmp1: Uint8Array;
  ethAddress: string;
}): Promise<SignedVaultBmp1> {
  const digest = computeEvmBmp1Digest(params.bmp1);
  const { keccak_256 } = await import("@noble/hashes/sha3");
  const bmp1Hash = keccak_256(params.bmp1);
  const nonce = nonceFromBmp1(params.bmp1);
  // Must match slot3 in the BMP1 payload (verify-evm struct encoding).
  const slot3 = params.bmp1.slice(160, 192);
  const amountForWallet = BigInt("0x" + bytesToHex(slot3));

  const typedData = {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
      ],
      BMP1Withdraw: [
        { name: "controller", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "bmp1Hash", type: "bytes32" },
      ],
    },
    primaryType: "BMP1Withdraw",
    domain: { name: "BigMarket", version: "1.0.0" },
    message: {
      controller: params.ethAddress,
      amount: amountForWallet.toString(),
      nonce: nonce.toString(),
      bmp1Hash: `0x${bytesToHex(bmp1Hash)}`,
    },
  };

  const { getMetaMask } = await import("../chains/ethereum/injected.js");
  const provider = getMetaMask();
  const sigHex = (await provider.request({
    method: "eth_signTypedData_v4",
    params: [params.ethAddress, JSON.stringify(typedData)],
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

  return { message: params.bmp1, signature: rsvSig, pubkey64 };
}

/** Stacks SIP-018 sign — opcode-specific tuple (see vault `verify-stacks-sip18`). */
export async function signVaultBmp1Stacks(params: {
  daoConfig: DaoConfig;
  bmp1: Uint8Array;
  mappedAddress: string;
  tokenContract: string;
}): Promise<SignedVaultBmp1> {
  const messageCv = await buildStacksBmp1MessageCv({
    bmp1: params.bmp1,
    tokenContract: params.tokenContract,
    mappedAddress: params.mappedAddress,
  });
  const domainCv = stacksBmp1DomainCv(params.daoConfig);

  const { request } = await import("@stacks/connect");
  const result = await request("stx_signStructuredMessage", {
    message: messageCv,
    domain: domainCv,
  });

  if (!result?.signature || !result?.publicKey) {
    throw new Error("Wallet did not return a signature.");
  }

  const sigBytes = hexToBytes(result.signature);
  const compressedPubkey = hexToBytes(result.publicKey);
  const pubkey64 = new Uint8Array(64);
  pubkey64.set(compressedPubkey.slice(0, 33));

  return { message: params.bmp1, signature: sigBytes, pubkey64 };
}

export function toVaultMarketOpRequest(
  operation: VaultMarketOperation,
  signed: SignedVaultBmp1,
  mappedAddress: string,
  marketExtension: string,
  tokenContract: string,
  controllerAddress?: string,
): VaultMarketOpRequest {
  return {
    operation,
    message: bytesToHex(signed.message),
    signature: bytesToHex(signed.signature),
    pubkey: bytesToHex(signed.pubkey64),
    mappedAddress,
    marketExtension,
    tokenContract,
    controllerAddress,
  };
}

const VAULT_MARKET_OP_PATH = "/cross-chain/protocol/vault-market-op";

export async function relayVaultMarketOp(
  apiBaseUrl: string,
  body: VaultMarketOpRequest,
): Promise<TxResult> {
  const url = `${apiBaseUrl}${VAULT_MARKET_OP_PATH}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Vault market relay failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { txid?: string; error?: string };
  if (data.error) throw new Error(data.error);
  if (!data.txid) throw new Error("Relayer did not return a txid.");
  return { success: true, txid: data.txid };
}

// ── High-level: build → sign → relay ────────────────────────────────────────

export async function vaultBuySharesEvm(
  params: VaultBuyParams & { ethAddress: string },
): Promise<TxResult> {
  const bmp1 = await buildVaultBuyBmp1(params);
  const signed = await signVaultBmp1Evm({
    bmp1,
    ethAddress: params.ethAddress,
  });
  const body = toVaultMarketOpRequest(
    VAULT_MARKET_OPERATIONS.BUY_SHARES,
    signed,
    params.mappedAddress,
    params.market.extension,
    params.tokenContract,
    params.ethAddress,
  );
  return relayVaultMarketOp(params.apiBaseUrl, body);
}

export async function vaultBuySharesStacks(
  params: VaultBuyParams,
): Promise<TxResult> {
  const bmp1 = await buildVaultBuyBmp1(params);
  const signed = await signVaultBmp1Stacks({
    daoConfig: params.daoConfig,
    bmp1,
    mappedAddress: params.mappedAddress,
    tokenContract: params.tokenContract,
  });
  const body = toVaultMarketOpRequest(
    VAULT_MARKET_OPERATIONS.BUY_SHARES,
    signed,
    params.mappedAddress,
    params.market.extension,
    params.tokenContract,
  );
  return relayVaultMarketOp(params.apiBaseUrl, body);
}

export async function vaultSellSharesEvm(
  params: VaultSellParams & { ethAddress: string },
): Promise<TxResult> {
  const bmp1 = await buildVaultSellBmp1(params);
  const signed = await signVaultBmp1Evm({
    bmp1,
    ethAddress: params.ethAddress,
  });
  const body = toVaultMarketOpRequest(
    VAULT_MARKET_OPERATIONS.SELL_SHARES,
    signed,
    params.mappedAddress,
    params.market.extension,
    params.tokenContract,
    params.ethAddress,
  );
  return relayVaultMarketOp(params.apiBaseUrl, body);
}

export async function vaultSellSharesStacks(
  params: VaultSellParams,
): Promise<TxResult> {
  const bmp1 = await buildVaultSellBmp1(params);
  const signed = await signVaultBmp1Stacks({
    daoConfig: params.daoConfig,
    bmp1,
    mappedAddress: params.mappedAddress,
    tokenContract: params.tokenContract,
  });
  const body = toVaultMarketOpRequest(
    VAULT_MARKET_OPERATIONS.SELL_SHARES,
    signed,
    params.mappedAddress,
    params.market.extension,
    params.tokenContract,
  );
  return relayVaultMarketOp(params.apiBaseUrl, body);
}

export async function vaultClaimWinningsEvm(
  params: VaultClaimParams & { ethAddress: string },
): Promise<TxResult> {
  const bmp1 = await buildVaultClaimBmp1(params);
  const signed = await signVaultBmp1Evm({
    bmp1,
    ethAddress: params.ethAddress,
  });
  const body = toVaultMarketOpRequest(
    VAULT_MARKET_OPERATIONS.CLAIM_WINNINGS,
    signed,
    params.mappedAddress,
    params.market.extension,
    params.tokenContract,
    params.ethAddress,
  );
  return relayVaultMarketOp(params.apiBaseUrl, body);
}

export async function vaultClaimWinningsStacks(
  params: VaultClaimParams,
): Promise<TxResult> {
  const bmp1 = await buildVaultClaimBmp1(params);
  const signed = await signVaultBmp1Stacks({
    daoConfig: params.daoConfig,
    bmp1,
    mappedAddress: params.mappedAddress,
    tokenContract: params.tokenContract,
  });
  const body = toVaultMarketOpRequest(
    VAULT_MARKET_OPERATIONS.CLAIM_WINNINGS,
    signed,
    params.mappedAddress,
    params.market.extension,
    params.tokenContract,
  );
  return relayVaultMarketOp(params.apiBaseUrl, body);
}
