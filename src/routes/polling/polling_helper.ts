import type { SignatureData } from '@stacks/connect';
import { ObjectId } from 'mongodb';
import { daoEventCollection, marketCollection } from '../../lib/data/db_models.js';
import { getConfig } from '../../lib/config.js';
import { getC32AddressFromPublicKey } from '../dao/events/dao_events_helper.js';
import { StoredOpinionPoll, PollVoteMessage, verifyDaoSignature, pollVoteMessageToTupleCV, marketDataToTupleCV, MarketVotingCreateEvent } from '@mijoco/stx_helpers/dist/index.js';
import type { BaseForumContent, LinkedAccount } from 'sip18-forum-types';
import { ClarityValue, stringAsciiCV, tupleCV, TupleCV, TupleData, uintCV } from '@stacks/transactions';

type BaseAdminMessage = {
	message: string;
	timestamp: number;
	admin: string;
};
type Auth = {
	message: BaseAdminMessage;
	signature: SignatureData;
};

export async function getBnsNameFromAddress(api: string, address: string): Promise<string | undefined> {
	const res = await fetch(`${api}/v1/addresses/stacks/${address}`);
	if (!res.ok) return undefined;
	const data = await res.json();
	return data.names?.[0] ?? undefined;
}

export async function isCreatePollPostValid(message: StoredOpinionPoll): Promise<boolean> {
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
	console.log('isCreatePollPostValid: stxAddressFromKey: ' + stxAddressFromKey);
	if (message.proposer !== stxAddressFromKey) {
		console.log('/polls: wrong voter: ' + message.proposer + ' signer: ' + stxAddressFromKey);
		return false;
	}
	const bnsName = (await getBnsNameFromAddress(getConfig().stacksApi, stxAddressFromKey)) || '';
	const message1: BaseForumContent = {
		title: message.name,
		content: message.description,
		linkedAccounts: [getDefaultStacksLinkedAccount(stxAddressFromKey, bnsName)],
		created: message.createdAt
	};
	console.log('isCreatePollPostValid: message1: ', message1);
	const pollMessage = forumMessageToTupleCV(message1);
	//const pollMessage = marketDataToTupleCV(message.name, message.category, message.createdAt, message.proposer, message.token);

	let res = verifyDaoSignature(getConfig().network, getConfig().publicAppName, getConfig().publicAppVersion, pollMessage, message.publicKey, message.signature);
	return typeof res === 'string';
}

function forumMessageToTupleCV(message: BaseForumContent): TupleCV<TupleData<ClarityValue>> {
	const la = getPreferredLinkedAccount(message.linkedAccounts);
	if (!la) throw new Error('Unable to convert this message');
	return tupleCV({
		identifier: stringAsciiCV(la.identifier),
		created: uintCV(message.created),
		title: stringAsciiCV(message.title),
		content: stringAsciiCV(message.content),
		name: stringAsciiCV(la.displayName || 'unknown')
	});
}
function getDefaultStacksLinkedAccount(stxAddress: string, bnsName: string): LinkedAccount {
	const linkedAccount: LinkedAccount = {
		source: 'stacks',
		identifier: stxAddress,
		verified: true,
		preferred: true,
		displayName: bnsName
	};
	return linkedAccount;
}
export function getPreferredLinkedAccount(linkedAccounts: Array<LinkedAccount>): LinkedAccount | undefined {
	return linkedAccounts.find((o) => o.preferred);
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
