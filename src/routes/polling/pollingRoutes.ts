import express, { Request, Response, Router } from "express";
import type { SignatureData } from "@stacks/connect";
import {
  findPollById,
  isPostValid,
  isPutValid,
  savePoll,
  sha256,
  updatePoll,
} from "./polling_helper";
import { opinionPollCollection } from "../../lib/data/db_models";
import { OpinionPoll } from "./polling_types";
import { createSha2Hash } from "@stacks/encryption";
import { publicKeyToAddress } from "@stacks/transactions";

const router = express.Router();

const SCOPES = "email profile";
const SUPER_ADMIN_ADDRESS = "";

router.post("/polls", async (req, res) => {
  const { message, signature } = req.body;
  if (!isPostValid(signature, message)) {
    res.status(401).json({ error: "Invalid request" });
  }
  const poll = await savePoll(message);
  const sortedObject = JSON.stringify(poll, Object.keys(poll).sort());
  sha256(sortedObject);
  // write to the smart contract...
  res.json(poll);
});

router.get("/polls/:id", async (req, res) => {
  const poll = await findPollById(req.params.id);
});

router.put("/polls/:id", async (req, res) => {
  const { message, signature } = req.body;
  const pollId = message._id;

  if (!isPutValid(signature, message)) {
    res.status(401).json({ error: "Invalid request" });
  }

  // // Fetch the poll to check permissions
  let poll = await findPollById(pollId);
  if (!poll) {
    res.status(404).json({ error: "Poll not found" });
  }

  // // Check if the user is an admin or super admin
  const stacksAddress = publicKeyToAddress(signature.publicKey, "testnet");
  if (
    !poll ||
    (poll.admin !== stacksAddress && stacksAddress !== SUPER_ADMIN_ADDRESS)
  ) {
    res.status(403).json({ error: "Forbidden" });
  }

  // Proceed with the update
  poll = await updatePoll(pollId, message); // Example update logic
  res.json(poll);
});

export { router as pollingRoutes };
