# BigMarket Monorepo

## Apps
- `apps/bigmarket-ui` — main BigMarket frontend
- `apps/client1-ui` — white-label frontend for client 1
- `apps/api` — shared backend/API layer
- `apps/matcher` — off-chain order matching engine
- `apps/settler` — settlement service for matched orders
- `apps/indexer` — chain/indexing service

## Packages
- `packages/ui` — reusable UI system
- `packages/sdk` — shared SDK for apps/services
- `packages/protocol` — shared market/order/intent logic
- `packages/types` — canonical TS types
- `packages/schemas` — runtime schemas/validation
- `packages/chain-adapters` — per-chain integration logic
- `packages/forum` — SIP-018 forum package
- `packages/forum-types` — forum types
- `packages/config` — app/client config
- `packages/contracts` — DAO + settlement contracts
