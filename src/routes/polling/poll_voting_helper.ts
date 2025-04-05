import type { SignatureData } from '@stacks/connect';
import { ObjectId } from 'mongodb';
import { marketBatchVotingCollection } from '../../lib/data/db_models.js';
import { MarketVotingVoteEvent, StoredPollVoteMessage } from '@mijoco/stx_helpers/dist/index.js';

export async function findPollVoteByHash(pollVoteObjectHash: string): Promise<MarketVotingVoteEvent> {
	const result = await marketBatchVotingCollection.findOne({
		pollVoteObjectHash: pollVoteObjectHash
	});
	return result as unknown as MarketVotingVoteEvent;
}

export async function findUnprocessedSip18PollMessages(pollId: string): Promise<Array<StoredPollVoteMessage>> {
	const result = await marketBatchVotingCollection.find({ 'poll-id': pollId }).toArray();
	return result as unknown as Array<StoredPollVoteMessage>;
}

export async function saveSip18PollVote(pollVoteObjectHash: string, voteMessage: StoredPollVoteMessage, signature: SignatureData) {
	voteMessage.pollVoteObjectHash = pollVoteObjectHash;
	voteMessage.signature = signature.signature;
	voteMessage.publicKey = signature.publicKey;
	const result = await saveDaoEvent(voteMessage);
	return await findPollVoteByHash(voteMessage['market-data-hash']);
}
async function saveDaoEvent(voteMessage: any) {
	const doc = {
		...voteMessage,
		_id: new ObjectId() // ← convert string to ObjectId
	};
	const result = await marketBatchVotingCollection.insertOne(doc);
	return result;
}
