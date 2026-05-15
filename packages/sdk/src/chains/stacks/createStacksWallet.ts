// sdk/src/stacks/createStacksWallet.ts

import { CreatedStacksWallet } from "@bigmarket/bm-types";
import crypto from "crypto";
import { getAddressFromPrivateKey } from "@stacks/transactions";
import * as secp from "@noble/secp256k1"; // already a transitive dep of stacks.js

const ALGORITHM = "aes-256-gcm";

export function createStacksWallet(
  secretSource: string,
  sourceChain: string,
  sourceAddress: string,
  network: "mainnet" | "testnet" | "devnet" = "devnet",
): CreatedStacksWallet {
  const privateKey = deriveStacksPrivateKey(secretSource, sourceAddress);
  //const privateKey = makeRandomPrivKey();
  const mappedAddress = getAddressFromPrivateKey(privateKey, network);

  return {
    sourceChain,
    sourceAddress,
    mappedChain: "stacks",
    mappedAddress,
    network,
    createdAt: new Date(),
  };
}

function encryptPrivateKey(secretSource: string): string {
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const MASTER_KEY = Buffer.from(secretSource, "hex"); // 32 bytes / 64 hex chars
  const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(secretSource, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); // 16 bytes, prevents tampering
  // Store as: iv:authTag:ciphertext (all hex)
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptPrivateKey(
  secretSource: string,
  stored: string,
): string {
  const [ivHex, authTagHex, encryptedHex] = stored.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const MASTER_KEY = Buffer.from(secretSource, "hex"); // 32 bytes / 64 hex chars
  const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, iv);
  decipher.setAuthTag(authTag); // will throw if tampered

  return decipher.update(encrypted) + decipher.final("utf8");
}

export function deriveStacksPrivateKey(
  secretSource: string,
  ethAddress: string,
): string {
  const derive = (salt: string): Buffer => {
    const hmac = crypto.createHmac("sha256", secretSource);
    hmac.update(`stacks-vault-v1:${ethAddress.toLowerCase()}:${salt}`);
    return hmac.digest();
  };

  let keyBytes = derive("v1");

  if (!secp.utils.isValidSecretKey(keyBytes)) {
    keyBytes = derive("v2");
  }

  // Append "01" suffix = compressed public key convention
  return keyBytes.toString("hex") + "01";
}
