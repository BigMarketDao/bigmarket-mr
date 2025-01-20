import express from "express";
import { isCreatePollPostValid, savePoll } from "../polling/polling_helper";
import {
  countCreateMarketEvents,
  fetchMarket,
  fetchMarkets,
  fetchMarketStakes,
  findOpinionPollByTitle,
} from "./markets_helper";
import {
  PredictionContractData,
  readPredictionContractData,
} from "@mijoco/stx_helpers/dist/index";
import { getConfig } from "../../lib/config";
import { getDaoConfig } from "../../lib/config_dao";

const router = express.Router();
let contractData: PredictionContractData;

router.get("/contract", async (req, res) => {
  if (!contractData) {
    contractData = await readPredictionContractData(
      getConfig().stacksApi,
      getDaoConfig().VITE_DOA_PREDICTION_MARKET.split(".")[0],
      getDaoConfig().VITE_DOA_PREDICTION_MARKET.split(".")[1]
    );
  }
  res.json(contractData);
});

router.post("/markets", async (req, res) => {
  const { newPoll } = req.body;
  console.log("isCreatePollPostValid: ", newPoll);
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

router.get("/markets/stakes/:marketId", async (req, res) => {
  const polls = await fetchMarketStakes(Number(req.params.marketId));
  res.json(polls);
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
