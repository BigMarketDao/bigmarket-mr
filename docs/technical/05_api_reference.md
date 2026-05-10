# BigMarket — API Reference (`apps/api-v1`)

**Base URL (examples from `app.ts` CORS config):** `https://api.testnet.bigmarket.ai`, or local `http://localhost:{PORT}` — default **`PORT`** from env or **3020**.

**Global prefix:** many routes mount under **`/bigmarket-api/...`**; health under **`/health`**.

## 1. Authentication

| Area | Mechanism |
|------|-----------|
| **Google OAuth helpers** | `GET /bigmarket-api/jwt/auth-url/:nonce`, `GET /bigmarket-api/jwt/token/verify` (OAuth code exchange → redirect with access token). |
| **Auth module** | `POST /bigmarket-api/auth/token`, `POST /bigmarket-api/auth/refresh`, `POST /bigmarket-api/auth/logout`; zkTLS **`/auth/reclaim/*`**; **`GET /auth/oauth/google/*`**; **`GET /auth/me`** requires `requireAuth`. |

[PLACEHOLDER — CONFIRM WITH TEAM] JWT format, expiry, scopes, rate limits, and which routes enforce auth vs public read.

## 2. Prediction markets (`/bigmarket-api/pm`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/market-dao-data` | Cached DAO + contract overview for UI |
| POST | `/markets` | Store new market poll template |
| GET | `/tokens/liquidity/:token` | Min seed liquidity (scalar vs categorical reads) |
| GET | `/markets/leader-board` | Leader board |
| GET | `/markets/allowed-tokens` | Allowed tokens (default market type 1) |
| GET | `/markets/allowed-tokens/:marketType` | Allowed tokens per market type |
| GET | `/markets/categories` | Active categories |
| GET | `/markets/votes/:marketId/:marketType` | Market votes payload |
| GET | `/markets` | List markets |
| GET | `/markets/:marketId/:marketType` | Single market |
| GET | `/claims/:marketId/:marketType` | Claims data |
| GET | `/stakes/:marketId/:marketType` | Stakes data |
| GET | `/count/markets` | Count of indexed markets |

## 3. Polling (`/bigmarket-api/polling`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/polls` | Save poll template |
| GET | `/polls` | List polls |
| GET | `/polls/:hash` | Poll by hash |
| POST | `/sip18-votes/:pollVoteObjectHash` | Submit signed SIP-018 poll vote |
| GET | `/sip18-votes/:hash` | Unprocessed SIP-018 messages |

## 4. DAO (`/bigmarket-api/dao/...`)

- **Events:** `dao/events` routes (manual refresh triggers for coordinators).
- **Proposals:** `dao/proposals`.
- **Voters:** `dao/voter`.
- **SIP-018 voting helpers:** `/dao/sip18-voting/votes/...`.
- **Token sale:** `/dao/token-sale`.

[PLACEHOLDER — CONFIRM WITH TEAM] Full OpenAPI / request body schemas (`StoredOpinionPoll`, etc.).

## 5. Other notable routes

| Prefix | Purpose |
|--------|---------|
| `/bigmarket-api/gating` | Merkle gating helpers |
| `/bigmarket-api/exchange` | Exchange rates |
| `/bigmarket-api/oracle` | Pyth/oracle helpers |
| `/bigmarket-api/agent` | Resolution sweeps (`/resolve-markets/...`), market creation helpers |
| `/bigmarket-api/reputation` | Reputation + batch jobs |
| `/bigmarket-api/disputes` | Reads dispute/vote aggregates (`disputeRoutes.ts` / voter helpers) |
| `/bigmarket-api/transactions` | Transaction helpers |
| `/bigmarket-api/images` | Image routes |

## 6. WebSocket

- **`/bigmarket-api/ws` upgrade**: server emits `{ type: 'connected', message: 'WebSocket ready for tx updates' }`; broadcast helper `wssBroadcast` in `apps/api-v1/src/lib/websockets/init.ts`.

[PLACEHOLDER — CONFIRM WITH TEAM] Event taxonomy (market created/resolved/disputed). **There is no dedicated HTTP webhooks subsystem** surfaced in `app.ts` route list.

## 7. Outbound integrations (resolver)

- **`llmServer`** HTTP POST **`/resolve-market`** for categorical resolution (`resolver-helper.ts`).

## 8. Background jobs

- DAO event scanners (network-dependent), exchange rate refresh, **market resolution cron** (`initResolveMarketsJob` **every 20 minutes**), **undisputed scalar finalisation** (`initResolveUndisputedMarketsJob` hourly at :30), reputation batch sweep, UI cache warming.

[PLACEHOLDER — CONFIRM WITH TEAM] SLA targets and monitoring.
