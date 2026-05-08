// /**
//  * relayer.ts
//  * Trust-minimised relayer for the Stacks vault.
//  *
//  * Custody windows:
//  *   DEPOSIT:    Allbridge arrival → vault.deposit() — one Stacks tx (~seconds)
//  *   WITHDRAWAL: vault.withdraw-with-sig() → Allbridge bridge back — bridge transit (~minutes)
//  *
//  * The relayer cannot move vault funds without a valid ed25519 sig from the user's Solana key.
//  * The withdrawal destination is committed in the user's sig and emitted on-chain — auditable.
//  */

// import {
//   makeContractCall,
//   broadcastTransaction,
//   AnchorMode,
//   bufferCV,
//   uintCV,
//   principalCV,
//   PostConditionMode,
//   createSTXPostCondition,
//   FungibleConditionCode,
//   makeStandardFungiblePostCondition,
// } from "@stacks/transactions";
// import { StacksMainnet } from "@stacks/network";
// import { randomBytes } from "crypto";
// import { bs58 } from "bs58";
// import nacl from "tweetnacl";

// const network = new StacksMainnet();

// const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY!;
// const VAULT_CONTRACT_ADDRESS = process.env.VAULT_CONTRACT_ADDRESS!; // e.g. "ST1ABC...vault"
// const VAULT_CONTRACT_NAME = "vault";
// const TOKEN_CONTRACT = process.env.TOKEN_CONTRACT!;

// // ---------------------------------------------------------------------------
// // TYPES
// // ---------------------------------------------------------------------------

// interface PendingDeposit {
//   depositId: string;           // hex-encoded 16-byte uuid
//   solanaPubkey: string;        // base58 Solana pubkey
//   expectedAmount: bigint;      // in token micro-units
//   expiryBlocks: number;        // how many blocks before this expires
//   createdAt: Date;
// }

// interface WithdrawalRequest {
//   solanaPubkey: string;        // base58 Solana pubkey
//   amount: bigint;
//   nonce: bigint;
//   destinationSolanaAddr: string; // base58 — committed in user's sig
//   sig: string;                 // base64 or hex ed25519 sig from Phantom
// }

// // ---------------------------------------------------------------------------
// // STEP 1: PRE-FLIGHT — User registers intent to deposit
// //
// // Called by your API when a user wants to deposit.
// // Returns a deposit-id and the relayer's Stacks address to bridge to.
// // User takes this and initiates the Allbridge transfer.
// // ---------------------------------------------------------------------------

// export async function registerDepositIntent(
//   solanaPubkey: string,   // user's Solana pubkey (base58)
//   amount: bigint,         // exact amount they will bridge
// ): Promise<{ depositId: string; bridgeToAddress: string; expiryBlocks: number }> {

//   const depositIdBytes = randomBytes(16);
//   const depositId = depositIdBytes.toString("hex");
//   const expiryBlocks = 144; // ~24 hours on Stacks

//   // Record pending deposit on-chain so the arrival can be verified
//   const tx = await makeContractCall({
//     contractAddress: VAULT_CONTRACT_ADDRESS,
//     contractName: VAULT_CONTRACT_NAME,
//     functionName: "register-pending-deposit",
//     functionArgs: [
//       bufferCV(depositIdBytes),                           // deposit-id
//       bufferCV(bs58.decode(solanaPubkey)),                // solana-pubkey
//       uintCV(amount),                                     // amount
//       uintCV(expiryBlocks),                              // expiry-blocks
//     ],
//     senderKey: RELAYER_PRIVATE_KEY,
//     network,
//     anchorMode: AnchorMode.Any,
//     postConditionMode: PostConditionMode.Deny,
//     postConditions: [],  // no token movement at this step
//   });

//   await broadcastTransaction(tx, network);

//   // Return deposit instructions to user
//   return {
//     depositId,
//     bridgeToAddress: getRelayerStacksAddress(), // relayer's Stacks address for Allbridge
//     expiryBlocks,
//   };
// }

// // ---------------------------------------------------------------------------
// // STEP 2: DEPOSIT CONFIRMATION — Allbridge has delivered to relayer's Stacks address
// //
// // Watch for the Allbridge unlock tx on Stacks (via Chainhook or polling).
// // Once confirmed, immediately call vault.deposit() to move funds into vault.
// // Custody window closes as soon as this tx is confirmed.
// // ---------------------------------------------------------------------------

// export async function confirmDeposit(
//   depositId: string,   // hex deposit-id from step 1
//   amount: bigint,      // actual amount received (must match expected)
// ): Promise<string> {   // returns tx id

//   const depositIdBytes = Buffer.from(depositId, "hex");

//   // Post condition: relayer must send exactly `amount` tokens to vault
//   // This makes it impossible for the relayer tx to drain more than expected
//   const postCondition = makeStandardFungiblePostCondition(
//     getRelayerStacksAddress(),
//     FungibleConditionCode.Equal,
//     amount,
//     TOKEN_CONTRACT,
//   );

//   const tx = await makeContractCall({
//     contractAddress: VAULT_CONTRACT_ADDRESS,
//     contractName: VAULT_CONTRACT_NAME,
//     functionName: "deposit",
//     functionArgs: [
//       bufferCV(depositIdBytes),
//       uintCV(amount),
//     ],
//     senderKey: RELAYER_PRIVATE_KEY,
//     network,
//     anchorMode: AnchorMode.Any,
//     postConditionMode: PostConditionMode.Deny,
//     postConditions: [postCondition],  // strictly enforced — relayer cannot over-send
//   });

//   const result = await broadcastTransaction(tx, network);
//   return result.txid;
// }

// // ---------------------------------------------------------------------------
// // STEP 3: WITHDRAWAL — User wants funds back on Solana
// //
// // User signs a message with Phantom off-chain.
// // Relayer submits the sig to the vault — vault verifies on-chain.
// // Relayer receives funds and MUST bridge to the address in the sig.
// // ---------------------------------------------------------------------------

// export async function processWithdrawal(req: WithdrawalRequest): Promise<string> {

//   const solanaPubkeyBytes = Buffer.from(bs58.decode(req.solanaPubkey));
//   const destinationBytes = Buffer.from(bs58.decode(req.destinationSolanaAddr));
//   const sigBytes = Buffer.from(req.sig, "hex");

//   // Sanity check the sig locally before submitting to chain
//   // (saves gas if sig is invalid)
//   const msgBytes = buildWithdrawMessage(req.nonce, req.amount, destinationBytes);
//   const valid = nacl.sign.detached.verify(msgBytes, sigBytes, solanaPubkeyBytes);
//   if (!valid) {
//     throw new Error("Invalid Phantom signature — withdrawal rejected before submission");
//   }

//   // Post condition: vault contract sends exactly `amount` to relayer
//   const postCondition = makeStandardFungiblePostCondition(
//     `${VAULT_CONTRACT_ADDRESS}.${VAULT_CONTRACT_NAME}`,
//     FungibleConditionCode.Equal,
//     req.amount,
//     TOKEN_CONTRACT,
//   );

//   const tx = await makeContractCall({
//     contractAddress: VAULT_CONTRACT_ADDRESS,
//     contractName: VAULT_CONTRACT_NAME,
//     functionName: "withdraw-with-sig",
//     functionArgs: [
//       bufferCV(solanaPubkeyBytes),
//       uintCV(req.amount),
//       uintCV(req.nonce),
//       bufferCV(destinationBytes),
//       bufferCV(sigBytes),
//     ],
//     senderKey: RELAYER_PRIVATE_KEY,
//     network,
//     anchorMode: AnchorMode.Any,
//     postConditionMode: PostConditionMode.Deny,
//     postConditions: [postCondition],
//   });

//   const result = await broadcastTransaction(tx, network);

//   // Once tx is confirmed, initiate Allbridge bridge back to Solana
//   // The destination is fixed by the user's sig — we cannot change it
//   await scheduleBridge({
//     fromStacksAddress: getRelayerStacksAddress(),
//     toSolanaAddress: req.destinationSolanaAddr,
//     amount: req.amount,
//     stacksTxId: result.txid,
//   });

//   return result.txid;
// }

// // ---------------------------------------------------------------------------
// // MESSAGE CONSTRUCTION
// // Must exactly match make-withdraw-msg in vault.clar
// //
// // Format: "stacks-vault-withdraw:" + nonce(8 bytes BE) + amount(8 bytes BE) + destination(32 bytes)
// // ---------------------------------------------------------------------------

// export function buildWithdrawMessage(
//   nonce: bigint,
//   amount: bigint,
//   destinationBytes: Buffer,   // 32-byte Solana pubkey
// ): Uint8Array {
//   const prefix = Buffer.from("stacks-vault-withdraw:", "utf8");
//   const nonceBuf = toUint64BE(nonce);
//   const amountBuf = toUint64BE(amount);

//   return Buffer.concat([prefix, nonceBuf, amountBuf, destinationBytes]);
// }

// export function buildRegisterMessage(stacksAddress: string): Uint8Array {
//   const prefix = Buffer.from("stacks-vault-register:", "utf8");
//   // Stacks address as bytes — must match principal-destruct? output in Clarity
//   const addrBytes = stacksAddressToBytes(stacksAddress);
//   return Buffer.concat([prefix, addrBytes]);
// }

// // ---------------------------------------------------------------------------
// // WHAT THE FRONTEND (PHANTOM) MUST SIGN
// //
// // Call this to get the message bytes to pass to Phantom's signMessage()
// // ---------------------------------------------------------------------------

// export function getWithdrawMessageForPhantom(
//   nonce: bigint,
//   amount: bigint,
//   destinationSolanaAddr: string,   // base58
// ): { message: Uint8Array; displayText: string } {
//   const destinationBytes = Buffer.from(bs58.decode(destinationSolanaAddr));
//   const message = buildWithdrawMessage(nonce, amount, destinationBytes);

//   // Human-readable display for Phantom's signing dialog
//   const displayText =
//     `Withdraw ${amount} tokens from Stacks vault\n` +
//     `To Solana address: ${destinationSolanaAddr}\n` +
//     `Nonce: ${nonce}`;

//   return { message, displayText };
// }

// // ---------------------------------------------------------------------------
// // UTILITIES
// // ---------------------------------------------------------------------------

// function toUint64BE(n: bigint): Buffer {
//   const buf = Buffer.alloc(8);
//   buf.writeBigUInt64BE(n);
//   return buf;
// }

// function getRelayerStacksAddress(): string {
//   // Derive from RELAYER_PRIVATE_KEY — implementation depends on your Stacks SDK setup
//   return process.env.RELAYER_STACKS_ADDRESS!;
// }

// function stacksAddressToBytes(address: string): Buffer {
//   // c32decode the Stacks address to get the raw 20-byte hash160
//   // Use @stacks/transactions c32 utilities
//   const { c32addressDecode } = require("c32check");
//   const [, bytes] = c32addressDecode(address);
//   return Buffer.from(bytes);
// }

// async function scheduleBridge(params: {
//   fromStacksAddress: string;
//   toSolanaAddress: string;
//   amount: bigint;
//   stacksTxId: string;
// }): Promise<void> {
//   // Initiate Allbridge transfer from relayer's Stacks address to user's Solana address.
//   // Implementation depends on Allbridge SDK / Classic API.
//   // The destination (toSolanaAddress) is locked in by the user's sig —
//   // relayer has no discretion here.
//   console.log("Bridge initiated:", params);
//   // TODO: Allbridge SDK call
// }
