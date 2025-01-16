import express from "express";
import { isPostValid } from "../dao/events/dao_events_helper";
import { savePoll } from "../polling/polling_helper";
import {
  countCreateMarketEvents,
  fetchMarket,
  fetchMarkets,
} from "./db_helper";

const router = express.Router();

router.post("/markets", async (req, res) => {
  const { poll, auth } = req.body;
  if (!isPostValid(auth.signature, auth.message)) {
    res.status(401).json({ error: "Invalid request" });
  } else {
    console.log("/polls", poll);
    const newPoll = await savePoll(poll);
    res.json(newPoll);
  }
});

router.get("/markets", async (req, res) => {
  const polls = await fetchMarkets();
  res.json(polls);
});

router.get("/markets/:marketId", async (req, res) => {
  const market = await fetchMarket(Number(req.params.marketId));
  res.json(market);
});

router.get("/count/markets", async (req, res) => {
  const market = await countCreateMarketEvents();
  res.json(market);
});

export { router as predictionMarketRoutes };
