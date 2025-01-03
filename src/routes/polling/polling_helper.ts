import type { SignatureData } from "@stacks/connect";
import {
  createSha2Hash,
  hashSha256Sync,
  verifyMessageSignatureRsv,
} from "@stacks/encryption";
import { OpinionPoll } from "./polling_types";
import {
  publicKeyToAddress,
  stringAsciiCV,
  tupleCV,
  uintCV,
} from "@stacks/transactions";
import { ChainId, StacksNetwork } from "@stacks/network";
import { ObjectId } from "mongodb";
import { opinionPollCollection } from "../../lib/data/db_models";
import { bytesToHex, hexToBytes } from "@stacks/common";
import { getConfig } from "../../lib/config";

type BaseAdminMessage = {
  message: string;
  timestamp: number;
  admin: string;
};
type Auth = {
  message: BaseAdminMessage;
  signature: SignatureData;
};
function domainCV(domain: any) {
  return tupleCV({
    name: stringAsciiCV(domain.name),
    version: stringAsciiCV(domain.version),
    "chain-id": uintCV(domain["chain-id"]),
  });
}
function messageCV(message: BaseAdminMessage) {
  return tupleCV({
    message: stringAsciiCV(message.message),
    timestamp: uintCV(message.timestamp),
    admin: stringAsciiCV(message.admin),
  });
}

export function isPostValid(
  signature: SignatureData,
  message: OpinionPoll
): boolean {
  if (message.admin !== getC32AddressFromPublicKey(signature.publicKey))
    return false;
  return isValidSignature(signature, message);
}

export function isPutValid(
  signature: SignatureData,
  message: OpinionPoll
): boolean {
  if (message.admin !== getC32AddressFromPublicKey(signature.publicKey))
    return false;
  return isValidSignature(signature, message);
}

export function isValidSignature(
  signature: SignatureData,
  message: OpinionPoll
): boolean {
  return verifyMessageSignatureRsv({
    signature: signature.signature,
    message: JSON.stringify(message),
    publicKey: signature.publicKey,
  });
}

function getC32AddressFromPublicKey(
  publicKeyHex: string,
  isMainnet = true
): string {
  // Select the network version
  const version = isMainnet ? "mainnet" : "testnet";

  // Convert the public key to a Stacks address
  const stacksAddress = publicKeyToAddress(publicKeyHex, version);
  //   version, // Network version
  //   pubKeyfromBytes(Buffer.from(publicKeyHex, 'hex')) // Convert public key from hex to Buffer
  // );

  return stacksAddress;
}

export async function savePoll(poll: OpinionPoll) {
  poll._id = poll._id || new ObjectId();
  const result = await opinionPollCollection.insertOne(poll);
  return await findPollById(poll._id.toString());
}

export async function updatePoll(poll: OpinionPoll, changes: any) {
  const result = await opinionPollCollection.updateOne(
    {
      _id: poll._id,
    },
    { $set: changes }
  );
  poll = await findPollById(poll._id.toString());
  return poll;
}

export async function findPollById(_id: string): Promise<OpinionPoll> {
  const result = await opinionPollCollection.findOne({
    _id: new ObjectId(_id),
  });
  return result as unknown as OpinionPoll;
}

export async function findPolls(): Promise<Array<OpinionPoll>> {
  const result = await opinionPollCollection.find().toArray();
  return result as unknown as Array<OpinionPoll>;
}

export async function findPollsEndingBefore(
  stopBitcoinHeight: number
): Promise<Array<OpinionPoll>> {
  const result = await opinionPollCollection
    .find({ stopBitcoinHeight: { $lt: stopBitcoinHeight } })
    .toArray();
  return result as unknown as Array<OpinionPoll>;
}

export async function sha256(publicKeyHex: string) {
  return hashSha256Sync(hexToBytes(publicKeyHex));
}
