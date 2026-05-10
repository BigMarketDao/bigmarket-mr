# BigMarket — User Roles

## 1. Market creators

- Submit market metadata off-chain (`/pm/markets` or polling flows) and/or call **`create-market`** on-chain subject to DAO rules.
- Pay optional **creation fee** (STX) when configured and not waived for resolution agent.
- Provide initial liquidity subject to **`token-minimum-seed`**.
- Configure per-market **`market-fee-bips`** capped by DAO max.
- Subject to **`creation-gated`** + Merkle proofs when enabled.

## 2. Liquidity providers (AMM path)

- Supply liquidity on **`MECHANISM_AMM`** markets; accrue **`accumulated-lp-fees`**; withdraw via **`remove-liquidity`** / **`claim-lp-fees`** paths defined in `bme024-0-market-predicting.clar`.

[PLACEHOLDER — CONFIRM WITH TEAM] UI workflows, impermanent loss disclosure, and whether LPs must be DAO-allowlisted.

## 3. Forecasters / traders

- Deposit collateral into **`bme050-0-vault`**.
- Acquire outcome exposure via on-chain swaps / predict flows; optionally interact with **[PLACEHOLDER — CLOB]** if/when routed off-chain first per `CLAUDE.md`.
- **Dispute:** Stakers meeting contract checks may open disputes within the configured window (`bme021` integration).

## 4. DAO governors / protocol operators

- Control extensions via DAO proposals (`set-allowed-token`, fee params, gated creation, hedge strategy flags, dispute window length, resolution agent wiring).
- **Resolution team** members authorised in `bme008-0-resolution-coordinator` who can **`signal-resolution`** (may include automated signer key used by API — **[PLACEHOLDER — CONFIRM WITH TEAM]** custody of `walletKey` in `apps/api-v1`).
- Coordinators triggering DAO event scans (`daoEventRoutes.ts` checks against configured coordinator addresses).

## 5. Reputation participants

- Receive **`bigr-token`** mints tied to documented actions (e.g. market creation mint in `bme024` path).

[PLACEHOLDER — CONFIRM WITH TEAM] Moderators, multisig composition, incident response roster, support vs protocol roles.
