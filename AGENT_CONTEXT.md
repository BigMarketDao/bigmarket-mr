# BigMarket Rebuild Plan (FPMM + CLOB Hybrid)

## Overview

BigMarket is being rebuilt from a CPMM-based prediction market into a hybrid system combining:

- FPMM (Fixed Product Market Maker) for baseline liquidity
- CLOB (Central Limit Order Book) for price precision and professional trading

This architecture is inspired by systems like Polymarket, but adapted for:

- Stacks / Clarity constraints
- DAO-governed markets
- Reputation-based participation (future BIGR system)

---

## Core Development Philosophy

### 1. Use Case Driven Development

We do NOT build contracts or systems in isolation.

We start from **concrete user actions**, e.g.:

- "User places a market order"
- "User posts a limit order"
- "Market resolves and settles positions"
- "User creates a new market"

Each use case defines:

- required contracts
- required backend logic
- required frontend components

---

### 2. Thin Vertical Slices

We build **end-to-end slices**, not layers.

Each slice includes:

- minimal frontend
- minimal backend / matcher logic
- minimal smart contract functionality

Example:

Use Case: Place Market Order

Includes:

- UI button
- API route
- matching engine logic
- contract call

Each slice should be:

- deployable
- testable
- incrementally extensible

---

### 3. AI-Assisted Development (Cursor + ChatGPT)

This project is designed to be built collaboratively with AI agents.

Key principles:

- Keep files small and modular
- Use clear naming and folder structure
- Maintain strong documentation in `/docs`
- Each use case should be independently understandable

Agents should be able to:

- pick up any use case
- understand state + invariants
- extend safely

---

## System Architecture (Target)

### On-chain (Clarity)

Responsible for:

- custody of funds
- market state
- settlement
- resolution logic

Core contracts:

- market
- positions
- settlement
- governance (DAO)

(see token + governance spec) :contentReference[oaicite:0]{index=0}

---

### Off-chain

Responsible for:

- order book (CLOB)
- matching engine
- price discovery
- indexing

Components:

- matcher service
- API layer
- indexer

---

### Frontend

Responsible for:

- user interaction
- order placement
- market display

---

## Trading Model

### 1. FPMM Layer

Used for:

- initial liquidity
- fallback pricing
- long-tail markets

Characteristics:

- continuous liquidity
- predictable pricing curve

---

### 2. CLOB Layer

Used for:

- active markets
- tighter spreads
- professional traders

Characteristics:

- limit orders
- order matching
- price-time priority

---

### 3. Hybrid Execution

Routing logic:

- If order matches existing limit orders → use CLOB
- Else → fallback to FPMM

---

## Initial Use Cases (Build Order)

### UC1: Market Creation

- DAO approves market
- creator seeds liquidity
- market contract initialized

---

### UC2: Market Order (FPMM)

- user submits buy/sell
- price calculated via FPMM
- contract executes trade

---

### UC3: Limit Order (CLOB)

- user posts order
- stored off-chain
- matcher updates book

---

### UC4: Order Matching

- matcher pairs orders
- generates settlement instructions
- submits to chain

---

### UC5: Market Resolution

- oracle / DAO resolves outcome
- positions settled

---

### UC6: Claim Winnings

- users withdraw payouts

---

## Folder Structure Convention

```tree
/docs
/use-cases
/flows
/invariants

/apps
/frontend-c1
/backend-api

/contracts
/stacks

/packages
/sdk
```

---

## Invariants (Critical)

- Funds must always be conserved
- No double settlement
- Orders cannot execute twice
- Resolution is final after lock

---

## Development Rules

1. NEVER start with contracts alone
2. ALWAYS start with a use case
3. BUILD end-to-end before expanding
4. KEEP contracts minimal early
5. PUSH complexity off-chain where possible

---

## Key Design Insight

CPMM failed because:

- poor pricing efficiency
- no expressive orders
- weak for governance markets

Hybrid FPMM + CLOB fixes this by:

- enabling real price discovery
- supporting serious traders
- preserving long-tail liquidity

---

## Next Step for Agents

Start with:

👉 `/docs/use-cases/uc2-market-order.md`

Goal:
Implement the simplest possible FPMM trade end-to-end.
