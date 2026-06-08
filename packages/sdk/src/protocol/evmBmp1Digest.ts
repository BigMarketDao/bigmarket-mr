import { computeEvmBmp1Digest as digestFromTypedData, buildEvmBmp1TypedData } from "./evmSip18.js";

export {
  EIP712_DOMAIN_SEPARATOR,
  EIP712_TYPEHASH,
  EIP712_TYPES,
  buildEvmBmp1TypedData,
  computeEvmBmp1Digest,
  eip712HashDisplayString,
} from "./evmSip18.js";
export type { EvmBmp1DisplayStrings } from "./evmSip18.js";

/**
 * EIP-712 digest for EVM BMP1 verification (`verify-evm` in bme050-0-vault).
 */
export function computeEvmBmp1DigestFromMessage(params: {
  bmp1: Uint8Array;
  ethAddress: string;
  token: string;
  mappedAddress: string;
  recipient?: string;
}): Uint8Array {
  const typed = buildEvmBmp1TypedData({
    bmp1: params.bmp1,
    ethAddress: params.ethAddress,
    display: {
      token: params.token,
      mappedAddress: params.mappedAddress,
      recipient: params.recipient,
    },
  });
  return digestFromTypedData(typed.primaryType, typed.message);
}
