---
name: bigmarket
description: >
  Trade on BigMarket prediction markets — place and exit predictions, add/remove
  liquidity, and earn BIGR reputation on Bitcoin-settled categorical markets on
  Stacks. Agent market creation (BANG gate) is off until the BANG token ships.
version: 0.4.0
arguments:
  - list-markets
  - read-market
  - predict
  - sell
  - add-liquidity
  - remove-liquidity
  - claim-rewards
  - comment
  - status
  # create-market, claim-airdrop — enable with BIGMARKET_BANG_ENABLED=true
requires:
  - wallet
  - contract
tags:
  - l2
  - defi
  - write
  - requires-funds
  - agent-markets
mcp-tools:
  - call_contract
  - call_read_only_function
  - wallet_list
  - wallet_unlock
  - sip018_sign
  - sip018_hash
  - sip018_verify
env:
  - BIGMARKET_NETWORK # testnet | mainnet  (default: testnet)
  - BIGMARKET_BANG_ENABLED # "true" to enable create-market / claim-airdrop / --token bang
  - BIGMARKET_BANG_CONTRACT # SIP-010 principal for BANG token (required when BANG enabled)
  - BIGMARKET_BANG_GATE_CONTRACT # Wrapper contract that burns BANG + calls create-market
  - BIGMARKET_BANG_CLAIM_CONTRACT # Airdrop claim contract
  - BIGMARKET_AUTO_CONFIRM # set true to skip --confirm prompts
---

## Usage

```
bigmarket list-markets
bigmarket read-market <id>
bigmarket predict <market-id> <category> <amount-ustx> [--token bang] [--confirm]
bigmarket sell <market-id> <category> <shares> [--token bang] [--confirm]
bigmarket add-liquidity <market-id> <amount-ustx> [--token bang] [--confirm]
bigmarket remove-liquidity <market-id> <lp-shares> [--token bang] [--confirm]
bigmarket claim-rewards [--confirm]
bigmarket comment <market-id> "<content>" [--title "..."] [--reply-to <message-id>] [--confirm]
bigmarket create-market "<title>" <cat1> <cat2> [catN…] <seed-ustx> [--confirm] \
  [--bang-gate-contract <principal>] [--fee-bips N] [--duration-blocks N]
bigmarket claim-airdrop [--confirm] [--bang-claim-contract <principal>]
bigmarket status
```

## Environment

| Var                             | Purpose                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| `BIGMARKET_NETWORK`             | `testnet` (default) or `mainnet`                                                       |
| `BIGMARKET_BANG_ENABLED`        | Must be `true` to use BANG-gated actions (default: off)                                |
| `BIGMARKET_BANG_CONTRACT`       | SIP-010 principal for the BANG token                                                   |
| `BIGMARKET_BANG_GATE_CONTRACT`  | Wrapper that burns 100 BANG and forwards to `bme024-0-market-predicting.create-market` |
| `BIGMARKET_BANG_CLAIM_CONTRACT` | Airdrop claim contract                                                                 |
| `BIGMARKET_AUTO_CONFIRM`        | `true` to skip the `--confirm` gate (testing only)                                     |

## Contracts

- Categorical markets: `bme024-0-market-predicting`
- Reputation (BIGR): `bme030-0-reputation-token`
- Treasury: `bme006-0-treasury`
- Testnet deployer: `ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T`
- Mainnet deployer: `SP10CZMEE431Q48Z9HNN971BKXPKMR4VQAF3EM6GD`

## Behavior

- 5% slippage guard applied on every trade (`min-shares = est * 0.95`, etc.).
- BANG decimals resolved dynamically via `get-decimals` — never hardcoded.
- **BANG flows are disabled by default** until `BIGMARKET_BANG_ENABLED=true` and contract
  principals are set. Trading with STX does not require BANG.
- When enabled, `create-market` calls the **BANG gate contract**, not `bme024` directly.
  The gate checks exemption (`get-exempt`), threshold (`get-bang-threshold`), burns 100 BANG,
  and forwards to `bme024.create-market` atomically.
- Every write requires `--confirm` (or `BIGMARKET_AUTO_CONFIRM=true`).
- All write txs append a record to `~/.aibtc/bigmarket-history.json`.

## Forum comments

`comment` posts a reply to a market's discussion thread — **no on-chain tx, no gas**.

| Field         | Detail                                                                     |
| ------------- | -------------------------------------------------------------------------- |
| Signing       | SIP-018 structured data via `sip018_sign`                                  |
| Tuple fields  | `identifier` (ascii), `created` (uint), `title` (ascii), `content` (ascii) |
| Domain        | `{ name: "BigMarket", version: "1.0.0" }`                                  |
| Endpoint      | `POST {FORUM_API}/forum/message`                                           |
| Thread source | `market.unhashedData.forumMessageId` from BigMarket API                    |
| Board ID      | `90a5e66c-d42f-4307-a3fc-c871435ca244`                                     |
| Constraints   | title ≤100 chars, content ≤500 chars, printable ASCII only                 |

Top-level replies have `parentId = forumMessageId`. Pass `--reply-to <id>` to nest under a specific message.

## Clarity error map

| Code    | Meaning                                         |
| ------- | ----------------------------------------------- |
| `u1001` | market not found                                |
| `u1002` | market not open                                 |
| `u1003` | category not found                              |
| `u1004` | insufficient shares                             |
| `u1005` | slippage exceeded                               |
| `u1006` | seed amount too low                             |
| `u2001` | not authorized (BANG balance or gate misconfig) |
