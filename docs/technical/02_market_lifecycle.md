# BigMarket — Market Lifecycle

## 1. Market creation

**On-chain (`bme024-0-market-predicting` and variants):**

- Caller provides categories, optional fee bips (capped by DAO), SIP-010 token, `market-data-hash`, optional Merkle **proof** if `creation-gated` is true, treasury principal, timing fields, and mechanism (KNOCKOUT vs AMM when supported).
- **Creation fee:** If `market-create-fee > 0` and creator is not the configured `resolution-agent`, STX is transferred to `dao-treasury`.
- **Reputation:** On create, `bme030-0-reputation-token` mint is triggered (see contract `create-market` print/mint path).
- **Minimum seed liquidity:** `token-minimum-seed` map enforces per-token minimums; API exposes `GET /bigmarket-api/pm/tokens/liquidity/:token` returning scalar vs categorical mins.

**Off-chain template / indexing:**

- `POST /bigmarket-api/pm/markets` saves a poll template after validation; gating check exists but `gated` is hard-coded `false` with a TODO in `predictionMarketRoutes.ts` ([PLACEHOLDER — CONFIRM WITH TEAM] production value).
- Scalar auto-markets: `scalar-markets.ts` builds metadata (Pyth feed id, categories from price bands) and can submit creation on-chain (scheduler jobs may be commented out in `app.ts`).

[PLACEHOLDER — CONFIRM WITH TEAM] Who may propose markets in production (open vs allowlist), KYC, and content moderation.

## 2. Liquidity mechanics

**On-chain (confirmed in `bme024-0-market-predicting.clar`):**

- **CPMM AMM** (`MECHANISM_AMM`): continuous pricing, buy/sell of outcome shares, LP share accounting (`lp-balances`, `lp-total-shares`, `accumulated-lp-fees`, `claim-lp-fees`).
- **KNOCKOUT** (`MECHANISM_KNOCKOUT`): parimutuel-style — buy and hold, no sell, no LP in the contract comment definition.

**Off-chain (per `CLAUDE.md`):**

- **CLOB** + matching engine for limit orders — **[PLACEHOLDER — CONFIRM WITH TEAM]** exact service ownership, deployment, and how it posts to the vault/market contracts.

**LP fee split:** `lp-fee-split-bips` (e.g. 30% of `dev-fee-bips` to LPs in default) — verify live DAO params.

## 3. Trading flow (stake / bet)

User flow (simplified):

1. Deposit / allocate collateral via **vault** (SIP-010) — reserved vs available balances.
2. Call market contract swap / predict functions (SDK: `packages/sdk`) to acquire outcome **shares**; fees apply per contract parameters (`dev-fee-bips`, market fee, slippage checks on AMM path).

[PLACEHOLDER — CONFIRM WITH TEAM] Frontend transaction batching, sponsor fees, and sBTC-specific flows.

## 4. Resolution flow

### 4.1 Categorical / non-scalar (`marketType !== 2`)

1. Trading window ends; **cool-down** completes (tracked vs Bitcoin burn height).
2. API invokes **LLM** resolution → obtains discrete outcome index / label.
3. **Resolution coordinator** receives enough `signal-resolution` calls from authorised team members (threshold `resolution-signals-required`); then market contract resolves with winning label.

### 4.2 Scalar / Pyth (`marketType === 2`)

1. After active + cool-down, API triggers on-chain scalar resolution using **Pyth** price feed id configured at market creation.
2. Separate job **`resolveUndisputedScalarMarketsOnChain`** finalises markets that remain uncontested past **dispute window** after resolution height is recorded.

### 4.3 Dispute window

- Contract variable `dispute-window-length` (default **144** Bitcoin blocks in `bme024`; sample proposals show values like `u3` — **[PLACEHOLDER — CONFIRM WITH TEAM]** actual mainnet/testnet values).
- Stakers may challenge within the window; escalating to **`bme021`** governance poll if disputed.

### 4.4 Oracle / AI sources

- **Categorical:** user-supplied `criterionSources.sources` and criteria text feed the LLM; not a single deterministic oracle.
- **Scalar:** **Pyth** on Stacks (**confirmed** in `scalar-markets.ts` criterion text).

## 5. Payout distribution

After `concluded` is true:

- Winners call **`claim-winnings`** (and related helpers) per `bme024` logic — pro-rata from winning pool with fee deductions consistent with implemented formulas (see also test scenario docs under `contracts/stacks/bigmarket-dao/tests/predictions/` for worked examples with DAO fee bips).

[PLACEHOLDER — CONFIRM WITH TEAM] Exact fee waterfall in production (dev fund vs DAO treasury vs LP vs market creator), and rounding rules users see in UI.
