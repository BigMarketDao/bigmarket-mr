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
Custody, market state, settlement, resolution. Key contracts: `bigmarket-dao.clar`, `bme024-0-market-predicting` (CPMM curve), `bme030-0-reputation-token`.

**TypeScript SDK** (`packages/sdk/`)  
Typed wrappers around Stacks.js for contract calls. Structured as `chains/`, `wallet/`, `internal/`. All contract interaction goes through here.

**Express API** (`apps/api-v1/src/`)  
Order book (CLOB), matching engine, indexing, price discovery. MongoDB-backed. Routes: dao events, prediction markets, JWT auth, polling, gating (merkle proofs), reputation.

**SvelteKit frontend** (`apps/frontend-c1/`)  
Svelte 5 runes mode. Routes in `src/routes/`, business logic in `src/lib/core/`, global state in `src/lib/stores/` (local-storage backed).

**Shared packages**

- `bm-ui` — presentation-only Svelte components; no logic, no API calls, no stores
- `bm-types` — shared TypeScript types
- `bm-common` — shared utilities and stores
- `bm-design` — design tokens consumed by Tailwind (`theme.css` + `tokens.ts`; keep in sync)
- `bm-config` — configuration helpers

### Vault Model

The vault contract custodies all user funds. Users deposit SIP-010 tokens; balances are tracked as `total = available + reserved`. Funds move to "reserved" when allocated to markets, "available" when withdrawable. **Never bypass the vault for fund movement.**

### Hybrid Execution

Routing: try CLOB first (if matching limit orders exist), otherwise fall back to FPMM. FPMM provides continuous liquidity for long-tail markets; CLOB serves active markets with tighter spreads.

## Documentation & external references

### In-repo design / UI docs

| Doc | Role |
|-----|------|
| [`docs/design/styling-contract.md`](docs/design/styling-contract.md) | **Contract** for how we add styles (semantic tokens first, token sync, rollout order). |
| [`docs/design/bm-semantic-tokens-proposal.md`](docs/design/bm-semantic-tokens-proposal.md) | Proposed semantic token names (extend `bm-design`). |
| [`docs/design/polymarket-ui-audit.md`](docs/design/polymarket-ui-audit.md) | Prompt + workflow to audit reference UI (screenshots + DevTools CSS); paste AI output there. |
| [`docs/ui-system.md`](docs/ui-system.md) | UI architecture (`bm-ui`, Tailwind, layering). |
| [`docs/technical/08_ui_element_analysis.md`](docs/technical/08_ui_element_analysis.md) | Page-by-page checklist for token cleanup; **verify stack table** when deps change (e.g. Skeleton in `bm-ui`). |

### Framework versions (frontend-c1 — check `package.json` if upgrading)

| Tool | Typical constraint |
|------|---------------------|
| **SvelteKit** | `^2.57.x` — [SvelteKit docs](https://kit.svelte.dev/docs) |
| **Svelte** | `^5.55.x` (runes) — [Svelte 5 docs](https://svelte.dev/docs/svelte/overview) |
| **Tailwind CSS** | `^4.2.x` — [Tailwind v4 docs](https://tailwindcss.com/docs) |
| **Vite** | `^8.x` |

### Official docs (bookmark)

- Tailwind CSS: https://tailwindcss.com/docs  
- SvelteKit: https://kit.svelte.dev/docs  
- Svelte: https://svelte.dev/docs  

## Design-system rollout (for Claude / contributors)

When doing a **visual / token** pass:

1. **Analyze** — Follow [`docs/design/polymarket-ui-audit.md`](docs/design/polymarket-ui-audit.md) (or equivalent audit): screenshots + browser **computed styles** / `:root` CSS variables where possible; produce structured Markdown.
2. **Groundwork** — Update [`packages/bm-design/src/theme.css`](packages/bm-design/src/theme.css) (`@theme`) and [`packages/bm-design/src/tokens.ts`](packages/bm-design/src/tokens.ts) **together**; align names with [`docs/design/bm-semantic-tokens-proposal.md`](docs/design/bm-semantic-tokens-proposal.md).
3. **Contract** — Obey [`docs/design/styling-contract.md`](docs/design/styling-contract.md) so future changes stay consistent.
4. **Proof** — Land **one vertical UI slice** (e.g. **app shell / header**) using the new semantics end-to-end to validate the pipeline.
5. **Cleanup** — Migrate **one component or route area at a time**; track progress in [`docs/technical/08_ui_element_analysis.md`](docs/technical/08_ui_element_analysis.md) where helpful.

**Legacy / to migrate:** `packages/sip18-forum` was cleaned of Daisy-only utilities; it may still use ad-hoc Tailwind colors — treat as a **separate pass** to align with `bm-design`. Do not reintroduce DaisyUI.

## Development Rules

1. **Start from use cases** — every feature traces to `/docs/use-cases/`. Do not build contracts or components without a corresponding use case.
2. **Build vertical slices** — each slice includes minimal frontend + API + contract, is deployable and testable before expanding.
3. **Push complexity off-chain** — keep contracts minimal; matching logic lives in the API.
4. **`bm-ui` is presentation-only** — no business logic, no API calls, no stores. Pass everything via props.
5. **Keep logic out of routes** — use `/lib` for business logic in both frontend and API.
6. **Styling** — follow [`docs/design/styling-contract.md`](docs/design/styling-contract.md); prefer semantic tokens from `bm-design` over raw palette classes in product UI.

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
