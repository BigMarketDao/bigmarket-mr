/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import { cvToJSON, deserializeCV } from "@stacks/transactions";
import {
  ExtensionType,
  StoredOpinionPoll,
  PredictionMarketCreateEvent,
  PredictionMarketClaimEvent,
  PredictionMarketStakeEvent,
} from "@mijoco/stx_helpers/dist/index";
import { ObjectId } from "mongodb";
import { getConfig } from "../../lib/config";
import { daoEventCollection } from "../../lib/data/db_models";
import { findUserEnteredPollByHash } from "../polling/polling_helper";
import {
  countCreateMarketEvents,
  fetchMarket,
  findPredictionContractEventByContractAndIndex,
} from "./db_helper";

export async function readPredictionEvents(
  genesis: boolean,
  daoContract: string,
  extensionContract: string
) {
  console.log(
    "readPredictionMarketEvents: extension contract ",
    extensionContract
  );
  //return;
  const url =
    getConfig().stacksApi +
    "/extended/v1/contract/" +
    extensionContract +
    "/events?limit=20";
  const extensions: Array<ExtensionType> = [];
  let currentOffset = 0;
  if (!genesis) {
    currentOffset = await countCreateMarketEvents();
  }
  let count = 0;
  let moreEvents = true;
  try {
    do {
      try {
        moreEvents = await resolveExtensionEvents(
          url,
          currentOffset,
          count,
          daoContract,
          extensionContract
        );
        count++;
      } catch (err: any) {
        console.log("readVotingEvents: " + err.message);
      }
    } while (moreEvents);
  } catch (err) {
    console.log("readVotingEvents: error: ", err);
  }
  return extensions;
}

async function resolveExtensionEvents(
  url: string,
  currentOffset: number,
  count: number,
  daoContract: string,
  extensionContract: string
): Promise<any> {
  let urlOffset = url + "&offset=" + (currentOffset + count * 20);
  const response = await fetch(urlOffset);
  const val = await response.json();
  if (
    !val ||
    !val.results ||
    typeof val.results !== "object" ||
    val.results.length === 0
  ) {
    return false;
  }

  console.log(
    "resolveExtensionEvents: processing " +
      (val?.results?.length || 0) +
      " events from " +
      extensionContract
  );
  //console.log('resolveExtensionEvents: val: ', val)
  for (const event of val.results) {
    const pdb = await findPredictionContractEventByContractAndIndex(
      extensionContract,
      Number(event.event_index),
      event.tx_id
    );
    if (!pdb) {
      try {
        processEvent(event, daoContract, extensionContract);
      } catch (err: any) {
        console.log("resolveExtensionEvents: ", err);
      }
    }
  }
  return val.results?.length > 0 || false;
}

async function processEvent(
  event: any,
  daoContract: string,
  votingContract: string
) {
  const result = cvToJSON(deserializeCV(event.contract_log.value.hex));
  console.log(
    "processEvent: new event: " +
      result.value.event.value +
      " contract=" +
      event.event_index +
      " / " +
      event.tx_id
  );

  if (result.value.event.value === "create") {
    let metadataHash = result.value["metadata-hash"].value;
    metadataHash = metadataHash.replace(/^0x/, "");
    const unhashedData: StoredOpinionPoll = await findUserEnteredPollByHash(
      metadataHash
    );
    const marketId = result.value["market-id"].value;
    const marketType = result.value["market-type"].value;
    const creator = result.value.creator.value;
    const contractEvent = {
      _id: new ObjectId(),
      event: "create",
      event_index: Number(event.event_index),
      txId: event.tx_id,
      daoContract,
      votingContract,
      marketId,
      metadataHash,
      marketType,
      creator,
      unhashedData,
    } as PredictionMarketCreateEvent;
    console.log("processEvent: contractEvent", contractEvent);
    await saveOrUpdateEvent(contractEvent);
  } else if (result.value.event.value === "stake") {
    const marketId = result.value["market-id"].value;
    const amount = result.value.amount.value;
    const yes = result.value.yes.value;
    const voter = result.value.voter.value;

    const contractEvent = {
      _id: new ObjectId(),
      event: "stake",
      event_index: Number(event.event_index),
      txId: event.tx_id,
      daoContract,
      votingContract,
      marketId,
      amount,
      yes,
      voter,
    } as PredictionMarketStakeEvent;
    await saveOrUpdateEvent(contractEvent);
  } else if (result.value.event.value === "resolve") {
    const marketId = result.value["market-id"].value;
    const createEvent = await fetchMarket(marketId);
    createEvent.isWon = result.value["is-won"].value;
    createEvent.resolver = result.value.resolver.value;
    createEvent.resolved = true;
    await saveOrUpdateEvent(createEvent);
  } else if (result.value.event.value === "claim") {
    const marketId = result.value["market-id"].value;
    const isWon = result.value["is-won"].value;
    const claimer = result.value.claimer.value;
    const userStake = result.value["user-stake"].value;
    const userShare = result.value["user-share"].value;
    const winningPool = result.value["winning-pool"].value;
    const totalPool = result.value["total-pool"].value;

    const contractEvent = {
      _id: new ObjectId(),
      event: "claim",
      event_index: Number(event.event_index),
      txId: event.tx_id,
      daoContract,
      votingContract,
      marketId,
      claimer,
      isWon,
      userStake,
      userShare,
      winningPool,
      totalPool,
    } as PredictionMarketClaimEvent;
    await saveOrUpdateEvent(contractEvent);
  } else {
    console.log("processEvent: new event: ", event);
  }
}

async function saveOrUpdateEvent(
  contractEvent:
    | PredictionMarketCreateEvent
    | PredictionMarketStakeEvent
    | PredictionMarketClaimEvent
) {
  let pdb;
  try {
    pdb = await findPredictionContractEventByContractAndIndex(
      contractEvent.votingContract,
      contractEvent.event_index,
      contractEvent.txId
    );
    if (!pdb) {
      //   await updateDaoEvent(contractEvent._id, contractEvent);
      // } else {
      await saveDaoEvent(contractEvent);
    }
  } catch (err: any) {
    console.log("saveOrUpdateEvent: error1: ", pdb, err);
  }
}
async function saveDaoEvent(
  contractEvent:
    | PredictionMarketCreateEvent
    | PredictionMarketStakeEvent
    | PredictionMarketClaimEvent
) {
  contractEvent._id = new ObjectId();
  const result = await daoEventCollection.insertOne(contractEvent);
  return result;
}

async function updateDaoEvent(
  _id: ObjectId,
  changes:
    | PredictionMarketCreateEvent
    | PredictionMarketStakeEvent
    | PredictionMarketClaimEvent
) {
  const result = await daoEventCollection.updateOne(
    {
      _id,
    },
    { $set: changes }
  );
  return result;
}
