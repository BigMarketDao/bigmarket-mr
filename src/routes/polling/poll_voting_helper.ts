import type { SignatureData } from "@stacks/connect";
import { ObjectId } from "mongodb";
import { opinionPollSip18VotingCollection } from "../../lib/data/db_models";
import { StoredOpinionPoll, StoredPollVoteMessage } from "@mijoco/stx_helpers";

export async function findPollVoteByHash(
  pollVoteObjectHash: string
): Promise<StoredOpinionPoll> {
  const result = await opinionPollSip18VotingCollection.findOne({
    pollVoteObjectHash: pollVoteObjectHash,
  });
  return result as unknown as StoredOpinionPoll;
}

export async function findUnprocessedSip18PollMessages(
  pollId: string
): Promise<Array<StoredPollVoteMessage>> {
  const result = await opinionPollSip18VotingCollection
    .find({ "poll-id": pollId })
    .toArray();
  return result as unknown as Array<StoredPollVoteMessage>;
}

export async function saveSip18PollVote(
  pollVoteObjectHash: string,
  voteMessage: StoredPollVoteMessage,
  signature: SignatureData
) {
  voteMessage._id = voteMessage._id || new ObjectId();
  voteMessage.pollVoteObjectHash = pollVoteObjectHash;
  voteMessage.signature = signature.signature;
  voteMessage.publicKey = signature.publicKey;
  const result = await opinionPollSip18VotingCollection.insertOne(voteMessage);
  return await findPollVoteByHash(voteMessage["poll-id"]);
}
