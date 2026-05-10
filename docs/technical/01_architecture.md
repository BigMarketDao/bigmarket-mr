# BigMarket — System Architecture

## 1. Stacks and Bitcoin (Proof of Transfer)

BigMarket's on-chain state lives on **Stacks**, a layer that settles on **Bitcoin**. Stacks uses **Proof of Transfer (PoX)** to anchor its security and finality to Bitcoin's chain: STX holders effectively participate in a mechanism that ties Stacks consensus to Bitcoin block commits. User-facing time windows in this codebase (e.g. market duration, cool-down, dispute windows) are often expressed in **Bitcoin burn block height** (`burn_block_height`), not only Stacks height.

[PLACEHOLDER — CONFIRM WITH TEAM] Exact PoX parameters, Nakamoto rules in production, and how operational runbooks refer to "Bitcoin time" vs "Stacks time" for SLAs.

## 2. Smart contract layer (Clarity)

- **Language:** Clarity (decidable, interpreted on Stacks).
- **DAO core:** `bigmarket-dao` coordinates enabled extensions.
- **Prediction markets (current CPMM implementation):** `bme024-0-market-predicting.clar` — categorical/binary markets with:
  - **Mechanisms:** `MECHANISM_KNOCKOUT` (parimutuel-style pool) vs `MECHANISM_AMM` (CPMM: continuous pricing, buy/sell, LP fees).
  - **Resolution states:** open → resolving → disputed → concluded (canonical constants `RESOLUTION_OPEN` … `RESOLUTION_RESOLVED`).
  - **Gating:** optional creation gated via Merkle proofs (`bme022-0-market-gating`).
  - **Allowed collateral:** DAO-configurable allowlist of SIP-010 contracts.
  - **Vault:** `bme050-0-vault.clar` — custody model `total = available + reserved` ([PLACEHOLDER — CONFIRM WITH TEAM] production vault addresses per network).

- **Resolution coordinator:** `bme008-0-resolution-coordinator.clar` — authorised "resolution team" principals call `signal-resolution` with an outcome label and a **metadata hash** (used to bind off-chain evidence, e.g. model/prompt hashing).

- **Disputed outcomes / governance voting hook:** `bme021-0-market-voting.clar` — when a categorical dispute is opened, DAO-configured voting duration applies; governance voting selects among outcome categories.

- **Oracle scalar markets:** `bme024-0-market-scalar-pyth.clar` integrates **Pyth** price feeds on Stacks for range/scalar-style resolution paths (distinct from categorical LLM resolution).

- **Legacy linear contracts:** `contracts/…/extensions/linear/bme023-*` are noted in repo docs as **legacy** (non-CPMM); excluded from some deployments.

## 3. Off-chain API and hybrid execution

Per repository architecture notes (`CLAUDE.md`):

- **Express API** (`apps/api-v1`): indexing, DAO events, polling, JWT-related flows, gating helpers, oracle helpers, reputation jobs, MongoDB-backed state.
- **Documented routing:** try **CLOB** first when matching limit orders exist, else fall back to **on-chain FPMM/CPMM**.

Confirmed in-repo for prediction routes under `/bigmarket-api/pm/` (markets, stakes, claims, DAO overview cache). No `orderbook` / `limit_order` identifiers surfaced in a quick codebase search; treat CLOB specifics as **[PLACEHOLDER — CONFIRM WITH TEAM]** unless located in another service or unpublished package.

## 4. AI resolution engine (automatic market closure)

**Categorical markets (indexed `marketType !== 2` in resolver):**

1. Scheduled job (`apps/api-v1/src/routes/agent/agentScheduler.ts`, cron) calls `sweepAndResolveCategoricalMarkets`.
2. For each open market whose end-of-cool-down has passed (using **Stacks** `burn_block_height` from Hiro), the API builds a payload (title, description, resolution criteria, categories, sources) and POSTs to an external **`llmServer`** endpoint: `{llmServer}/resolve-market`.
3. Successful responses are logged in MongoDB (`marketLlmLogsCollection`); referenced model id includes **`DeepSeek V3`** in `resolver-helper.ts`.
4. The service then submits a Stacks transaction calling **`signal-resolution`** on the resolution coordinator with the winning **category label** and a **metadata hash** derived from canonical JSON of the request (sorted keys → SHA-256).

**Scalar / oracle markets (`marketType === 2`):**

- Separate path: after timing conditions, `resolveScalarMarketOnChain` / `resolveUndisputedScalarMarketsOnChain` drive on-chain resolution using **Pyth** (documented in market metadata strings in `scalar-markets.ts`).

[PLACEHOLDER — CONFIRM WITH TEAM] Hosting, data retention, model versioning, human review, and incident response for incorrect LLM outputs.

## 5. DAO governance model

- **Governance token contract:** `bme000-0-governance-token.clar` — SIP-010 fungible **`bmg-token`**, human-readable symbol **BIG**, **6** decimals, max supply constant **100M** tokens (as defined in contract comments/constants).
- **Proposals & extensions:** Executed through the DAO contract and proposal contracts under `contracts/…/proposals/` (enabling resolution coordinator, dispute window length, etc.).
- **SIP-018 style voting surfaces:** API routes under `/bigmarket-api/dao/sip18-voting` and `/bigmarket-api/polling` accept signed messages for vote objects.
- **Market-specific disputes:** `bme021-0-market-voting` (see §2).

[PLACEHOLDER — CONFIRM WITH TEAM] Quorum, proposal types, timelocks, and whether BIG must be staked/locked to vote on-chain vs off-chain signed aggregation.

## 6. "Play money" vs "real money"

- **Play token (dev/test):** `contracts/…/external/big-play.clar` — SIP-010 **`bmg-play`**, symbol **BIGPLAY**, 6 decimals, public **faucet** mint capped per call, plus one-time **seed** mint for simulated depth.
- **Real collateral:** Any **DAO-allowed** SIP-010 (e.g. sBTC, stable wrappers — deployment-specific) used with the vault and market contracts.

Modes are **not** a single global flag in the snippets reviewed; they are effectively **which token** the user holds and which network (testnet/mainnet) the app points to.

[PLACEHOLDER — CONFIRM WITH TEAM] Product policy: which tokens are "real money" in each jurisdiction, sandbox vs production branding, and tap controls for BIGPLAY.
