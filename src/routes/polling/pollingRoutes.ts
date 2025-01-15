import express from "express";
import {
  findPollByHash,
  findPolls,
  isCreatePollPostValid,
  isPostPollMessageValid,
  savePoll,
} from "./polling_helper";
import { publicKeyToAddress } from "@stacks/transactions";
import { isPostValid } from "../dao/events/dao_events_helper";
import {
  findPollVoteByHash,
  findUnprocessedSip18PollMessages,
  saveSip18PollVote,
} from "./poll_voting_helper";

const router = express.Router();

const SCOPES = "email profile";
const SUPER_ADMIN_ADDRESS = "";

router.post("/polls", async (req, res) => {
  const { poll, auth } = req.body;
  if (!isPostValid(auth.signature, auth.message)) {
    res.status(401).json({ error: "Invalid request" });
  } else {
    console.log("/polls", poll);
    const newPoll = await savePoll(poll);
    res.json(newPoll);
  }
});

router.post("/sip18-votes/:pollVoteObjectHash", async (req, res) => {
  const { message, signature } = req.body;
  if (!isPostPollMessageValid(signature, message)) {
    res.status(401).json({ error: "Invalid request" });
  } else {
    console.log("/votes: PostValid");
    await saveSip18PollVote(req.params.pollVoteObjectHash, message, signature);
    const vote = await findPollVoteByHash(message.pollVoteObjectHash);
    res.json(vote);
  }
});

router.get("/sip18-votes/:hash", async (req, res) => {
  const polls = await findUnprocessedSip18PollMessages(req.params.hash);
  res.json(polls);
});

router.get("/polls", async (req, res) => {
  const polls = await findPolls();
  res.json(polls);
});

router.get("/polls/:hash", async (req, res) => {
  const poll = await findPollByHash(req.params.hash);
  res.json(poll);
});

export { router as pollingRoutes };
