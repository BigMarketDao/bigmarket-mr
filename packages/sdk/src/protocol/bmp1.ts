/**
 * BigMarket Protocol Message v1 (BMP1)
 *
 * A 256-byte fixed-length structured message signed off-chain by the
 * controller key, then submitted on-chain (directly or via relayer).
 *
 * Layout (matches bme050-0-vault.clar constants):
 *   [0..7]    magic      "BMP1MSG\0"  (8 bytes)
 *   [8]       opcode                  (1 byte)
 *   [9]       version    0x01         (1 byte)
 *   [10..11]  flags                   (2 bytes)
 *   [12..15]  chain      CHAIN_*      (4 bytes)
 *   [16..47]  controller-address      (32 bytes)
 *   [48..63]  nonce      big-endian   (16 bytes)
 *   [64..95]  slot0                   (32 bytes)
 *   [96..127] slot1                   (32 bytes)
 *   [128..159]slot2                   (32 bytes)
 *   [160..191]slot3                   (32 bytes)
 *   [192..223]slot4                   (32 bytes)
 *   [224..255]slot5                   (32 bytes)
 *
 * Opcode-specific slot assignments for OP_WITHDRAW (0x01):
 *   slot0  keccak256(to-consensus-buff? token-principal)
 *   slot1  keccak256(to-consensus-buff? mapped-address)
 *   slot2  keccak256(to-consensus-buff? recipient)
 *   slot3  high-16=0  low-16=amount  (u128 big-endian)
 *   slot4  high-16=0  low-16=expiry  (u128 big-endian, 0 = no expiry)
 *   slot5  reserved / zero
 */

export const BMP1_OPCODES = {
  WITHDRAW: 0x01,
  BUY_SHARES: 0x02,
  SELL_SHARES: 0x03,
  CLAIM_WINNINGS: 0x04,
} as const;

export type Bmp1Opcode = (typeof BMP1_OPCODES)[keyof typeof BMP1_OPCODES];

/** Chain IDs matching CHAIN_* in bme050-0-vault.clar */
export const BMP1_CHAINS = {
  evm: new Uint8Array([0x00, 0x00, 0x00, 0x01]),
  btc: new Uint8Array([0x00, 0x00, 0x00, 0x02]),
  stacks: new Uint8Array([0x00, 0x00, 0x00, 0x03]),
  solana: new Uint8Array([0x00, 0x00, 0x00, 0x04]),
  p256: new Uint8Array([0x00, 0x00, 0x00, 0x05]),
} as const;

export type Bmp1Chain = keyof typeof BMP1_CHAINS;

export type Bmp1MessageParams = {
  opcode: Bmp1Opcode;
  /** 4-byte chain id — use BMP1_CHAINS[chain] */
  chain: Uint8Array;
  /** 32-byte normalised controller address (left-padded for 20-byte addresses) */
  controllerAddress: Uint8Array;
  /** Replay-protection nonce from the vault contract */
  nonce: bigint;
  /**
   * Up to 6 payload slots (each 32 bytes).  Pass null / undefined to zero-fill.
   * For OP_WITHDRAW:
   *   [0] keccak256 commitment to token principal
   *   [1] keccak256 commitment to mapped-address principal
   *   [2] keccak256 commitment to recipient principal
   *   [3] amount encoded in low 16 bytes
   *   [4] expiry encoded in low 16 bytes (0 = no expiry)
   *   [5] reserved
   */
  slots?: (Uint8Array | null | undefined)[];
  /** Optional flags (2 bytes, default 0x0000) */
  flags?: number;
};

const BMP1_MAGIC = new TextEncoder().encode("BMP1MSG\0");

/**
 * Build a 256-byte BMP1 message ready to be signed.
 *
 * For EVM: sign with MetaMask `eth_sign` (raw hash, NOT personal_sign) or
 * personal_sign if the contract verifies via EIP-712.
 * Currently the vault contract uses EIP-712 personal_sign with 256-byte payload.
 */
export function buildBmp1Message(params: Bmp1MessageParams): Uint8Array {
  const msg = new Uint8Array(256); // zero-initialised

  msg.set(BMP1_MAGIC, 0); // [0..7]
  msg[8] = params.opcode; // [8]
  msg[9] = 0x01; // [9] version

  const flags = params.flags ?? 0;
  msg[10] = (flags >> 8) & 0xff; // [10]
  msg[11] = flags & 0xff; // [11]

  msg.set(params.chain.slice(0, 4), 12); // [12..15]
  msg.set(params.controllerAddress.slice(0, 32), 16); // [16..47]
  msg.set(bigintTo16BytesBE(params.nonce), 48); // [48..63]

  for (let i = 0; i < 6; i++) {
    const slot = params.slots?.[i];
    if (slot && slot.length > 0) {
      const s = new Uint8Array(32);
      s.set(slot.slice(0, 32));
      msg.set(s, 64 + i * 32);
    }
    // else: already zero
  }

  return msg;
}

/**
 * Encode a uint128 amount / expiry value into the low 16 bytes of a 32-byte
 * slot (high 16 bytes are zero), matching `slot-low-uint` in Clarity.
 */
export function amountToSlot(value: bigint): Uint8Array {
  const slot = new Uint8Array(32);
  slot.set(bigintTo16BytesBE(value), 16); // low 16 bytes
  return slot;
}

// ── internal ────────────────────────────────────────────────────────────────

function bigintTo16BytesBE(n: bigint): Uint8Array {
  const bytes = new Uint8Array(16);
  let val = n;
  for (let i = 15; i >= 0; i--) {
    bytes[i] = Number(val & 0xffn);
    val >>= 8n;
  }
  return bytes;
}
