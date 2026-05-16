# Design docs (docs-v2)

Use this folder as the entrypoint before executing UI-refactor prompts.

## Canonical docs (source of truth)

1. [`styling-contract.md`](./styling-contract.md) — Rules of usage, tier model (Tier 1/2/3), naming contract, migration guardrails, dark-mode requirement.
2. [`bm-semantic-tokens-proposal.md`](./bm-semantic-tokens-proposal.md) — Semantic token inventory (roles, domain tokens, chart tokens, outcome slots). Each row is annotated **Implemented** or **Next wave**.
3. [`skeleton-theme-nouveau.md`](./skeleton-theme-nouveau.md) — Visual baseline and mapping to Skeleton `nouveau` primitives + chart library decision.
4. [`design-philosophy.md`](./design-philosophy.md) — **Positioning + voice + register.** "Why Nouveau, not Polymarket cobalt", what "professional but approachable" concretely means, anti-patterns we disavow.

## Supporting docs (measured reference)

5. [`polymarket-ui-audit.md`](./polymarket-ui-audit.md) — Audit method **plus the populated summary** (`Heading hierarchy / Cards / CTA / KPI / Dark vs light` decisions).
6. [`polymarket-analysis.md`](./polymarket-analysis.md) — Full reading of measured CSS + screenshots; "Polymarket pattern → BigMarket adaptation" tables.
7. [`polymarket-research/`](./polymarket-research/) — Raw HTML + 4 CSS bundles fetched from polymarket.com + curated extracts (tokens, scales, animations). **Reference only; not a token source.**

## Single-source rule

If two sources disagree:

1. `styling-contract.md` wins for **process and rules**.
2. `bm-semantic-tokens-proposal.md` wins for **naming and inventory**.
3. `packages/bm-design/src/theme.css` wins for **runtime implementation values** (it drives Tailwind v4 classes).
4. `packages/bm-design/src/tokens.ts` is the **TypeScript mirror** and must be kept in lock-step.

If a doc disagrees with `theme.css`:

- **Naming/role** disagreement → the doc wins; update code.
- **Value/wiring** disagreement → `theme.css` wins; update doc + `tokens.ts`.

## Note on legacy docs

`docs/design/` and `docs/ui-system.md` remain on disk as history. **Do not edit them as authority.** Anything new lives here in `docs-v2/`.
