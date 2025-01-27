import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import type { Collection } from "mongodb";
import { getConfig, isDev } from "../config";

export let exchangeRatesCollection: Collection;
export let opinionPollCollection: Collection;
export let opinionPollSip18VotingCollection: Collection;
export let daoEventCollection: Collection;
export let daoSip18VotingCollection: Collection;
export let gatingCollection: Collection;

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

  opinionPollCollection = database.collection("opinionPollCollection");
  await opinionPollCollection.createIndex({ createdAt: 1 }, { unique: true });
  await opinionPollCollection.createIndex({ objectHash: 1 }, { unique: true });
  await opinionPollCollection.createIndex({ name: 1 }, { unique: true });

  daoEventCollection = database.collection("daoEventCollection");
  await daoEventCollection.createIndex(
    { txId: 1, event_index: 1 },
    { unique: true }
  );

  daoSip18VotingCollection = database.collection("daoSip18VotingCollection");
  await daoSip18VotingCollection.createIndex(
    { voteObjectHash: 1 },
    { unique: true }
  );
  await daoSip18VotingCollection.createIndex(
    { timestamp: 1 },
    { unique: true }
  );

  opinionPollSip18VotingCollection = database.collection(
    "opinionPollSip18VotingCollection"
  );
  await opinionPollSip18VotingCollection.createIndex(
    { "poll-id": 1, voter: 1 },
    { unique: true }
  );
  await opinionPollSip18VotingCollection.createIndex(
    { pollVoteObjectHash: 1 },
    { unique: true }
  );

  gatingCollection = database.collection("gatingCollection");
  await gatingCollection.createIndex({ gateType: 1 }, { unique: true });
}
