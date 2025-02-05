import express from "express";
import {
  fetchCreateMarketMerkleInput,
  registerInterest,
} from "./gating_helper";
import { GateKeeper } from "@mijoco/stx_helpers/dist/index";

const router = express.Router();

router.get("/create-market", async (req, res) => {
  const data: GateKeeper = await fetchCreateMarketMerkleInput();
  res.json(data);
});

router.get("/register-interest/:email", async (req, res) => {
  const data = await registerInterest(req.params.email);
  res.json({ result: data });
});

export { router as gatingRoutes };
