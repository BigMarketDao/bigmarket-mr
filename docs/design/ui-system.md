# BigMarket UI system (architecture scope)

This document defines **layer boundaries** only.

For styling and token rules, use the canonical design docs:

- [`design/styling-contract.md`](./design/styling-contract.md)
- [`design/bm-semantic-tokens-proposal.md`](./design/bm-semantic-tokens-proposal.md)
- [`design/skeleton-theme-nouveau.md`](./design/skeleton-theme-nouveau.md)
- [`design/polymarket-ui-audit.md`](./design/polymarket-ui-audit.md) (supporting, method only)

## 1. Layer boundaries

### `packages/bm-ui` (presentation-only)

- Reusable visual primitives and composed UI blocks.
- No API calls.
- No DAO / business logic.
- No direct app-store coupling.
- Inputs via props / events / slots only.

### `apps/frontend-c1` (composition + behavior)

- Composes `bm-ui` components into feature flows.
- Owns route-level behavior, stores, SDK / API orchestration, and domain logic.

## 2. Component rules

- Prefer small composable primitives.
- Keep variants explicit and shallow.
- Use slots for composition instead of hard-coded domain copy / layout.
- Keep naming generic in `bm-ui`; domain-specific naming belongs in app code.

## 3. Reactivity rules

- Use Svelte 5 runes in app and packages where relevant.
- UI components accept state via props; they should not own global product state.

## 4. Canonical styling ownership

Do not duplicate token / styling contracts in this file.

- Source of truth for theme / token values:
  - `packages/bm-design/src/theme.css` (runtime — drives Tailwind v4 classes)
  - `packages/bm-design/src/tokens.ts` (TS mirror — charts, inline styles)
- Contract and migration rules:
  - [`design/styling-contract.md`](./design/styling-contract.md)

## 5. Guiding principle

If a component knows about DAO, wallet, market settlement, or API orchestration, it belongs in `apps/` or feature packages — **not** in `bm-ui`.
