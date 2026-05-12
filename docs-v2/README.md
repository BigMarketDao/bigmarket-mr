# docs-v2 — UI refactor design pack (for review only)

Hi Mike — this folder is a **small set of design documents** I prepared to align on the visual direction before I start touching UI code on this branch.

**Nothing in this commit changes product code.** It is documentation only, intended as optional reading if you want to review the direction. I kept the broader internal operating notes (prompt scripts, audit reports, research dumps) out of the repo on purpose so this PR stays small.

## What's in this folder

| File | What it is | Length |
|------|-----------|--------|
| [`README.md`](./README.md) | This overview | short |
| [`ui-system.md`](./ui-system.md) | Architecture boundaries only: `bm-ui` (presentation) vs `apps/frontend-c1` (composition + logic) | short |
| [`design/README.md`](./design/README.md) | Index of the design docs and the "single source of truth" rule | short |
| [`design/design-philosophy.md`](./design/design-philosophy.md) | Positioning and voice: why Skeleton `nouveau`, what "professional but approachable" means concretely, anti-patterns to avoid | medium |
| [`design/styling-contract.md`](./design/styling-contract.md) | Rules of usage: token tier model, naming contract, dark-mode requirement, migration guardrails | medium |
| [`design/bm-semantic-tokens-proposal.md`](./design/bm-semantic-tokens-proposal.md) | Semantic token inventory (roles, domain tokens, chart tokens, outcome slots), each row marked Implemented or Next wave | medium |
| [`design/skeleton-theme-nouveau.md`](./design/skeleton-theme-nouveau.md) | Visual baseline: palette, fonts, radius base, text scaling, chart-library decision, mapping to our semantic aliases | short |

## How to read it (if you want to)

- **5-minute version:** `design/design-philosophy.md` + `design/skeleton-theme-nouveau.md`.
- **15-minute version:** add `design/styling-contract.md` and `design/bm-semantic-tokens-proposal.md`.
- **Everything:** the table above, top to bottom.

## What this is *not*

- Not a token implementation. The token values in `packages/bm-design/src/theme.css` / `tokens.ts` are still authoritative for what the build actually runs.
- Not a full design system rollout plan. The plan exists locally and will land in follow-up PRs as concrete code changes.
- Not asking for approval to merge if you do not have time — happy for this to sit as reference.

## Primary goal of the refactor

A visibly more professional, pixel-perfect prediction-market UI. Tokens and primitives are the foundation, not the result. All later commits will translate these documents into concrete visual upgrades, with strict guardrails against changing any behavior.

## Hard guardrail for every later refactor commit

Do not change behavior.

- **Allowed:** HTML structure, CSS classes, layout, semantic tokens, visual states, accessibility attributes.
- **Forbidden:** edits to business logic, stores, SDK calls, API calls, routing, contracts, data shapes, or event-handler semantics.
- Dark-mode parity is mandatory for every change.
