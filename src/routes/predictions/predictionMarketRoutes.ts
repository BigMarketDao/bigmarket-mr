import express from "express";
import { isCreatePollPostValid, savePoll } from "../polling/polling_helper";
import {
  countCreateMarketEvents,
  fetchMarket,
  fetchMarkets,
  findOpinionPollByTitle,
} from "./db_helper";

const router = express.Router();

router.post("/markets", async (req, res) => {
  const { newPoll } = req.body;
  if (!isCreatePollPostValid(newPoll)) {
    res.status(401).json({ error: "Invalid request" });
  } else {
    const p = await findOpinionPollByTitle(newPoll.name);
    if (p) {
      res
        .status(502)
        .json({ error: "Market with this question already exists" });
    } else {
      //console.log("/markets", newPoll);
      await savePoll(newPoll);
      res.json(newPoll);
    }
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
