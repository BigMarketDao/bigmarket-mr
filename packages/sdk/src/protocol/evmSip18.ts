/**
 * EIP-712 structured-data envelopes for EVM vault BMP1 verification.
 * Field names and values mirror Stacks SIP-018 tuples (stacksSip18.ts).
 */

import { bytesToHex, hexToBytes } from "@stacks/common";
import { keccak_256 } from "@noble/hashes/sha3";
import { BMP1_OPCODES, slotHighUint, slotLowUint } from "./bmp1.js";

export const EIP712_DOMAIN = { name: "BigMarket", version: "1.0.0" } as const;

/** keccak256(type string) — must match bme050-0-vault.clar constants. */
export const EIP712_TYPEHASH = {
  withdraw:
    "7ddd25b313d8b4710b8f87bee912e0a43a14b97f44a9098b71ce2e1bee319c9d",
  buyShares:
    "2075f387905a08b438d1a903792130d970c0b52709ab9f4c9d7ecb07ce2e4324",
  sellShares:
    "eca6ba45fa57685ad84c00f5e8b471235a345b20461c63e4b30cdbf7da3c7083",
  claimWinnings:
    "015e0b7da094f5a74b7810b287175317b3da28d96b771ea63a6a071d18b4264c",
} as const;

export const EIP712_DOMAIN_SEPARATOR = hexToBytes(
  "4e3c7155c429f36e33b8498ec258c659f393ec00d8434884b72472304c45681d",
);

const EIP712_PREFIX = new Uint8Array([0x19, 0x01]);

export const EIP712_TYPES = {
  EIP712Domain: [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
  ],
  BMP1Withdraw: [
    { name: "controller", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "bmp1Hash", type: "bytes32" },
    { name: "nonce", type: "uint256" },
    { name: "operation", type: "string" },
    { name: "recipient", type: "string" },
    { name: "token", type: "string" },
  ],
  BMP1BuyShares: [
    { name: "controller", type: "address" },
    { name: "bmp1Hash", type: "bytes32" },
    { name: "expiry", type: "uint256" },
    { name: "mappedAddress", type: "string" },
    { name: "marketId", type: "uint256" },
    { name: "maxCost", type: "uint256" },
    { name: "minShares", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "operation", type: "string" },
    { name: "outcomeIndex", type: "uint256" },
    { name: "token", type: "string" },
  ],
  BMP1SellShares: [
    { name: "controller", type: "address" },
    { name: "bmp1Hash", type: "bytes32" },
    { name: "expiry", type: "uint256" },
    { name: "mappedAddress", type: "string" },
    { name: "marketId", type: "uint256" },
    { name: "minRefund", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "operation", type: "string" },
    { name: "outcomeIndex", type: "uint256" },
    { name: "sharesIn", type: "uint256" },
    { name: "token", type: "string" },
  ],
  BMP1ClaimWinnings: [
    { name: "controller", type: "address" },
    { name: "bmp1Hash", type: "bytes32" },
    { name: "expiry", type: "uint256" },
    { name: "mappedAddress", type: "string" },
    { name: "marketId", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "operation", type: "string" },
    { name: "token", type: "string" },
  ],
} as const;

export type EvmBmp1DisplayStrings = {
  token: string;
  mappedAddress: string;
  recipient?: string;
};

function nonceFromBmp1(bmp1: Uint8Array): bigint {
  let nonceVal = 0n;
  for (let i = 48; i < 64; i++) {
    nonceVal = (nonceVal << 8n) + BigInt(bmp1[i]!);
  }
  return nonceVal;
}

/** keccak256(utf8(value)) — EIP-712 string field encoding; pass to vault as (buff 32). */
export function eip712HashDisplayString(value: string): Uint8Array {
  return keccak_256(new TextEncoder().encode(value));
}

function encodeAddress(address: string): Uint8Array {
  const hex = address.startsWith("0x") ? address.slice(2) : address;
  const addr = hexToBytes(hex);
  const out = new Uint8Array(32);
  out.set(addr, 32 - addr.length);
  return out;
}

function encodeUint256(value: bigint): Uint8Array {
  const out = new Uint8Array(32);
  let v = value;
  for (let i = 31; i >= 0; i--) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}

function encodeBytes32(value: Uint8Array): Uint8Array {
  if (value.length !== 32) {
    throw new Error(`bytes32 must be 32 bytes, got ${value.length}`);
  }
  return value;
}

function encodeField(type: string, value: unknown): Uint8Array {
  if (type === "address") {
    return encodeAddress(value as string);
  }
  if (type === "uint256") {
    return encodeUint256(
      typeof value === "bigint" ? value : BigInt(value as string | number),
    );
  }
  if (type === "bytes32") {
    if (typeof value === "string") {
      const hex = value.startsWith("0x") ? value.slice(2) : value;
      return encodeBytes32(hexToBytes(hex));
    }
    return encodeBytes32(value as Uint8Array);
  }
  if (type === "string") {
    return eip712HashDisplayString(value as string);
  }
  throw new Error(`Unsupported EIP-712 field type: ${type}`);
}

function hashStruct(
  primaryType: keyof typeof EIP712_TYPES,
  message: Record<string, unknown>,
): Uint8Array {
  const fields = EIP712_TYPES[primaryType];
  if (!fields) {
    throw new Error(`Unknown primary type: ${primaryType}`);
  }
  const typeHash = hexToBytes(EIP712_TYPEHASH[camelPrimaryType(primaryType)]);
  const encoded = new Uint8Array(32 + fields.length * 32);
  encoded.set(typeHash, 0);
  let offset = 32;
  for (const field of fields) {
    encoded.set(
      encodeField(field.type, message[field.name]),
      offset,
    );
    offset += 32;
  }
  return keccak_256(encoded);
}

function camelPrimaryType(
  primaryType: keyof typeof EIP712_TYPES,
): keyof typeof EIP712_TYPEHASH {
  const map: Record<string, keyof typeof EIP712_TYPEHASH> = {
    BMP1Withdraw: "withdraw",
    BMP1BuyShares: "buyShares",
    BMP1SellShares: "sellShares",
    BMP1ClaimWinnings: "claimWinnings",
  };
  return map[primaryType]!;
}

/** EIP-712 digest — mirrors verify-evm in bme050-0-vault.clar. */
export function computeEvmBmp1Digest(
  primaryType: Exclude<keyof typeof EIP712_TYPES, "EIP712Domain">,
  message: Record<string, unknown>,
): Uint8Array {
  const structHash = hashStruct(primaryType, message);
  return keccak_256(
    new Uint8Array([...EIP712_PREFIX, ...EIP712_DOMAIN_SEPARATOR, ...structHash]),
  );
}

export function buildEvmBmp1TypedData(params: {
  bmp1: Uint8Array;
  ethAddress: string;
  display: EvmBmp1DisplayStrings;
}): {
  types: typeof EIP712_TYPES;
  primaryType: Exclude<keyof typeof EIP712_TYPES, "EIP712Domain">;
  domain: typeof EIP712_DOMAIN;
  message: Record<string, string>;
} {
  const { bmp1, ethAddress, display } = params;
  const bmp1Hash = keccak_256(bmp1);
  const nonce = nonceFromBmp1(bmp1);
  const opcode = bmp1[8]!;
  const slot2 = bmp1.slice(128, 160);
  const slot3 = bmp1.slice(160, 192);
  const slot4 = bmp1.slice(192, 224);
  const slot5 = bmp1.slice(224, 256);
  const bmp1HashHex = `0x${bytesToHex(bmp1Hash)}`;

  if (opcode === BMP1_OPCODES.WITHDRAW) {
    return {
      types: EIP712_TYPES,
      primaryType: "BMP1Withdraw",
      domain: EIP712_DOMAIN,
      message: {
        controller: ethAddress,
        amount: slotLowUint(slot3).toString(),
        bmp1Hash: bmp1HashHex,
        nonce: nonce.toString(),
        operation: "withdraw",
        recipient: display.recipient ?? display.mappedAddress,
        token: display.token,
      },
    };
  }
  if (opcode === BMP1_OPCODES.BUY_SHARES) {
    return {
      types: EIP712_TYPES,
      primaryType: "BMP1BuyShares",
      domain: EIP712_DOMAIN,
      message: {
        controller: ethAddress,
        bmp1Hash: bmp1HashHex,
        expiry: slotLowUint(slot5).toString(),
        mappedAddress: display.mappedAddress,
        marketId: slotLowUint(slot2).toString(),
        maxCost: slotHighUint(slot4).toString(),
        minShares: slotLowUint(slot4).toString(),
        nonce: nonce.toString(),
        operation: "buy-shares",
        outcomeIndex: slotHighUint(slot2).toString(),
        token: display.token,
      },
    };
  }
  if (opcode === BMP1_OPCODES.SELL_SHARES) {
    return {
      types: EIP712_TYPES,
      primaryType: "BMP1SellShares",
      domain: EIP712_DOMAIN,
      message: {
        controller: ethAddress,
        bmp1Hash: bmp1HashHex,
        expiry: slotLowUint(slot5).toString(),
        mappedAddress: display.mappedAddress,
        marketId: slotLowUint(slot2).toString(),
        minRefund: slotHighUint(slot4).toString(),
        nonce: nonce.toString(),
        operation: "sell-shares",
        outcomeIndex: slotHighUint(slot2).toString(),
        sharesIn: slotLowUint(slot4).toString(),
        token: display.token,
      },
    };
  }
  if (opcode === BMP1_OPCODES.CLAIM_WINNINGS) {
    return {
      types: EIP712_TYPES,
      primaryType: "BMP1ClaimWinnings",
      domain: EIP712_DOMAIN,
      message: {
        controller: ethAddress,
        bmp1Hash: bmp1HashHex,
        expiry: slotLowUint(slot5).toString(),
        mappedAddress: display.mappedAddress,
        marketId: slotLowUint(slot2).toString(),
        nonce: nonce.toString(),
        operation: "claim-winnings",
        token: display.token,
      },
    };
  }
  throw new Error(`Unsupported BMP1 opcode for EVM EIP-712: 0x${opcode.toString(16)}`);
}
