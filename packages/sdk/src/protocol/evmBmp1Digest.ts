import { hexToBytes } from "@stacks/common";
import { keccak_256 } from "@noble/hashes/sha3";

/** keccak256("BMP1Withdraw(address controller,uint256 amount,uint256 nonce,bytes32 bmp1Hash)") */
export const EIP712_WITHDRAW_TYPEHASH = hexToBytes(
  "f1ebe45c9252e59f16c9eaed223a770a5d40b6b8bc14507a83cc68a149d644ba",
);

export const EIP712_DOMAIN_SEPARATOR = hexToBytes(
  "4e3c7155c429f36e33b8498ec258c659f393ec00d8434884b72472304c45681d",
);

const EIP712_PREFIX = new Uint8Array([0x19, 0x01]);

/**
 * EIP-712 digest for EVM BMP1 verification (`verify-evm` in bme050-0-vault).
 * Uses slot3 bytes from the message as the struct `amount` word (withdraw amount,
 * market commit, etc.) — the full payload is bound via bmp1Hash.
 */
export function computeEvmBmp1Digest(message: Uint8Array): Uint8Array {
  const bmp1Hash = keccak_256(message);
  const controller = message.slice(16, 48);
  const slot3 = message.slice(160, 192);
  const nonce16 = message.slice(48, 64);
  const nonce32 = new Uint8Array(32);
  nonce32.set(nonce16, 16);

  const structEncoded = new Uint8Array(160);
  structEncoded.set(EIP712_WITHDRAW_TYPEHASH, 0);
  structEncoded.set(controller, 32);
  structEncoded.set(slot3, 64);
  structEncoded.set(nonce32, 96);
  structEncoded.set(bmp1Hash, 128);

  const structHash = keccak_256(structEncoded);
  return keccak_256(
    new Uint8Array([...EIP712_PREFIX, ...EIP712_DOMAIN_SEPARATOR, ...structHash]),
  );
}
