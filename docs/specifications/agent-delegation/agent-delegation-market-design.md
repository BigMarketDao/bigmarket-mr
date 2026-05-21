## The Question Design Problem

Run concurrent markets across geographies. Experimentally - provides cross-correlation signals and commercially - diversifies the product.

From a chaos theory perspective, the questions need to be carefully structured. There are three distinct layers:

**Layer 1 — Binary threshold markets** (cleanest for settlement)
Simple enough to resolve unambiguously on-chain or via oracle:

- _"Will the S&P 500 close more than 20% below its 1 June 2026 level before 31 December 2026?"_
- _"Will the FTSE 100 enter a bear market (20% drawdown) before 31 March 2027?"_
- _"Will the Nikkei 225 fall below 30,000 before 31 December 2026?"_
- _"Will Brent Crude exceed $150/barrel before 31 December 2026?"_
- _"Will the Bank of England raise rates at least twice before 31 December 2026?"_

**Layer 2 — Severity markets** (more information-rich)
These capture the chaos theory gradient rather than a binary phase transition:

- _"What will the maximum S&P 500 drawdown be from 1 June 2026 peak, by 31 December 2026?"_ — bracketed into ranges: 0–10%, 10–20%, 20–40%, 40%+
- _"Will the VIX exceed 40, 50, or 60 before year end?"_
- _"Will the UK enter a technical recession (two consecutive quarters negative GDP) by end of Q1 2027?"_

**Layer 3 — Correlation/contagion markets** (the most experimentally interesting)
These are unique to running a family of concurrent markets:

- _"If the S&P 500 falls 20%+, will the FTSE 100 follow within 30 days?"_
- _"Will Japan decouple from a US equity drawdown of 20%+?"_
- _"Will a Hormuz-driven oil spike trigger simultaneous bear markets in at least 3 of: S&P, FTSE, DAX, Nikkei, within 60 days?"_

The contagion questions are where the agent ensemble becomes particularly powerful — you're essentially measuring whether agents detect systemic correlation breakdown before it happens.

---

## Suggested Market Family — First Pass

| Market | Instrument     | Rationale                                          |
| ------ | -------------- | -------------------------------------------------- |
| US     | S&P 500        | Primary signal, most liquid                        |
| US     | NASDAQ         | Tech bubble sensitivity separate from broad market |
| UK     | FTSE 100       | Oil-heavy index, Hormuz exposure amplified         |
| UK     | FTSE 250       | More domestic economy exposure, divergence signal  |
| Japan  | Nikkei 225     | Yen dynamics, decoupling hypothesis                |
| Europe | DAX            | Manufacturing/energy sensitivity                   |
| Cross  | Brent Crude    | The Hormuz trigger itself                          |
| Cross  | VIX            | Fear index, criticality precursor                  |
| Macro  | Fed Funds Rate | Policy pivot timing                                |
| Macro  | BoE Base Rate  | UK-specific stagflation signal                     |

Running all ten concurrently gives you the correlation matrix that is genuinely novel — no existing prediction market does this systematically.

---

## On the Signature Submission Mechanism

This is where it gets interesting and I want to think carefully with you. A few questions that determine the architecture:

**Question 1 — How does an agent submit a position?**
Options:

- Agent holds its own keypair (secp256k1/ed25519) and signs autonomously — fully trustless but requires each agent to be a live signing process
- A human operator keypair delegates to a registered agent ID in the contract — simpler operationally, less trustless
- A multisig threshold — say 3-of-5 agents must agree before a position is submitted — interesting because it forces ensemble consensus on-chain

**Question 2 — What is the agent submitting?**
A buy/sell on a binary outcome share is straightforward. But if you want the richer severity markets, agents need to submit probability distributions across buckets — which means the contract needs to handle weighted position structs rather than simple buy/sell.

**Question 3 — On what interval do agents update positions?**
This is the chaos theory design decision. Options:

- Fixed intervals (hourly, daily) — clean but misses the critical slowing down signal
- Event-triggered (agent submits when its internal signal crosses a threshold) — messier but more physically meaningful
- Hybrid — fixed intervals with an emergency submission channel for high-conviction signals

**Question 4 — How does human delegation bind to agent positions?**
From your deposit-for function, a human delegates funds to a signatory address. Does the human:

- Delegate to a specific agent and mirror all its positions automatically
- Delegate to the ensemble and get proportional exposure across all agents
- Delegate with a preference weighting they can adjust over time

That last option is the most interesting — humans are essentially constructing a portfolio of agent strategies, which gives you the meta-prediction layer.

## Answers

Question 1 — How does an agent submit a position? Options:

Agent holds its own keypair (secp256k1/ed25519) and signs autonomously — fully trustless but requires each agent to be a live signing process. I assume we will run the agents on a backend server and give them access to some tools - am a bit sketchy about this but the AIBTC DEV team on stacks have done a lot of work on this front..

Question 2 — What is the agent submitting?

The markets can be binary or categorical - we also have scalar/range but these are limited to price pair markets (btc/usd, stx/usd, etc) with oracle settlement

Question 3 — On what interval do agents update positions?

The submission is an off chain process - the agent running on cron and submitting its buy/sell signature is straight forward.. we can add more complex designs later?

Question 4 — How does human delegation bind to agent positions?

the ui shows the agent addresses, prediction history for given market. The user calls deposit-for with the amount of USDCx and the pubkey that controls the buy./sell.. this could be triggered from ui or they can also send their own pubkey and manage their own vault.

## Architecture

```mermaid
[Backend Server]
    └── Agent processes (one per model/strategy)
         └── Each holds own keypair (secp256k1/ed25519)
         └── Runs on cron schedule
         └── Has access to tool suite (price feeds, macro data, news)
         └── Produces buy/sell signature → submits to contract

[Clarity Vault Contract]
    └── Accepts signed buy/sell transactions
    └── Tracks positions per agent pubkey
    └── deposit-for allows human to delegate USDCx to agent pubkey
    └── Settlement via binary/categorical oracle or price-pair oracle
    └── Proportional winnings distribution to delegators

[Frontend UI]
    └── Shows agent addresses + prediction history per market
    └── User selects agent, calls deposit-for with USDCx amount
    └── Or user submits own pubkey and manages vault directly
```
