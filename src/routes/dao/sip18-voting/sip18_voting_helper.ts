import type { SignatureData } from "@stacks/connect";
import { hashSha256Sync } from "@stacks/encryption";
import {
  boolCV,
  broadcastTransaction,
  bufferCV,
  listCV,
  makeContractCall,
  standardPrincipalCV,
  tupleCV,
  uintCV,
} from "@stacks/transactions";
import { ObjectId } from "mongodb";
import { hexToBytes } from "@stacks/common";
import { daoSip18VotingCollection } from "../../../lib/data/db_models";
import { getConfig } from "../../../lib/config";
import { getC32AddressFromPublicKey } from "../events/dao_events_helper";
import {
  getStacksNetwork,
  StoredVoteMessage,
  verifySip18VoteSignature,
  votesToClarityValue,
} from "@mijoco/stx_helpers/dist/index";

async function markVotesAsProcessed(voteIds: string[]) {
  // Update votes to set `processed: true`
  await daoSip18VotingCollection.updateMany(
    { _id: { $in: voteIds.map((id) => new ObjectId(id)) } },
    { $set: { processed: true } }
  );
}

async function sendBatchVote(proposal: string, votes: StoredVoteMessage[]) {
  const { proposalCV, votesCV } = votesToClarityValue(proposal, votes);
  const network = getConfig().network;
  const txOptions = {
    contractAddress: "SP1234567890ABCDEF", // Replace with your contract address
    contractName: "your-contract-name", // Replace with your contract name
    functionName: "batch-vote",
    functionArgs: [proposalCV, votesCV],
    senderKey: "privateKey",
    network: getStacksNetwork(network),
    postConditionMode: 1,
  };

  const transaction = await makeContractCall(txOptions);
  const txId = await broadcastTransaction({
    transaction,
    network: getStacksNetwork(network),
  });
  console.log("Transaction ID:", txId);

  return txId;
}

export function isPostValid(
  signature: SignatureData,
  message: StoredVoteMessage
): boolean {
  const stxAddressFromKey = getC32AddressFromPublicKey(
    signature.publicKey,
    getConfig().network
  );
  if (message.voter !== stxAddressFromKey) {
    console.log(
      "/votes: wrong voter: " + message.voter + " signer: " + stxAddressFromKey
    );
    return false;
  }
  console.log(
    "/votes: correct voter: " + message.voter + " signer: " + stxAddressFromKey
  );

  const address = verifySip18VoteSignature(
    getConfig().network,
    getConfig().publicAppName,
    getConfig().publicAppVersion,
    message,
    signature.publicKey,
    signature.signature
  );
  return address != undefined;
}

export async function fetchSip18Votes(
  fitler: any
): Promise<Array<StoredVoteMessage>> {
  const results = await daoSip18VotingCollection.find(fitler).toArray();
  return results as unknown as Array<StoredVoteMessage>;
}

export async function saveSip18Vote(
  hash: string,
  voteMessage: StoredVoteMessage,
  signature: SignatureData
) {
  voteMessage._id = voteMessage._id || new ObjectId();
  voteMessage.voteObjectHash = hash;
  voteMessage.signature = signature.signature;
  voteMessage.publicKey = signature.publicKey;
  const result = await daoSip18VotingCollection.insertOne(voteMessage);
  return await findSip18VoteById(voteMessage._id.toString());
}

export async function updateSip18Vote(poll: StoredVoteMessage, changes: any) {
  const result = await daoSip18VotingCollection.updateOne(
    {
      _id: poll._id,
    },
    { $set: changes }
  );
  poll = await findSip18VoteById(poll._id.toString());
  return poll;
}

export async function findSip18VoteById(
  _id: string
): Promise<StoredVoteMessage> {
  const result = await daoSip18VotingCollection.findOne({
    _id: new ObjectId(_id),
  });
  return result as unknown as StoredVoteMessage;
}

export async function findSip18Votes(): Promise<Array<StoredVoteMessage>> {
  const result = await daoSip18VotingCollection.find().toArray();
  return result as unknown as Array<StoredVoteMessage>;
}

export async function findSip18VotesEndingBefore(
  endBurnHeight: number
): Promise<Array<StoredVoteMessage>> {
  const result = await daoSip18VotingCollection
    .find({ endBurnHeight: { $lt: endBurnHeight } })
    .toArray();
  return result as unknown as Array<StoredVoteMessage>;
}
