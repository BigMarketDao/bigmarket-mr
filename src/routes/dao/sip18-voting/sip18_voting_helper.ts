import type { SignatureData } from '@stacks/connect';
import { ObjectId } from 'mongodb';
import { daoBatchVotingCollection } from '../../../lib/data/db_models.js';
import { getConfig } from '../../../lib/config.js';
import { getC32AddressFromPublicKey } from '../events/dao_events_helper.js';
import { StoredVoteMessage, verifySip18VoteSignature } from '@mijoco/stx_helpers/dist/index.js';

async function markVotesAsProcessed(voteIds: string[]) {
	// Update votes to set `processed: true`
	await daoBatchVotingCollection.updateMany({ _id: { $in: voteIds.map((id) => new ObjectId(id)) } }, { $set: { processed: true } });
}

export function isPostValid(signature: SignatureData, message: StoredVoteMessage): boolean {
	const stxAddressFromKey = getC32AddressFromPublicKey(signature.publicKey, getConfig().network);
	if (message.voter !== stxAddressFromKey) {
		console.log('/votes: wrong voter: ' + message.voter + ' signer: ' + stxAddressFromKey);
		return false;
	}
	console.log('/votes: correct voter: ' + message.voter + ' signer: ' + stxAddressFromKey);

	const address = verifySip18VoteSignature(getConfig().network, getConfig().publicAppName, getConfig().publicAppVersion, message, signature.publicKey, signature.signature);
	return address != undefined;
}

export async function fetchSip18Votes(fitler: any): Promise<Array<StoredVoteMessage>> {
	const results = await daoBatchVotingCollection.find(fitler).toArray();
	return results as unknown as Array<StoredVoteMessage>;
}

export async function saveSip18Vote(hash: string, voteMessage: StoredVoteMessage, signature: SignatureData) {
	voteMessage._id = voteMessage._id || new ObjectId();
	voteMessage.voteObjectHash = hash;
	voteMessage.signature = signature.signature;
	voteMessage.publicKey = signature.publicKey;
	const result = await daoBatchVotingCollection.insertOne(voteMessage);
	return await findSip18VoteById(voteMessage._id.toString());
}

export async function updateSip18Vote(poll: StoredVoteMessage, changes: any) {
	const result = await daoBatchVotingCollection.updateOne(
		{
			_id: poll._id
		},
		{ $set: changes }
	);
	poll = await findSip18VoteById(poll._id.toString());
	return poll;
}

export async function findSip18VoteById(_id: string): Promise<StoredVoteMessage> {
	const result = await daoBatchVotingCollection.findOne({
		_id: new ObjectId(_id)
	});
	return result as unknown as StoredVoteMessage;
}

export async function findSip18Votes(): Promise<Array<StoredVoteMessage>> {
	const result = await daoBatchVotingCollection.find().toArray();
	return result as unknown as Array<StoredVoteMessage>;
}

export async function findSip18VotesEndingBefore(endBurnHeight: number): Promise<Array<StoredVoteMessage>> {
	const result = await daoBatchVotingCollection.find({ endBurnHeight: { $lt: endBurnHeight } }).toArray();
	return result as unknown as Array<StoredVoteMessage>;
}
