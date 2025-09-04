import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import type { Collection } from 'mongodb';
import { getConfig, isDev } from '../config.js';

export let forumMessageCollection: Collection;
export let forumMessageBoardCollection: Collection;
export let exchangeRatesCollection: Collection;
export let pythEventCollection: Collection;
export let daoEventCollection: Collection;
export let daoBatchVotingCollection: Collection;
export let marketCollection: Collection;
export let marketBatchVotingCollection: Collection;
export let marketGatingCollection: Collection;
export let marketInterestCollection: Collection;
export let marketCategoriesCollection: Collection;
export let marketLlmLogsCollection: Collection;

export let authUserCollection: Collection;
export let authProviderAccountCollection: Collection;
export let authZkSessionCollection: Collection;
export let authJwtSessionCollection: Collection;
export let authRefreshTokenCollection: Collection;
export let authProofCollection: Collection;
export let walletLinksCollection: Collection;

export async function connect() {
	let uriPrefix: string = 'mongodb+srv';
	if (isDev()) {
		uriPrefix = 'mongodb';
	}
	const uri = `${uriPrefix}://${getConfig().mongoUser}:${getConfig().mongoPwd}@${getConfig().mongoDbUrl}/?retryWrites=true&w=majority`;

	const client = new MongoClient(uri, {
		serverApi: {
			version: ServerApiVersion.v1,
			strict: true,
			deprecationErrors: true
		}
	});

	await client.connect();
	await client.db('admin').command({ ping: 1 });

	const database = client.db(getConfig().mongoDbName);
	exchangeRatesCollection = database.collection('exchangeRatesCollection');
	await exchangeRatesCollection.createIndex({ currency: 1 }, { unique: true });

	forumMessageBoardCollection = database.collection('forumMessageBoardCollection');
	await forumMessageBoardCollection.createIndex({ 'forumMessageBoard.messageBoardId': 1 }, { unique: true });

	forumMessageCollection = database.collection('forumMessageCollection');
	await forumMessageCollection.createIndex({ 'forumContent.messageId': 1 }, { unique: true });

	marketCollection = database.collection('marketCollection');
	await marketCollection.createIndex({ createdAt: 1 }, { unique: true });
	await marketCollection.createIndex({ objectHash: 1 }, { unique: true });

	daoEventCollection = database.collection('daoEventCollection');
	await daoEventCollection.createIndex({ txId: 1, event_index: 1 }, { unique: true });

	marketLlmLogsCollection = database.collection('marketLlmLogsCollection');
	await marketLlmLogsCollection.createIndex({ marketId: 1, marketType: 1, event: 1 }, { unique: true });

	pythEventCollection = database.collection('pythEventCollection');
	await pythEventCollection.createIndex({ txId: 1, event_index: 1 }, { unique: true });

	daoBatchVotingCollection = database.collection('daoBatchVotingCollection');
	await daoBatchVotingCollection.createIndex({ voteObjectHash: 1 }, { unique: true });
	await daoBatchVotingCollection.createIndex({ timestamp: 1 }, { unique: true });

	marketBatchVotingCollection = database.collection('marketBatchVotingCollection');
	await marketBatchVotingCollection.createIndex({ 'poll-id': 1, voter: 1 }, { unique: true });
	await marketBatchVotingCollection.createIndex({ pollVoteObjectHash: 1 }, { unique: true });

	marketGatingCollection = database.collection('marketGatingCollection');
	await marketGatingCollection.createIndex({ gateType: 1 }, { unique: true });

	marketCategoriesCollection = database.collection('marketCategoriesCollection');
	await marketCategoriesCollection.createIndex({ name: 1 }, { unique: true });

	marketInterestCollection = database.collection('marketInterestCollection');
	await marketInterestCollection.createIndex({ email: 1 }, { unique: true });

	// USERS (no PII; durable)
	authUserCollection = database.collection('authUserCollection');
	await authUserCollection.createIndex({ createdAt: -1 });
	await authUserCollection.createIndex({ lastLoginAt: -1 });
	// (optional) if you’ll look users up by display:
	// await authUserCollection.createIndex({ display: 1 }, { unique: true, sparse: true });

	// PROVIDER ACCOUNTS (stable identity per provider)
	authProviderAccountCollection = database.collection('authProviderAccountCollection');
	await authProviderAccountCollection.createIndex({ providerId: 1, subjectHash: 1 }, { unique: true }); // primary lookup + uniqueness
	await authProviderAccountCollection.createIndex({ userId: 1 }); // list all providers for a user
	// (remove the duplicate createIndex you had)

	// ZK SESSIONS (short-lived, string sessionId)
	authZkSessionCollection = database.collection('authZkSessionCollection');
	await authZkSessionCollection.createIndex({ sessionId: 1 }, { unique: true }); // you query by sessionId
	await authZkSessionCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL on per-doc expiresAt
	await authZkSessionCollection.createIndex({ contextId: 1 });
	await authZkSessionCollection.createIndex({ providerId: 1 });
	await authZkSessionCollection.createIndex({ status: 1, createdAt: -1 });

	// JWT SESSIONS (device/browser sessions, string sid)
	authJwtSessionCollection = database.collection('authJwtSessionCollection');
	await authJwtSessionCollection.createIndex({ sid: 1 }, { unique: true }); // you reference by sid
	await authJwtSessionCollection.createIndex({ userId: 1, createdAt: -1 });
	await authJwtSessionCollection.createIndex({ revokedAt: 1 });

	// REFRESH TOKENS (opaque, rotated; string tokenId, references sessionSid)
	authRefreshTokenCollection = database.collection('authRefreshTokenCollection');
	await authRefreshTokenCollection.createIndex({ tokenId: 1 }, { unique: true }); // you look up by tokenId from cookie
	await authRefreshTokenCollection.createIndex({ sessionSid: 1 }); // join to session by sid
	await authRefreshTokenCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL
	await authRefreshTokenCollection.createIndex({ revokedAt: 1 });

	// PROOF BLOBS (optional; can grow)
	authProofCollection = database.collection('authProofCollection');
	await authProofCollection.createIndex({ zkSessionId: 1 });
	await authProofCollection.createIndex({ storedAt: -1 });
	// (optional TTL to keep storage in check, e.g., 30 days)
	// await authProofCollection.createIndex({ storedAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });

	// WALLET LINKS (bind Stacks addresses)
	// Decide your policy:
	// - One address can belong to only one user (common): unique on stxAddress, plus index on userId.
	// - If you’ll support multiple chains in same collection, use a composite unique on (chain, stxAddress).
	walletLinksCollection = database.collection('walletLinksCollection');
	await walletLinksCollection.createIndex({ userId: 1 });
	await walletLinksCollection.createIndex({ stxAddress: 1 }, { unique: true });
	// If multi-chain:
	// await walletLinksCollection.createIndex({ chain: 1, stxAddress: 1 }, { unique: true });
}
