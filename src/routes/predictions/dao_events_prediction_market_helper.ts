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
  ResolutionState,
  TokenPermissionEvent,
  getSip10Properties,
} from "@mijoco/stx_helpers/dist/index";
import { ObjectId } from "mongodb";
import { getConfig } from "../../lib/config";
import { daoEventCollection } from "../../lib/data/db_models";
import { findUserEnteredPollByHash } from "../polling/polling_helper";
import {
  countCreateMarketEvents,
  fetchMarket,
  findPredictionContractEventByContractAndIndex,
} from "./markets_helper";

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
  // console.log(
  //   "processEvent: new event: " +
  //     result.value.event.value +
  //     " contract=" +
  //     event.event_index +
  //     " / " +
  //     event.tx_id
  // );

  if (result.value.event.value === "create-market") {
    let metadataHash = result.value["market-data-hash"].value;
    metadataHash = metadataHash.replace(/^0x/, "");
    const unhashedData: StoredOpinionPoll = await findUserEnteredPollByHash(
      metadataHash
    );
    const marketId = Number(result.value["market-id"].value);
    const marketType = Number(result.value["market-type"].value);
    const creator = result.value.creator.value;
    const token = result.value.token.value;
    const contractEvent = {
      _id: new ObjectId(),
      event: "create-market",
      event_index: Number(event.event_index),
      txId: event.tx_id,
      daoContract,
      votingContract,
      marketId,
      metadataHash,
      marketType,
      creator,
      token,
      unhashedData,
      resolutionState: ResolutionState.RESOLUTION_OPEN,
    } as PredictionMarketCreateEvent;
    //console.log("processEvent: contractEvent", contractEvent);
    await saveOrUpdateEvent(contractEvent);
  } else if (result.value.event.value === "allowed-token") {
    const allowed = Boolean(result.value.enabled.value);
    const token = result.value.token.value;

    const contractEvent = {
      _id: new ObjectId(),
      event: "allowed-token",
      event_index: Number(event.event_index),
      txId: event.tx_id,
      daoContract,
      votingContract,
      allowed,
      token,
    } as TokenPermissionEvent;
    const sip10Data = await getSip10Properties(
      getConfig().stacksApi,
      contractEvent
    );
    contractEvent.sip10Data = sip10Data;
    await saveOrUpdateEvent(contractEvent);
    // (print {event: "market-stake", market-id: market-id, amount: amount, yes: yes, voter: tx-sender})
  } else if (result.value.event.value === "market-stake") {
    const marketId = Number(result.value["market-id"].value);
    const amount = Number(result.value.amount.value);
    const yes = Boolean(result.value.yes.value);
    const voter = result.value.voter.value;

    const contractEvent = {
      _id: new ObjectId(),
      event: "market-stake",
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
    // (print {event: "market-stake", market-id: market-id, amount: amount, yes: yes, voter: tx-sender})
  } else if (result.value.event.value === "resolve-market") {
    const marketId = Number(result.value["market-id"].value);
    const createEvent = await fetchMarket(marketId);
    if (!createEvent || createEvent.concluded) return;
    createEvent.outcome = Boolean(result.value.outcome.value);
    createEvent.resolver = result.value.resolver.value;
    createEvent.resolutionState = Number(
      result.value["resolution-state"].value
    );
    createEvent.concluded = false;
    await saveOrUpdateEvent(createEvent);
  } else if (result.value.event.value === "resolve-market-undisputed") {
    const marketId = Number(result.value["market-id"].value);
    const createEvent = await fetchMarket(marketId);
    if (!createEvent || createEvent.concluded) return;
    createEvent.concluded = true;
    createEvent.resolutionState = Number(
      result.value["resolution-state"].value
    );
    createEvent.resolutionBurnHeight = Number(
      result.value["resolution-burn-height"].value
    );
    await saveOrUpdateEvent(createEvent);
  } else if (result.value.event.value === "resolve-market-vote") {
    console.log("=======> resolveExtensionEvents: resolve-market-vote", result);
    const marketId = Number(result.value["market-id"].value);
    const createEvent = await fetchMarket(marketId);
    //if (!createEvent || createEvent.concluded) return;
    console.log(
      "=======> resolveExtensionEvents: resolve-market-vote",
      createEvent
    );
    createEvent.resolver = result.value.resolver.value;
    createEvent.outcome = result.value.outcome.value;
    createEvent.concluded = true;
    createEvent.resolutionState = Number(
      result.value["resolution-state"].value
    );
    await updateDaoEvent(createEvent._id, createEvent);
  } else if (result.value.event.value === "dispute-resolution") {
    const marketId = Number(result.value["market-id"].value);
    const createEvent = await fetchMarket(marketId);
    if (!createEvent || createEvent.concluded) return;
    createEvent.disputer = result.value.disputer.value;
    createEvent.resolutionState = Number(
      result.value["resolution-state"].value
    );
    await saveOrUpdateEvent(createEvent);
  } else if (result.value.event.value === "claim-winnings") {
    const marketId = Number(result.value["market-id"].value);
    const yes = Boolean(result.value.yes.value);
    const claimer = result.value.claimer.value;
    const userStake = Number(result.value["user-stake"].value);
    const userShare = Number(result.value["user-share"].value);
    const winningPool = Number(result.value["winning-pool"].value);
    const totalPool = Number(result.value["total-pool"].value);
    const daoFee = Number(result.value["dao-fee"].value);

    const contractEvent = {
      _id: new ObjectId(),
      event: "claim-winnings",
      event_index: Number(event.event_index),
      txId: event.tx_id,
      daoContract,
      votingContract,
      marketId,
      claimer,
      yes,
      userStake,
      userShare,
      winningPool,
      daoFee,
      totalPool,
    } as PredictionMarketClaimEvent;
    await saveOrUpdateEvent(contractEvent);
  } else {
    //console.log("processEvent: new event: ", event);
  }
}

async function saveOrUpdateEvent(
  contractEvent:
    | PredictionMarketCreateEvent
    | PredictionMarketStakeEvent
    | PredictionMarketClaimEvent
    | TokenPermissionEvent
) {
  let pdb;
  try {
    pdb = await findPredictionContractEventByContractAndIndex(
      contractEvent.votingContract,
      contractEvent.event_index,
      contractEvent.txId
    );
    if (pdb) {
      await updateDaoEvent(contractEvent._id!, contractEvent);
    } else {
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
    | TokenPermissionEvent
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
    | TokenPermissionEvent
) {
  const result = await daoEventCollection.updateOne(
    {
      _id,
    },
    { $set: changes }
  );
  return result;
}
