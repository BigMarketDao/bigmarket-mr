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
import { getC32AddressFromPublicKey } from "../dao/events/dao_events_helper";

type BaseAdminMessage = {
  message: string;
  timestamp: number;
  admin: string;
};
type Auth = {
  message: BaseAdminMessage;
  signature: SignatureData;
};

export function isPostValid(
  signature: SignatureData,
  message: OpinionPoll
): boolean {
  const stxAddressFromKey = getC32AddressFromPublicKey(
    signature.publicKey,
    getConfig().network
  );
  if (message.admin !== stxAddressFromKey) {
    console.log(
      "/votes: wrong voter: " + message.admin + " signer: " + stxAddressFromKey
    );
    return false;
  }
  console.log(
    "/votes: correct voter: " + message.admin + " signer: " + stxAddressFromKey
  );
  return false;
  // return verifyOpinionPollSignature(
  //   message,
  //   signature.publicKey,
  //   signature.signature
  // );
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
