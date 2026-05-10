# BigMarket — Token Economics

## 1. Governance token

| Field | Value (from contract) |
|--------|------------------------|
| Contract | `bme000-0-governance-token.clar` |
| Fungible | `bmg-token` |
| Name | BigMarket Governance Token |
| Symbol | **BIG** |
| Decimals | **6** |
| Max mintable supply | **100,000,000** BIG (constant `u100000000000000` = 100M × 10^6 base units per contract commentary) |

**Transfer gating:** `transfers-active` data var exists (starts `false` in snippet) — DAO-controlled.

**Vesting:** Core team vesting maps and limits (e.g. `core-team-max-vesting` described as 15% in comments) — [PLACEHOLDER — CONFIRM WITH TEAM] live vesting recipients, cliffs, and whether any allocations were burned or reissued.

## 2. Play token (non-production economics)

| Field | Value |
|--------|--------|
| Contract | `big-play.clar` |
| Fungible | `bmg-play` |
| Symbol | **BIGPLAY** |
| Decimals | 6 |
| Supply | Unlimited via **faucet**; initial **seed** mint for testing |

## 3. Reputation token

| Field | Value |
|--------|--------|
| Contract | `bme030-0-reputation-token.clar` |
| Fungible | `bigr-token` |

Minting hooks from market creation (and other behaviours) — [PLACEHOLDER — CONFIRM WITH TEAM] full reputation utility, decay, slashing.

## 4. Utility (BIG)

**In-repo signals only (not exhaustive):**

- DAO governance proposals and SIP-018 style vote ingestion.
- Token sale extension routes exist (`/bigmarket-api/dao/token-sale`).

[PLACEHOLDER — CONFIRM WITH TEAM] Fee discounts, staking yields, escrow for disputes, boosts, liquidity mining, and legal classification of BIG in each jurisdiction.

## 5. Distribution schedule

[PLACEHOLDER — CONFIRM WITH TEAM] Public allocations, treasury, investors, team, liquidity programs, unlock calendars, and circulating supply reporting.

## 6. Liquidity pool mechanics

- **Internal to markets:** LP shares on `bme024` AMM path (`lp-balances`, fee accumulation) — prediction-market LPs.
- **External DEX references:** Contracts reference Velar-style traits (`univ2-router`, treasury hooks) — [PLACEHOLDER — CONFIRM WITH TEAM] production router pools, incentivised pairs, and oracle pricing for BOOT liquidity.
