# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BigMarket is a DAO-governed prediction market on Stacks (Clarity). It uses a hybrid CPMM + LP architecture.

## Commands

### Root (runs across all packages)

```bash
pnpm dev          # Start frontend-c1 dev server
pnpm dev-api      # Start API dev server
pnpm build        # Build all packages
pnpm lint         # Lint all packages
pnpm test         # Test all packages
pnpm typecheck    # Type-check all packages
pnpm clean        # Remove all build artifacts
```

### Frontend (`apps/frontend-c1`)

```bash
pnpm dev          # Vite dev server (port 8081)
pnpm build        # Production build
pnpm check        # SvelteKit type check
pnpm test         # Vitest (runs once)
pnpm test:unit    # Vitest (watch mode)
pnpm lint         # ESLint + Prettier
pnpm format       # Prettier format
```

Run a single test file:

```bash
pnpm test src/lib/path/to/file.test.ts
```

### API (`apps/api-v1`)

```bash
pnpm dev          # tsx + nodemon, watches src/**/*.ts
pnpm build        # tsc → dist/
pnpm start        # Run compiled dist/app.js
```

### Smart Contracts (`contracts/stacks/bigmarket-dao`)

```bash
npm test          # Vitest + Clarinet SDK
npm run watch     # Watch mode
npm run test:report  # With coverage + cost reporting

clarinet check    # Syntax/type check contracts
clarinet devnet start
```

Property-based fuzzing:

```bash
npx rv . bme024-0-market-predicting test
npx rv . bme030-0-reputation-token invariant --runs 6000
```

### Scoped package commands

```bash
pnpm --filter @bigmarket/sdk build
pnpm --filter @bigmarket/bm-ui typecheck
```

## Architecture

### Layers

**Clarity contracts** (`contracts/stacks/bigmarket-dao/contracts/`)  
Custody, market state, settlement, resolution. Key contracts: `bigmarket-dao.clar`, `bme024-0-market-predicting/bme024-0-market-scalar-pyth` (CPMM curve), `bme030-0-reputation-token`.

**TypeScript SDK** (`packages/sdk/`)  
Typed wrappers around Stacks.js for contract calls. Structured as `chains/`, `wallet/`, `internal/`. All contract interaction goes through here.

**SvelteKit frontend** (`apps/frontend-c1/`)  
Svelte 5 runes mode. Routes in `src/routes/`, business logic in `src/lib/core/`, global state in `src/lib/stores/` (local-storage backed).

**Shared packages**

- `bm-ui` — presentation-only Svelte components; no logic, no API calls, no stores
- `bm-types` — shared TypeScript types
- `bm-common` — shared utilities and stores
- `bm-design` — design tokens consumed by Tailwind
- `bm-config` — configuration helpers

## Development Rules

1. **Start from use cases** — new features trace to `/docs/use-cases/`. Do not build contracts or components without a corresponding use case.
2. **Build vertical slices** — each slice includes minimal frontend + API + contract, is deployable and testable before expanding.
3. **Push complexity off-chain** — keep contracts minimal; matching logic lives in the API.
4. **`bm-ui` is presentation-only** — no business logic, no API calls, no stores. Pass everything via props.
5. **Keep logic out of routes** — use `/lib` for business logic in both frontend and API.

## Critical Invariants

- Funds must always be conserved (no creation or destruction)
- No double settlement
- Orders cannot execute twice
- Resolution is final after lock

## Environment

- **Node.js**: ≥20.0.0, **pnpm**: 10.33.0
- **Clarinet CLI** required for contract work (`brew install clarinet`)
- MongoDB connection configured via env vars: `{network}_sui_mongoDbUrl`, `{network}_sui_mongoDbName`, `{network}_sui_mongoUser`, `{network}_sui_mongoPwd` (networks: devnet, testnet, mainnet)
- Frontend network config lives in `packages/bm-common/src/lib/config.ts` (`daoConfigStore`)
- For devnet runs, clear MongoDB collections (`marketCollection`, `daoEventCollection`, `marketGatingCollection`) before starting
