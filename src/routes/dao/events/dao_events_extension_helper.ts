/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import { cvToJSON, deserializeCV } from "@stacks/transactions";
import {
  VotingEventVoteOnProposal,
  VotingEventConcludeProposal,
  VotingEventProposeProposal,
  ExtensionType,
  getTransaction,
  ProposalContract,
  PollCreateEvent,
  PollVoteEvent,
  StoredOpinionPoll,
} from "@mijoco/stx_helpers/dist/index";
import { ObjectId } from "mongodb";
import { fetchExtensions } from "./dao_events_helper";
import { getConfig } from "../../../lib/config";
import {
  daoEventCollection,
  opinionPollCollection,
} from "../../../lib/data/db_models";
import {
  getMetaData,
  getProposalContractSource,
  getProposalData,
} from "../proposals/proposal";
import {
  findPollByHash,
  findUserEnteredPollByHash,
} from "../../polling/polling_helper";

export async function readDaoExtensionEvents(
  genesis: boolean,
  daoContractId: string
) {
  const extensions = await fetchExtensions(daoContractId);
  for (const extensionObj of extensions) {
    await readVotingEvents(genesis, daoContractId, extensionObj.extension);
  }
}

async function readVotingEvents(
  genesis: boolean,
  daoContract: string,
  extensionContract: string
) {
  console.log("readVotingEvents: extension contract ", extensionContract);
  //return;
  const url =
    getConfig().stacksApi +
    "/extended/v1/contract/" +
    extensionContract +
    "/events?limit=20";
  const extensions: Array<ExtensionType> = [];
  let currentOffset = 0;
  if (!genesis) {
    currentOffset = await countEventsByVotingContract(
      daoContract,
      extensionContract
    );
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
    const pdb = await findVotingContractEventByContractAndIndex(
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
  const eventContract = event.contract_log.contract_id;
  const result = cvToJSON(deserializeCV(event.contract_log.value.hex));
  console.log(
    "processEvent: new event: " +
      result.value.event.value +
      " contract=" +
      event.event_index +
      " / " +
      event.tx_id
  );

  if (result.value.event.value === "propose") {
    const proposal = result.value.proposal.value;

    let contract: ProposalContract = await getProposalContractSource(proposal);
    //console.log('resolveExtensionEvents: execute: ', util.inspect(event, false, null, true /* enable colors */))
    const votingContractEvent = {
      _id: new ObjectId(),
      event: "propose",
      event_index: Number(event.event_index),
      txId: event.tx_id,
      daoContract,
      votingContract,
      submissionContract: await getSubmissionContract(event.tx_id),
      proposal,
      proposalMeta: getMetaData(contract.source),
      contract,
      proposalData: await getProposalData(votingContract, proposal),
      proposer: result.value.proposer.value,
    } as VotingEventProposeProposal;
    console.log("processEvent: votingContractEvent", votingContractEvent);
    await saveOrUpdateEvent(votingContractEvent);
    //await updateStackerData(false, proposal);
  } else if (result.value.event.value === "vote") {
    //console.log('resolveExtensionEvents: extension: ', util.inspect(event, false, null, true /* enable colors */))
    const votingContractEvent = {
      _id: new ObjectId(),
      event: "vote",
      event_index: Number(event.event_index),
      txId: event.tx_id,
      daoContract,
      votingContract,
      proposal: result.value.proposal.value,
      sip18: result.value.sip18?.value,
      voter: result.value.voter.value,
      for: result.value.for.value,
      amount: Number(result.value.amount.value),
    } as VotingEventVoteOnProposal;

    //console.log('resolveExtensionEvents: extension: enabled=' + votingContractEvent.enabled + ' contract=' + votingContractEvent.extension + ' contract=' + votingContractEvent.extension + ' event.event_index=' + event.event_index)
    await saveOrUpdateEvent(votingContractEvent);
  } else if (result.value.event.value === "conclude") {
    const proposal = result.value.proposal.value;
    let contract: ProposalContract = await getProposalContractSource(proposal);
    const votingContractEvent = {
      _id: new ObjectId(),
      event: "conclude",
      event_index: Number(event.event_index),
      txId: event.tx_id,
      daoContract,
      votingContract,
      proposal,
      passed: Boolean(result.value.passed.value),
      proposalMeta: getMetaData(contract.source),
      contract,
      proposalData: await getProposalData(votingContract, proposal),
    } as VotingEventConcludeProposal;

    //console.log('resolveExtensionEvents: extension: enabled=' + votingContractEvent.enabled + ' contract=' + votingContractEvent.extension + ' contract=' + votingContractEvent.extension + ' event.event_index=' + event.event_index)
    await saveOrUpdateEvent(votingContractEvent);
  } else if (result.value.event.value === "add-poll") {
    let metadataHash = result.value["metadata-hash"].value;
    metadataHash = metadataHash.replace(/^0x/, "");
    const unhashed: StoredOpinionPoll = await findUserEnteredPollByHash(
      metadataHash
    );
    //opinionPollCollection.findOne();
    const PollCreateEvent = {
      _id: new ObjectId(),
      event: result.value.event.value,
      event_index: Number(event.event_index),
      txId: event.tx_id,
      daoContract,
      contract: eventContract,
      pollId: Number(result.value["poll-id"].value),
      isGated: Boolean(result.value["is-gated"].value),
      endBurnHeight: Number(result.value["end-burn-height"].value),
      startBurnHeight: Number(result.value["start-burn-height"].value),
      metadataHash: metadataHash,
      proposer: result.value.proposer.value,
      unhashedData: unhashed,
    } as PollCreateEvent;

    console.log("resolveExtensionEvents: PollCreateEvent=", PollCreateEvent);
    await saveOrUpdateEvent(PollCreateEvent);
  } else if (result.value.event.value === "poll-vote") {
    const PollVoteEvent = {
      _id: new ObjectId(),
      event: result.value.event.value,
      event_index: Number(event.event_index),
      txId: event.tx_id,
      daoContract,
      contract: eventContract,
      pollId: Number(result.value["poll-id"].value),
      sip18: result.value.sip18.value,
      voter: result.value.voter.value,
      for: result.value.for.value,
    } as PollCreateEvent;

    console.log("resolveExtensionEvents: PollCreateEvent=", PollCreateEvent);
    await saveOrUpdateEvent(PollCreateEvent);
  } else {
    console.log("processEvent: new event: ", event);
  }
}

// Mongo collection methods
export async function countAllEvents(): Promise<number> {
  try {
    const result = await daoEventCollection.countDocuments();
    return Number(result);
  } catch (err: any) {
    return 0;
  }
}

export async function countEventsByVotingContract(
  daoContract: string,
  votingContract: string
): Promise<number> {
  try {
    const result = await daoEventCollection.countDocuments({
      daoContract,
      votingContract,
    });
    return Number(result);
  } catch (err: any) {
    return 0;
  }
}

export async function countVotes(proposal: string): Promise<number> {
  try {
    const result = await daoEventCollection.countDocuments({
      proposal,
      event: "vote",
    });
    return Number(result);
  } catch (err: any) {
    return 0;
  }
}

async function getSubmissionContract(txId: string): Promise<string> {
  const fundingTx = await getTransaction(getConfig().stacksApi, txId);
  return fundingTx.contract_call.contract_id;
}

/**
 * Vote methods
 */
export async function getVotesByProposal(proposal: string): Promise<any> {
  const result = await daoEventCollection
    .find({ proposal, event: "vote" })
    .toArray();
  return result;
}

export async function getVotesByProposalAndVoter(
  proposal: string,
  voter: string
): Promise<any> {
  const result = await daoEventCollection
    .find({ proposal, voter, event: "vote" })
    .toArray();
  return result;
}

export async function getVotesByVoter(voter: string): Promise<any> {
  const result = await daoEventCollection
    .find({ voter, event: "vote" })
    .toArray();
  return result;
}

/**
 * Proposal methods
 */

export async function findVotingContractEventByContractAndIndex(
  votingContract: string,
  event_index: number,
  txId: string
): Promise<any> {
  const result = await daoEventCollection.findOne({
    votingContract,
    event_index,
    txId,
  });
  return result;
}

async function saveOrUpdateEvent(
  votingContractEvent:
    | VotingEventVoteOnProposal
    | VotingEventConcludeProposal
    | VotingEventProposeProposal
    | PollCreateEvent
    | PollVoteEvent
) {
  try {
    const pdb = await findVotingContractEventByContractAndIndex(
      votingContractEvent.votingContract,
      votingContractEvent.event_index,
      votingContractEvent.txId
    );
    console.log("saveOrUpdateEvent: pdb", pdb);
    if (pdb) {
      console.log(
        "saveOrUpdateEvent: updating: " +
          votingContractEvent.votingContract +
          " / " +
          votingContractEvent.event +
          " / " +
          votingContractEvent.event_index +
          " / " +
          votingContractEvent.txId
      );
      await updateDaoEvent(votingContractEvent._id, votingContractEvent);
    } else {
      console.log(
        "saveOrUpdateEvent: saving: " +
          votingContractEvent.votingContract +
          " / " +
          votingContractEvent.event +
          " / " +
          votingContractEvent.event_index +
          " / " +
          votingContractEvent.txId
      );
      await saveDaoEvent(votingContractEvent);
    }
  } catch (err: any) {
    console.log("saveOrUpdateEvent: error", err);
  }
}
async function saveDaoEvent(
  proposal:
    | VotingEventVoteOnProposal
    | VotingEventConcludeProposal
    | VotingEventProposeProposal
    | PollCreateEvent
    | PollVoteEvent
) {
  proposal._id = new ObjectId();
  const result = await daoEventCollection.insertOne(proposal);
  return result;
}

async function updateDaoEvent(
  _id: ObjectId,
  changes:
    | VotingEventVoteOnProposal
    | VotingEventConcludeProposal
    | VotingEventProposeProposal
    | PollCreateEvent
    | PollVoteEvent
) {
  const result = await daoEventCollection.updateOne(
    {
      _id,
    },
    { $set: changes }
  );
  return result;
}
