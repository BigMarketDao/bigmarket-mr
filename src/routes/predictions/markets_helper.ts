import {
  PredictionMarketCreateEvent,
  PredictionMarketStakeEvent,
  StoredOpinionPoll,
} from "@mijoco/stx_helpers/dist/index";
import {
  daoEventCollection,
  opinionPollCollection,
} from "../../lib/data/db_models";

export async function fetchMarketStakes(
  marketId: number
): Promise<Array<PredictionMarketStakeEvent>> {
  const result = await daoEventCollection
    .find({ marketId, event: "market-stake" })
    .toArray();
  return result as unknown as Array<PredictionMarketStakeEvent>;
}

export async function fetchMarkets(): Promise<
  Array<PredictionMarketCreateEvent>
> {
  const result = await daoEventCollection
    .find({ unhashedData: { $ne: null, $exists: true } })
    .toArray();
  return result as unknown as Array<PredictionMarketCreateEvent>;
}

export async function findOpinionPollByTitle(
  title: string
): Promise<StoredOpinionPoll> {
  const result = await opinionPollCollection.findOne({
    name: title,
  });
  return result as unknown as StoredOpinionPoll;
}

export async function fetchMarket(
  marketId: number
): Promise<PredictionMarketCreateEvent> {
  const result = await daoEventCollection.findOne({
    event: "create-market",
    marketId: marketId,
  });
  return result as unknown as PredictionMarketCreateEvent;
}

export async function countCreateMarketEvents(): Promise<number> {
  try {
    const result = await daoEventCollection.countDocuments({
      event: "create-market",
    });
    return Number(result);
  } catch (err: any) {
    return 0;
  }
}

export async function findPredictionContractEventByContractAndIndex(
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
export async function findPredictionContractEventAndIndex(
  event_index: number,
  txId: string
): Promise<any> {
  const result = await daoEventCollection.findOne({
    event_index,
    txId,
  });
  return result;
}
