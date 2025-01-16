import { PredictionMarketCreateEvent } from "@mijoco/stx_helpers";
import { daoEventCollection } from "../../lib/data/db_models";

export async function fetchMarkets(): Promise<
  Array<PredictionMarketCreateEvent>
> {
  const result = await daoEventCollection
    .find({ unhashedData: { $ne: null, $exists: true } })
    .toArray();
  return result as unknown as Array<PredictionMarketCreateEvent>;
}

export async function fetchMarket(
  marketId: number
): Promise<PredictionMarketCreateEvent> {
  const result = await daoEventCollection.findOne({ marketId });
  return result as unknown as PredictionMarketCreateEvent;
}

export async function countCreateMarketEvents(): Promise<number> {
  try {
    const result = await daoEventCollection.countDocuments({ event: "create" });
    return Number(result);
  } catch (err: any) {
    return 0;
  }
}

export async function findPredictionContractEventByContractAndIndex(
  daoContract: string,
  event_index: number,
  txId: string
): Promise<any> {
  const result = await daoEventCollection.findOne({
    daoContract,
    event_index,
    txId,
  });
  return result;
}
