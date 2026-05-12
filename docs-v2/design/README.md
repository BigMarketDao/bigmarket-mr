# Design docs (docs-v2/design)

Canonical design contracts for the BigMarket UI refactor. Read these before changing any UI in `packages/bm-ui` or `apps/frontend-c1`.

## Canonical docs (source of truth)

1. [`styling-contract.md`](./styling-contract.md) — Rules of usage, tier model (Tier 1 / 2 / 3), naming contract, migration guardrails, dark-mode requirement.
2. [`bm-semantic-tokens-proposal.md`](./bm-semantic-tokens-proposal.md) — Semantic token inventory (roles, domain tokens, chart tokens, outcome slots). Each row is annotated **Implemented** or **Next wave**.
3. [`skeleton-theme-nouveau.md`](./skeleton-theme-nouveau.md) — Visual baseline and mapping to Skeleton `nouveau` primitives + chart-library decision.
4. [`design-philosophy.md`](./design-philosophy.md) — **Positioning + voice + register.** Why Nouveau (not Polymarket cobalt), what "professional but approachable" concretely means, anti-patterns to avoid.

## Single-source rule

If two sources disagree:

1. `styling-contract.md` wins for **process and rules**.
2. `bm-semantic-tokens-proposal.md` wins for **naming and inventory**.
3. `packages/bm-design/src/theme.css` wins for **runtime implementation values** (it drives Tailwind v4 classes).
4. `packages/bm-design/src/tokens.ts` is the **TypeScript mirror** of `theme.css` and must be kept in lock-step.

If a doc disagrees with `theme.css`:

- **Naming / role** disagreement → the doc wins; update code.
- **Value / wiring** disagreement → `theme.css` wins; update the doc and `tokens.ts`.
