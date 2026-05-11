# BigMarket UI System (Architecture Scope)

This document defines **layer boundaries** only.

For styling and token rules, use canonical design docs:

- `docs/design/styling-contract.md`
- `docs/design/bm-semantic-tokens-proposal.md`
- `docs/design/skeleton-theme-nouveau.md`
- `docs/design/polymarket-ui-audit.md`

## 1) Layer boundaries

### `packages/bm-ui` (presentation-only)

- Reusable visual primitives and composed UI blocks.
- No API calls.
- No DAO/business logic.
- No direct app-store coupling.
- Inputs via props/events/slots only.

### `apps/frontend-c1` (composition + behavior)

- Composes `bm-ui` components into feature flows.
- Owns route-level behavior, stores, SDK/API orchestration, and domain logic.

## 2) Component rules

- Prefer small composable primitives.
- Keep variants explicit and shallow.
- Use slots for composition instead of hardcoded domain copy/layout.
- Keep naming generic in `bm-ui`; domain-specific naming belongs in app code.

## 3) Reactivity rules

- Use Svelte 5 runes in app and packages where relevant.
- UI components accept state via props; they should not own global product state.

## 4) Canonical styling ownership

Do not duplicate token/styling contracts in this file.

- Source of truth for theme/token values:
  - `packages/bm-design/src/theme.css`
  - `packages/bm-design/src/tokens.ts`
- Contract and migration rules:
  - `docs/design/styling-contract.md`

## 5) Guiding principle

If a component knows about DAO, wallet, market settlement, or API orchestration, it belongs in app/features, not in `bm-ui`.
