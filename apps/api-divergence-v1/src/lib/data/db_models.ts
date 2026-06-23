import { MongoClient, ServerApiVersion } from 'mongodb';
import type { Collection } from 'mongodb';
import { getConfig, isDev } from '../config.js';
import type { ExternalMarketSnapshot, MarketComparison } from '../../types/event_types.js';

export let externalPolymarketMarketCollection: Collection<ExternalMarketSnapshot>;
export let externalKalshiMarketCollection: Collection<ExternalMarketSnapshot>;

let mongoClient: MongoClient | null = null;

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

	mongoClient = client;
	await client.connect();
	await client.db('admin').command({ ping: 1 });

	const database = client.db(getConfig().mongoDbName);

	externalPolymarketMarketCollection = database.collection<ExternalMarketSnapshot>('externalPolymarketMarket');
	await externalPolymarketMarketCollection.createIndex({ marketId: 1 }, { unique: true });
	await externalPolymarketMarketCollection.createIndex({ sourceUpdatedAt: -1 });
	await externalPolymarketMarketCollection.createIndex({ fetchedAt: -1 });

	externalKalshiMarketCollection = database.collection<ExternalMarketSnapshot>('externalKalshiMarket');
	await externalKalshiMarketCollection.createIndex({ marketId: 1 }, { unique: true });
	await externalKalshiMarketCollection.createIndex({ sourceUpdatedAt: -1 });
	await externalKalshiMarketCollection.createIndex({ fetchedAt: -1 });
}

export async function disconnect(): Promise<void> {
	if (mongoClient) {
		await mongoClient.close();
		mongoClient = null;
	}
}
