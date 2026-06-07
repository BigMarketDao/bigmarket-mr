/**
 * SIP-018 structured-data message tuples for Stacks vault BMP1 verification.
 * Must match opcode-specific verifiers in bme050-0-vault.clar.
 */

import type { DaoConfig } from "@bigmarket/bm-types";
import {
  bufferCV,
  contractPrincipalCV,
  principalCV,
  stringAsciiCV,
  tupleCV,
  uintCV,
  type TupleCV,
} from "@stacks/transactions";
import { BMP1_OPCODES, slotHighUint, slotLowUint } from "./bmp1.js";
import { splitPrincipal } from "./commitments.js";

export function buildStacksWithdrawMessageCv(params: {
  usdcxAddr: string;
  usdcxName: string;
  recipientAddress: string;
  amountMicro: bigint;
  nonce: bigint;
  bmp1Hash: Uint8Array;
}): TupleCV {
  return tupleCV({
    amount: uintCV(params.amountMicro),
    "bmp1-hash": bufferCV(params.bmp1Hash),
    nonce: uintCV(params.nonce),
    operation: stringAsciiCV("withdraw"),
    recipient: principalCV(params.recipientAddress),
    token: contractPrincipalCV(params.usdcxAddr, params.usdcxName),
  });
}

export function buildStacksBuySharesMessageCv(params: {
  tokenAddr: string;
  tokenName: string;
  mappedAddress: string;
  marketId: bigint;
  outcomeIndex: bigint;
  maxCostMicro: bigint;
  minShares: bigint;
  expiry: bigint;
  nonce: bigint;
  bmp1Hash: Uint8Array;
}): TupleCV {
  return tupleCV({
    "bmp1-hash": bufferCV(params.bmp1Hash),
    expiry: uintCV(params.expiry),
    "mapped-address": principalCV(params.mappedAddress),
    "market-id": uintCV(params.marketId),
    "max-cost": uintCV(params.maxCostMicro),
    "min-shares": uintCV(params.minShares),
    nonce: uintCV(params.nonce),
    operation: stringAsciiCV("buy-shares"),
    "outcome-index": uintCV(params.outcomeIndex),
    token: contractPrincipalCV(params.tokenAddr, params.tokenName),
  });
}

export function buildStacksSellSharesMessageCv(params: {
  tokenAddr: string;
  tokenName: string;
  mappedAddress: string;
  marketId: bigint;
  outcomeIndex: bigint;
  minRefundMicro: bigint;
  sharesIn: bigint;
  expiry: bigint;
  nonce: bigint;
  bmp1Hash: Uint8Array;
}): TupleCV {
  return tupleCV({
    "bmp1-hash": bufferCV(params.bmp1Hash),
    expiry: uintCV(params.expiry),
    "mapped-address": principalCV(params.mappedAddress),
    "market-id": uintCV(params.marketId),
    "min-refund": uintCV(params.minRefundMicro),
    nonce: uintCV(params.nonce),
    operation: stringAsciiCV("sell-shares"),
    "outcome-index": uintCV(params.outcomeIndex),
    "shares-in": uintCV(params.sharesIn),
    token: contractPrincipalCV(params.tokenAddr, params.tokenName),
  });
}

export function buildStacksClaimWinningsMessageCv(params: {
  tokenAddr: string;
  tokenName: string;
  mappedAddress: string;
  marketId: bigint;
  expiry: bigint;
  nonce: bigint;
  bmp1Hash: Uint8Array;
}): TupleCV {
  return tupleCV({
    "bmp1-hash": bufferCV(params.bmp1Hash),
    expiry: uintCV(params.expiry),
    "mapped-address": principalCV(params.mappedAddress),
    "market-id": uintCV(params.marketId),
    nonce: uintCV(params.nonce),
    operation: stringAsciiCV("claim-winnings"),
    token: contractPrincipalCV(params.tokenAddr, params.tokenName),
  });
}

function nonceFromBmp1(bmp1: Uint8Array): bigint {
  let nonceVal = 0n;
  for (let i = 48; i < 64; i++) {
    nonceVal = (nonceVal << 8n) + BigInt(bmp1[i]!);
  }
  return nonceVal;
}

/** Build the SIP-018 message tuple for a 256-byte BMP1 payload (Stacks wallet signing). */
export async function buildStacksBmp1MessageCv(params: {
  bmp1: Uint8Array;
  tokenContract: string;
  mappedAddress: string;
  recipientAddress?: string;
}): Promise<TupleCV> {
  const { sha256 } = await import("@noble/hashes/sha256");
  const bmp1Hash = sha256(params.bmp1);
  const opcode = params.bmp1[8]!;
  const { address: tokenAddr, name: tokenName } = splitPrincipal(
    params.tokenContract,
  );
  const nonce = nonceFromBmp1(params.bmp1);
  const slot2 = params.bmp1.slice(128, 160);
  const slot3 = params.bmp1.slice(160, 192);
  const slot4 = params.bmp1.slice(192, 224);
  const slot5 = params.bmp1.slice(224, 256);

  if (opcode === BMP1_OPCODES.WITHDRAW) {
    return buildStacksWithdrawMessageCv({
      usdcxAddr: tokenAddr,
      usdcxName: tokenName,
      recipientAddress: params.recipientAddress ?? params.mappedAddress,
      amountMicro: slotLowUint(slot3),
      nonce,
      bmp1Hash,
    });
  }
  if (opcode === BMP1_OPCODES.BUY_SHARES) {
    return buildStacksBuySharesMessageCv({
      tokenAddr,
      tokenName,
      mappedAddress: params.mappedAddress,
      marketId: slotLowUint(slot2),
      outcomeIndex: slotHighUint(slot2),
      maxCostMicro: slotHighUint(slot4),
      minShares: slotLowUint(slot4),
      expiry: slotLowUint(slot5),
      nonce,
      bmp1Hash,
    });
  }
  if (opcode === BMP1_OPCODES.SELL_SHARES) {
    return buildStacksSellSharesMessageCv({
      tokenAddr,
      tokenName,
      mappedAddress: params.mappedAddress,
      marketId: slotLowUint(slot2),
      outcomeIndex: slotHighUint(slot2),
      minRefundMicro: slotHighUint(slot4),
      sharesIn: slotLowUint(slot4),
      expiry: slotLowUint(slot5),
      nonce,
      bmp1Hash,
    });
  }
  if (opcode === BMP1_OPCODES.CLAIM_WINNINGS) {
    return buildStacksClaimWinningsMessageCv({
      tokenAddr,
      tokenName,
      mappedAddress: params.mappedAddress,
      marketId: slotLowUint(slot2),
      expiry: slotLowUint(slot5),
      nonce,
      bmp1Hash,
    });
  }
  throw new Error(`Unsupported BMP1 opcode for Stacks SIP-018: 0x${opcode.toString(16)}`);
}

export function stacksBmp1DomainCv(daoConfig: DaoConfig): TupleCV {
  const chainId = daoConfig.VITE_NETWORK === "mainnet" ? 1 : 2147483648;
  return tupleCV({
    name: stringAsciiCV("BigMarket"),
    version: stringAsciiCV("1.0.0"),
    "chain-id": uintCV(chainId),
  });
}
