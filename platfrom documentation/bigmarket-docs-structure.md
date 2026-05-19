# BigMarket — Documentation Structure

> Version 1.0 — May 2026
> Status: Proposed. Badges indicate page status: `[NEW]` = does not exist yet · `[REWRITE]` = exists, needs full treatment · `[KEEP]` = current content is serviceable

---

## 1 — Getting Started

### 1.1 Overview

- What is BigMarket — mission, prediction markets explained, why it exists `[REWRITE]`
- How BigMarket is different — Bitcoin-settled, DAO-governed, isolated market risk
- What you can do on BigMarket — trader, liquidity provider, market creator, voter

### 1.2 BigMarket 101

- What is a prediction market — everyday analogy, how prices reflect probability `[NEW]`
- Your money and self-custody — where funds live, why BigMarket never holds them `[NEW]`
- Tokens and collateral — STX, sBTC, what you need to get started `[NEW]`
- Why Bitcoin and blockchain — trust, transparency, rules in code not companies `[NEW]`
- Setting up your wallet — Xverse and Leather, step by step `[NEW]`

---

## 2 — Core Concepts

### 2.1 Markets and Events

- What a market is — question, outcomes, pool, resolution `[REWRITE]`
- Market types — binary (yes/no), categorical (multiple choice), scalar (numeric range)
- Market examples — sports, crypto prices, real-world events
- Market states — Open → Cooling → Resolving → Disputed → Resolved `[REWRITE]`

### 2.2 Prices and How They Move

- How prices reflect probability — the seesaw analogy `[NEW]`
- AMM markets — continuous pricing, buy and sell anytime `[REWRITE]`
- Knockout (parimutuel) markets — buy and hold, pool split at resolution `[REWRITE]`
- Slippage — what it is and how to protect yourself

### 2.3 Positions and Tokens

- What shares are — how they represent your position in a market `[NEW]`
- BIG token — governance, how to earn it, what it does `[NEW]`
- Reputation (BIG-R) — soul-bound, non-tradeable, converts to BIG each epoch `[REWRITE]`
- Supported market tokens — STX, sBTC, USDA and others `[NEW]`

### 2.4 Resolution

- How outcomes are decided — resolution agents, signal threshold `[REWRITE]`
- Scalar market resolution — Pyth oracle, automatic, no human needed `[NEW]`
- The dispute window — what it is, who can challenge, timeline `[REWRITE]`
- Dispute voting — DAO community vote, how the outcome is applied

---

## 3 — Trading

### 3.1 Quickstart

- Your first prediction — end-to-end walkthrough in 5 steps `[NEW]`
- Setting up your wallet — Xverse / Leather install and connect `[NEW]`
- Getting tokens — where to get STX or sBTC to start `[NEW]`

### 3.2 Participating in Markets

- Buying shares — picking an outcome, entering an amount, confirming `[REWRITE]`
- Selling before resolution — exit early in AMM markets, how refunds work `[REWRITE]`
- Claiming your winnings — when claims open, how to claim `[KEEP]`

### 3.3 Fees and Payouts

- Fee breakdown — protocol fee (1%), creator fee (0–10%), what you pay `[REWRITE]`
- How payouts work — your share of the winning pool, payout formula in plain English
- Earning BIG-R reputation — which actions earn points and how much `[REWRITE]`

---

## 4 — Liquidity Providers

### 4.1 Overview

- What liquidity providers do — the shared pot analogy, why it matters `[REWRITE]`
- Risks and rewards — impermanent loss explained plainly, fee income `[REWRITE]`

### 4.2 Getting Started as an LP

- Adding liquidity — how it works, what you receive, anti-sandwich protection `[REWRITE]`
- Removing liquidity — when and how to exit, what you get back
- LP fees and BIG-R — your cut of every trade, reputation earned

---

## Page Status Summary

| Status | Count | Meaning |
|--------|-------|---------|
| `[NEW]` | 14 | Page does not exist — must be written from scratch |
| `[REWRITE]` | 14 | Page exists in GitBook but needs full treatment per new guidelines |
| `[KEEP]` | 1 | Current content is serviceable with light edits |
| _(unlabelled)_ | 8 | New page, straightforward — content derivable from feature inventory |

**Total pages: 37**

---

## Suggested Writing Order

Start with the pages that block everything else for new users:

1. `BigMarket 101 → What is a prediction market` — foundation for the entire docs
2. `BigMarket 101 → Your money and self-custody` — biggest trust anxiety for new users
3. `BigMarket 101 → Setting up your wallet` — prerequisite for any action on the platform
4. `BigMarket 101 → Tokens and collateral` — prerequisite for trading
5. `Core Concepts → What a market is` — everything else builds on this
6. `Core Concepts → How prices reflect probability` — unlocks AMM and Knockout pages
7. `Trading → Your first prediction` — end-to-end walkthrough, highest-value UX page
8. `Core Concepts → Resolution → How outcomes are decided` — closes the loop on the full market lifecycle

---

## Notes for Writers

- The **40/30/20/10% fee split** cited in older GitBook copy is not verified in contracts. Use the correct split: 30% to liquidity providers, 70% to DAO treasury, from a 1% protocol fee.
- The **98.5% BIG token allocation** is currently undefined. Do not invent a breakdown — omit or note as "community allocation to be announced by the DAO."
- **P2P share marketplace** (`bme040`) — contract exists but no UI. Do not document yet.
- **Cross-chain (Solana/Sui)** — Phase 3 roadmap only. Never present tense.
- **BIG staking** — no staking contract exists. Do not document.
- All pages must follow the voice guidelines: knowledgeable friend, not technical manual. Jargon permitted only in "The details" section of each page, with plain-English explanation first.
