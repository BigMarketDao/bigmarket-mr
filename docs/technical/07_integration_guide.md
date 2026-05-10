# BigMarket — Integration Guide

## 1. Enterprise white-label setup

No dedicated "white-label" package was identified in this repository snapshot. Practical integration angles:

| Layer | Approach |
|-------|-----------|
| **Frontend** | SvelteKit app `apps/frontend-c1`; theme via `bm-design` tokens + Tailwind; branding/assets via deploy env. |
| **Config** | `packages/bm-common` `daoConfigStore` (+ API `config_dao`) for contract addresses/network. |
| **Contracts** | Deploy DAO + extensions via Clarinet manifests (`Clarinet-Testnet.toml`, `Clarinet-Devnet.toml`, etc.). |

[PLACEHOLDER — CONFIRM WITH TEAM] Commercial licensing, SLAs, reference deployment (hosting targets), SSO requirements.

## 2. Notification hooks

| Mechanism | Status |
|-----------|--------|
| **WebSocket** | `/bigmarket-api/ws` — handshake + broadcast utility (`wssBroadcast`); verify client protocol in production. |
| **HTTP webhooks for `market.created` / `market.resolved` / `market.disputed`** | **Not found** in Express route enumeration — **[PLACEHOLDER — CONFIRM WITH TEAM]**. |

**Workaround for integrators:** poll `GET /bigmarket-api/pm/markets` / per-market routes, or ingest Stacks events via indexer feeding `daoEventCollection`.

## 3. Data export for analytics

| Store | Typical content |
|---------|-------------------|
| **MongoDB collections** (`apps/api-v1/src/lib/data/db_models.ts`) | `daoEventCollection`, `marketCollection`, `marketLlmLogsCollection`, voting collections, reputation data, `pythEventCollection`. |

Export patterns: **[PLACEHOLDER — CONFIRM WITH TEAM]** read-only replicas, nightly ETL, warehouse schemas, GDPR deletion interplay.

## 4. Stacks / programmatic trading

Integrators should use **`@bigmarket/sdk`** (`packages/sdk`) rather than constructing raw calls ad hoc.

[PLACEHOLDER — CONFIRM WITH TEAM] Published npm scope version matrix and network compatibility.

## 5. Operational contacts

[PLACEHOLDER — CONFIRM WITH TEAM] Security disclosure email, integrations support channel, uptime page, Hiro API keys policy.
