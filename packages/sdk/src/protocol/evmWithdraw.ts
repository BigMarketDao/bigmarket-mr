/**
 * EVM (MetaMask) BMP1 withdrawal flow.
 *
 * Step 1 — sign:   requestWithdrawSignatureEvm()
 *   Builds the 256-byte BMP1 OP_WITHDRAW message for CHAIN_EVM, then
 *   asks MetaMask to sign it via eth_signTypedData_v4 (EIP-712).
 *
 *   The signed EIP-712 struct is:
 *     BMP1Withdraw(address controller, uint256 amount, uint256 nonce, bytes32 bmp1Hash)
 *
 *   MetaMask renders each field by name so users see their ETH address,
 *   the withdrawal amount, the nonce, and a 32-byte commitment to the full
 *   BMP1 message — instead of raw binary bytes.
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
   * 65-byte RSV signature from MetaMask eth_signTypedData_v4 (EIP-712).
   * Last byte is the recovery id (0 or 1, already normalised from v=27/28).
   */
  signature: Uint8Array;
  /**
   * 64-byte uncompressed pubkey (X||Y, no 04 prefix).
   * The vault contract's `verify-evm` function accepts (buff 64).
   */
  pubkey64: Uint8Array;
};

/**
 * Step 1: build the BMP1 message, sign it with MetaMask (personal_sign /
 * EIP-191), and recover the caller's uncompressed secp256k1 public key.
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

  // ── Sign with MetaMask eth_signTypedData_v4 (EIP-712) ────────────────────
  // MetaMask renders: "BigMarket · BMP1Withdraw · payload: 0x424d50…"
  // — far more readable than raw personal_sign bytes.
  const { getMetaMask } = await import(
    "../chains/ethereum/injected.js"
  );
  const provider = getMetaMask();

  // ── Parse BMP1 fields for EIP-712 typed data ────────────────────────────
  // BMP1 layout (offsets in bytes):
  //   [0-7]   magic / version / opcode / flags
  //   [8]     opcode,  [9] version,  [10-11] flags
  //   [12-15] chain (4 bytes)
  //   [16-47] controller-address (32 bytes, 12 zero padding + 20-byte EVM addr)
  //   [48-63] nonce (16 bytes big-endian)
  //   [64-95] slot0 (token commit)  ...
  //   [160-191] slot3 (amount, uint256-compatible: high 16 = 0, low 16 = value)

  const bmp1Hash = keccak_256(bmp1);                // bytes32 — binds the signature to the full BMP1
  const controllerBytes = bmp1.slice(16, 48);       // (buff 32) — EIP-712 address encoding
  const amountSlot = bmp1.slice(160, 192);          // (buff 32) — EIP-712 uint256 encoding
  const nonceBuff16 = bmp1.slice(48, 64);           // (buff 16) from BMP1

  // The EIP-712 typed-data message (what MetaMask displays):
  //   controller → recognisable 0x ETH address
  //   amount     → integer (micro-units, e.g. 55000000 for 55 USDCx)
  //   nonce      → replay-protection counter
  //   bmp1Hash   → commitment to the full BMP1 payload
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
      controller: ethAddress,
      // MetaMask converts BigInt-as-string to uint256 correctly
      amount: amountMicro.toString(),
      nonce: nonce.toString(),
      bmp1Hash: `0x${bytesToHex(bmp1Hash)}`,
    },
  };

  const sigHex = (await provider.request({
    method: "eth_signTypedData_v4",
    params: [ethAddress, JSON.stringify(typedData)],
  })) as string;

  // MetaMask returns 65 bytes in R(32) || S(32) || V(1) order, where V = 27 or 28.
  const rawSig = hexToBytes(sigHex.startsWith("0x") ? sigHex.slice(2) : sigHex);

  // Normalise V: some wallets return 0/1, others 27/28
  const v = rawSig[64] >= 27 ? rawSig[64] - 27 : rawSig[64];

  // Both noble/secp256k1 v3 'recovered' format AND Clarity's secp256k1-recover?
  // expect V(1) || R(32) || S(32) — recovery byte FIRST.
  const vrsSig = new Uint8Array(65);
  vrsSig[0] = v;
  vrsSig.set(rawSig.slice(0, 64), 1); // R + S after the recovery byte

  // ── Reproduce the EIP-712 digest for public key recovery ────────────────
  // Must exactly mirror verify-evm in bme050-0-vault.clar.
  //
  // BMP1Withdraw(address controller,uint256 amount,uint256 nonce,bytes32 bmp1Hash)
  //
  //   struct-encoded (160 bytes) =
  //     WITHDRAW_TYPEHASH (32)   keccak256(type string)
  //     || controllerBytes (32)  BMP1 controller-address field — EIP-712 address encoding
  //     || amountSlot (32)       BMP1 slot3 — already uint256 big-endian
  //     || nonce32 (32)          16 zero bytes || BMP1 nonce (16 bytes)
  //     || bmp1Hash (32)         keccak256(BMP1 message)
  //
  //   struct-hash = keccak256(struct-encoded)
  //   digest      = keccak256(0x1901 || DOMAIN_SEPARATOR || struct-hash)

  const WITHDRAW_TYPEHASH = hexToBytes(
    "f1ebe45c9252e59f16c9eaed223a770a5d40b6b8bc14507a83cc68a149d644ba",
  );
  const DOMAIN_SEPARATOR = hexToBytes(
    "4e3c7155c429f36e33b8498ec258c659f393ec00d8434884b72472304c45681d",
  );
  const EIP712_PREFIX = new Uint8Array([0x19, 0x01]);

  // nonce32: 16 zero bytes + BMP1 nonce (16 bytes) = uint256 big-endian
  const nonce32 = new Uint8Array(32);
  nonce32.set(nonceBuff16, 16);

  const structEncoded = new Uint8Array(160);
  structEncoded.set(WITHDRAW_TYPEHASH, 0);
  structEncoded.set(controllerBytes, 32);
  structEncoded.set(amountSlot, 64);
  structEncoded.set(nonce32, 96);
  structEncoded.set(bmp1Hash, 128);

  const structHash = keccak_256(structEncoded);
  const digest = keccak_256(
    new Uint8Array([...EIP712_PREFIX, ...DOMAIN_SEPARATOR, ...structHash]),
  );

  const { recoverPublicKey, Point } = await import("@noble/secp256k1");

  // noble/secp256k1 v3 'recovered' format is V(1) || R(32) || S(32) — vrsSig is already in this order
  const compressedKey = recoverPublicKey(vrsSig, digest, {
    prehash: false,
  }); // 33 bytes (compressed)
  const uncompressedKey = Point.fromBytes(compressedKey).toBytes(false); // 65 bytes (04||X||Y)
  const pubkey64 = uncompressedKey.slice(1); // 64 bytes X||Y

  // vrsSig (V || R || S) is what Clarity's secp256k1-recover? expects on-chain
  return { message: bmp1, signature: vrsSig, pubkey64 };
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
    // For EVM withdrawals the vault's mapped-address and recipient are both
    // the user's mapped Stacks address (the server holds its private key)
    stxAddress: params.mappedAddress,
    recipientAddress: params.mappedAddress,
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
