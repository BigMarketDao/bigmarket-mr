import express from "express";
import { fetchCreateMarketMerkleInput } from "./gating_helper";
import { GateKeeper } from "@mijoco/stx_helpers/dist/index";

const router = express.Router();

router.get("/create-market", async (req, res) => {
  const data: GateKeeper = await fetchCreateMarketMerkleInput();
  res.json(data);
});

export { router as gatingRoutes };
