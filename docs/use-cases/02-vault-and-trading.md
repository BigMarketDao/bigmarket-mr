# BigMarket – Core Use Case: Vault & Trading Flow

## Purpose

This document defines the foundational user flow for BigMarket's trading system.

Rather than designing architecture top-down, we define the system through **concrete user actions**.
This ensures all layers (contracts, SDK, UI, indexing) evolve consistently.

---

## Core Concept

BigMarket uses a **shared vault model** for user funds.

Users deposit SIP-010 tokens (e.g. USDC, STX, sBTC) into a central vault contract.
These funds remain owned by the user but are **custodied by the protocol** and tracked via internal balances.

Funds can then be:

- allocated to market positions
- released back to available balance
- withdrawn back to the user wallet

---

## Use Case 1: Deposit Funds into Vault

### User Story

A user deposits 100 USDC into the protocol vault and receives an internal balance of 100 USDC.

### Flow

1. User connects wallet
2. User selects token (e.g. USDC)
3. User inputs deposit amount
4. User submits transaction
5. Vault contract receives tokens
6. Internal balance is credited

### Contract Responsibilities

**vault.clar**

- accept SIP-010 transfer
- credit `balances[user][token]`
- emit deposit event

### Data Model

```
balances: {
  (user, token) => {
    total: uint,
    available: uint,
    reserved: uint
  }
}
```

### Notes

- `total = available + reserved`
- Funds remain withdrawable unless reserved

---

## Use Case 2: Allocate Funds to Market Position

### User Story

A user allocates 40 USDC from their vault balance to a position in a market.

### Flow

1. User selects market
2. User selects outcome
3. User inputs stake amount
4. System checks available balance
5. Vault reserves funds
6. Market records position

### Contract Responsibilities

**market.clar**

- validate market state
- record position
- call vault to reserve funds

**vault.clar**

- decrease `available`
- increase `reserved`
- lock funds for market usage

### Key Invariant

```
user cannot allocate more than available balance
```

---

## Use Case 3: Settle or Exit Position

### User Story

After market resolution (or exit logic), user funds are returned to available balance with profit/loss applied.

### Flow

1. Market resolves OR user exits early (if supported)
2. Market calculates payout
3. Vault releases reserved funds
4. Vault updates available balance

### Contract Responsibilities

**market.clar**

- compute payout
- trigger fund release

**vault.clar**

- decrease reserved
- increase available
- apply profit/loss delta

---

## Use Case 4: Withdraw Funds

### User Story

A user withdraws 60 USDC from their available vault balance back to their wallet.

### Flow

1. User selects token and amount
2. System checks available balance
3. Vault transfers tokens to user
4. Internal balance is reduced

### Contract Responsibilities

**vault.clar**

- validate available balance
- transfer SIP-010 tokens
- update balances
- emit withdrawal event

---

## Architectural Components

### Contracts

- `vault.clar`
  - deposit
  - withdraw
  - reserve funds
  - release funds
  - balance tracking

- `market.clar`
  - position management
  - settlement logic
  - interacts with vault

- `token-registry.clar`
  - allowed SIP-010 tokens

- `dao.clar`
  - governance of parameters (fees, tokens, permissions)

---

### SDK / Client

- transaction builders (deposit, withdraw, stake)
- read helpers (balances, positions)
- shared types

---

### Indexer / API

- track deposits and withdrawals
- track per-user balances
- track positions and market exposure

---

### Frontend

- wallet connection
- deposit / withdraw UI
- balance display
- market interaction UI

---

## Design Choice: Shared Vault

We adopt a **shared central vault model**.

### Benefits

- reusable liquidity across markets
- improved UX (no repeated deposits)
- easier accounting and settlement
- supports advanced features (netting, margin, batching)

### Tradeoffs

- vault becomes critical infrastructure
- requires careful security and auditing

---

## Non-Goals (for this phase)

- advanced pricing models (CPMM replacement)
- dispute resolution system
- governance execution logic
- cross-chain support

---

## Summary

This vault-based flow defines the **minimum viable architecture** for BigMarket.

By implementing these 4 use cases, we establish:

- token custody
- internal accounting
- market interaction primitives
- end-to-end transaction flow

All future features should build on top of this foundation.

---

## Notes for Agents / Contributors

- Do not introduce direct wallet → market transfers
- All market interactions must go through the vault
- Maintain strict separation:
  - vault = accounting
  - market = logic

- Preserve invariants around `available` vs `reserved` balances
