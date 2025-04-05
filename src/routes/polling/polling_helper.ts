import type { SignatureData } from '@stacks/connect';
import { ObjectId } from 'mongodb';
import { daoEventCollection, marketCollection } from '../../lib/data/db_models.js';
import { getConfig } from '../../lib/config.js';
import { getC32AddressFromPublicKey } from '../dao/events/dao_events_helper.js';
import { StoredOpinionPoll, PollVoteMessage, verifyDaoSignature, pollVoteMessageToTupleCV, marketDataToTupleCV, MarketVotingCreateEvent } from '@mijoco/stx_helpers/dist/index.js';

type BaseAdminMessage = {
	message: string;
	timestamp: number;
	admin: string;
};
type Auth = {
	message: BaseAdminMessage;
	signature: SignatureData;
};

export function isCreatePollPostValid(message: StoredOpinionPoll): boolean {
	// console.log("-------------------------------------------");
	// console.log("isCreatePollPostValid: ", message);
	// console.log("isCreatePollPostValid: network: " + getConfig().network);
	// console.log(
	//   "isCreatePollPostValid: publicAppName: " + getConfig().publicAppName
	// );
	// console.log(
	//   "isCreatePollPostValid: publicAppVersion: " + getConfig().publicAppVersion
	// );
	const stxAddressFromKey = getC32AddressFromPublicKey(message.publicKey, getConfig().network);
	// console.log("isCreatePollPostValid: stxAddressFromKey: " + stxAddressFromKey);
	if (message.proposer !== stxAddressFromKey) {
		console.log('/polls: wrong voter: ' + message.proposer + ' signer: ' + stxAddressFromKey);
		return false;
	}
	// console.log(
	//   "/votes: correct voter: " +
	//     message.proposer +
	//     " signer: " +
	//     stxAddressFromKey
	// );
	const pollMessage = marketDataToTupleCV(message.name, message.category, message.createdAt, message.proposer, message.token);

	let res = verifyDaoSignature(getConfig().network, getConfig().publicAppName, getConfig().publicAppVersion, pollMessage, message.publicKey, message.signature);
	return typeof res === 'string';
}
export function isPostPollMessageValid(signature: SignatureData, message: PollVoteMessage): boolean {
	const stxAddressFromKey = getC32AddressFromPublicKey(signature.publicKey, getConfig().network);
	if (message.voter !== stxAddressFromKey) {
		console.log('/events: wrong voter: ' + message.voter + ' signer: ' + stxAddressFromKey);
		return false;
	}
	const stacksAddress = verifyDaoSignature(getConfig().network, getConfig().publicAppName, getConfig().publicAppVersion, pollVoteMessageToTupleCV(message), signature.publicKey, signature.signature);
	//console.log('/votes: correct voter: ' + stacksAddress);
	if (!stacksAddress) return false;
	return true;
}

export async function savePoll(poll: StoredOpinionPoll) {
	const doc = {
		...poll,
		_id: new ObjectId() // ← convert string to ObjectId
	};
	const result = await marketCollection.insertOne(doc);
	return result;
}

export async function findPollByHash(objectHash: string): Promise<MarketVotingCreateEvent> {
	const result = await daoEventCollection.findOne({
		event: 'create-market-vote',
		objectHash: objectHash
	});
	return result as unknown as MarketVotingCreateEvent;
}

export async function findPollByMarketId(pollId: number): Promise<MarketVotingCreateEvent> {
	const result = await daoEventCollection.findOne({
		event: 'create-market-vote',
		pollId: pollId
	});
	return result as unknown as MarketVotingCreateEvent;
}

export async function findUserEnteredPollByHash(objectHash: string): Promise<StoredOpinionPoll> {
	const result = await marketCollection.findOne({
		objectHash: objectHash
	});
	return result as unknown as StoredOpinionPoll;
}

export async function findPolls(): Promise<Array<MarketVotingCreateEvent>> {
	const events = await daoEventCollection.find({ event: 'create-market-vote' }).toArray();
	return events as unknown as Array<MarketVotingCreateEvent>;
}

export async function findPollsEndingBefore(endBurnHeight: number): Promise<Array<MarketVotingCreateEvent>> {
	const result = await daoEventCollection.find({ endBurnHeight: { $lt: endBurnHeight } }).toArray();
	return result as unknown as Array<MarketVotingCreateEvent>;
}
