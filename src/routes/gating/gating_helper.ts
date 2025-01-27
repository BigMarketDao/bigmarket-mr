import { GateKeeper } from "@mijoco/stx_helpers/dist/index";
import { gatingCollection } from "../../lib/data/db_models";

export async function fetchCreateMarketMerkleInput(): Promise<GateKeeper> {
  const result = await gatingCollection.findOne({
    gateType: "create-market",
  });
  return result as unknown as GateKeeper;
}
