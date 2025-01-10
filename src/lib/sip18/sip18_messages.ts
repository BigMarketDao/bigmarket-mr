// import { sha256 } from "@noble/hashes/sha256";
// import { verifySignature } from "@stacks/encryption";
// import {
//   encodeStructuredDataBytes,
//   publicKeyFromSignatureRsv,
//   publicKeyToAddressSingleSig,
//   stringAsciiCV,
//   tupleCV,
//   uintCV,
//   type StringAsciiCV,
//   type TupleCV,
//   type TupleData,
//   type UIntCV,
// } from "@stacks/transactions";
// import { bytesToHex, hexToBytes } from "@stacks/common";
// import { ChainId } from "@stacks/network";
// import { ObjectId } from "mongodb";
// import { SignatureData } from "@stacks/connect";

// export interface StoredVoteMessage extends VoteMessage {
//   _id: ObjectId;
//   voteObjectHash: string;
//   processed: boolean;
//   signature: SignatureData;
// }
// export interface VoteMessage {
//   attestation: string;
//   proposal: string;
//   title: string;
//   timestamp: number;
//   voting_power: number;
//   voter: string;
//   vote: boolean;
// }

// export const ADMIN_MESSAGE =
//   "please sign this message to authorise DAO management task.";
// export type BaseAdminMessage = {
//   message: string;
//   timestamp: number;
//   admin: string;
// };
// export type Auth = {
//   message: BaseAdminMessage;
//   signature: SignatureData;
// };
// export const enum ChainID {
//   Testnet = 2147483648,
//   Mainnet = 1,
// }
// // see https://github.com/hirosystems/stacks.js/blob/fd0bf26b5f29fc3c1bf79581d0ad9b89f0d7f15a/packages/transactions/src/structuredDataSignature.ts#L55
// export const STRUCTURED_DATA_PREFIX = new Uint8Array([
//   0x53, 0x49, 0x50, 0x30, 0x31, 0x38,
// ]);

// export function voteMessageToTupleCV(message: VoteMessage) {
//   return tupleCV({
//     attestation: stringAsciiCV(message.attestation),
//     proposal: stringAsciiCV(message.proposal),
//     title: stringAsciiCV(message.title),
//     timestamp: uintCV(message.timestamp),
//     voting_power: uintCV(message.voting_power),
//   });
// }

// export function adminMessageToTupleCV(message: BaseAdminMessage) {
//   return tupleCV({
//     message: stringAsciiCV(message.message),
//     timestamp: uintCV(message.timestamp),
//     admin: stringAsciiCV(message.admin),
//   });
// }

// export function verifyBaseAdminSignature(
//   network: string,
//   appName: string,
//   appVersion: string,
//   adminMessage: BaseAdminMessage,
//   publicKey: string,
//   signature: string
// ) {
//   const message = adminMessageToTupleCV(adminMessage);
//   return verifyDaoSignature(
//     network,
//     appName,
//     appVersion,
//     message,
//     publicKey,
//     signature
//   );
// }

// export function verifySip18VoteSignature(
//   network: string,
//   appName: string,
//   appVersion: string,
//   voteMessage: VoteMessage,
//   publicKey: string,
//   signature: string
// ) {
//   const message = voteMessageToTupleCV(voteMessage);
//   return verifyDaoSignature(
//     network,
//     appName,
//     appVersion,
//     message,
//     publicKey,
//     signature
//   );
// }

// export function verifyDaoSignature(
//   network: string,
//   appName: string,
//   appVersion: string,
//   message: TupleCV<TupleData<StringAsciiCV | UIntCV>>,
//   publicKey: string,
//   signature: string
// ): string | undefined {
//   const chainId = network === "mainnet" ? ChainId.Mainnet : ChainId.Testnet;
//   const domain = tupleCV({
//     name: stringAsciiCV(appName),
//     version: stringAsciiCV(appVersion),
//     "chain-id": uintCV(chainId),
//   });
//   const structuredDataHash = bytesToHex(
//     sha256(encodeStructuredDataBytes({ message, domain }))
//   );

//   console.log("structuredDataHash: " + structuredDataHash);
//   console.log("appName: " + appName);
//   console.log("appVersion: " + appVersion);
//   console.log("chainId: " + chainId);

//   const signatureBytes = hexToBytes(signature);
//   const strippedSignature = signatureBytes.slice(0, -1);
//   //console.log("Stripped Signature (Hex):", bytesToHex(strippedSignature));

//   let pubkey: string = "-";
//   let stacksAddress: string = "-";
//   try {
//     console.log("signature: " + signature);
//     console.log("structuredDataHash: " + structuredDataHash);
//     pubkey = publicKeyFromSignatureRsv(structuredDataHash, signature);
//     console.log("pubkey: " + pubkey);
//     console.log("network: " + network);
//     if (
//       network === "mainnet" ||
//       network === "testnet" ||
//       network === "devnet"
//     ) {
//       stacksAddress = publicKeyToAddressSingleSig(pubkey, network);
//       console.log("stacksAddress: " + stacksAddress);
//     }

//     console.log("sa: " + pubkey);
//   } catch (err: any) {}
//   console.log("pubkey: " + pubkey);
//   let result = false;
//   try {
//     console.log("strippedSignature: " + bytesToHex(strippedSignature));
//     console.log("structuredDataHash: " + structuredDataHash);
//     console.log("publicKey: " + publicKey);
//     result = verifySignature(strippedSignature, structuredDataHash, publicKey);
//     console.log("verifySignatureRsv: result: " + result);
//   } catch (err: any) {}
//   return result ? stacksAddress : undefined;
// }
