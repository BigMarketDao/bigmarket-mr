import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import type { Collection } from "mongodb";
import { getConfig, isDev } from "../config";

export let exchangeRatesCollection: Collection;
export let daoEventCollection: Collection;
export let daoBatchVotingCollection: Collection;
export let marketCollection: Collection;
export let marketBatchVotingCollection: Collection;
export let marketGatingCollection: Collection;
export let marketInterestCollection: Collection;
export let marketCategoriesCollection: Collection;

export async function connect() {
  let uriPrefix: string = "mongodb+srv";
  if (isDev()) {
    uriPrefix = "mongodb";
  }
  const uri = `${uriPrefix}://${getConfig().mongoUser}:${
    getConfig().mongoPwd
  }@${getConfig().mongoDbUrl}/?retryWrites=true&w=majority`;

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  await client.db("admin").command({ ping: 1 });

  const database = client.db(getConfig().mongoDbName);
  exchangeRatesCollection = database.collection("exchangeRatesCollection");
  await exchangeRatesCollection.createIndex({ currency: 1 }, { unique: true });

  marketCollection = database.collection("marketCollection");
  await marketCollection.createIndex({ createdAt: 1 }, { unique: true });
  await marketCollection.createIndex({ objectHash: 1 }, { unique: true });
  await marketCollection.createIndex({ name: 1 }, { unique: true });

  daoEventCollection = database.collection("daoEventCollection");
  await daoEventCollection.createIndex(
    { txId: 1, event_index: 1 },
    { unique: true }
  );

  daoBatchVotingCollection = database.collection("daoBatchVotingCollection");
  await daoBatchVotingCollection.createIndex(
    { voteObjectHash: 1 },
    { unique: true }
  );
  await daoBatchVotingCollection.createIndex(
    { timestamp: 1 },
    { unique: true }
  );

  marketBatchVotingCollection = database.collection(
    "marketBatchVotingCollection"
  );
  await marketBatchVotingCollection.createIndex(
    { "poll-id": 1, voter: 1 },
    { unique: true }
  );
  await marketBatchVotingCollection.createIndex(
    { pollVoteObjectHash: 1 },
    { unique: true }
  );

  marketGatingCollection = database.collection("marketGatingCollection");
  await marketGatingCollection.createIndex({ gateType: 1 }, { unique: true });

  marketCategoriesCollection = database.collection(
    "marketCategoriesCollection"
  );
  await marketCategoriesCollection.createIndex({ name: 1 }, { unique: true });

  marketInterestCollection = database.collection("marketInterestCollection");
  await marketInterestCollection.createIndex({ email: 1 }, { unique: true });
}
