# docs-v2 — UI refactor pack

This folder is the **canonical source of truth** for the BigMarket UI refactor that starts on the `phantom-wallet` branch.

It supersedes `docs/design/` and `docs/ui-system.md` for any new work. The old `docs/` files remain in place as history; do not edit them as authority.

## TL;DR — shipping the homepage + market detail page TODAY

If your goal is to migrate the homepage and a market-detail page right now (and defer everything else), read only these:

1. [`tokens-and-rules.lock.md`](./tokens-and-rules.lock.md) — the locked decisions (~10 min).
2. [`build-prompts/README.md`](./build-prompts/README.md) — which prompt to run, on which model, in what order.
3. Then run [`build-prompts/A-token-wiring.md`](./build-prompts/A-token-wiring.md) → [`build-prompts/B0-header-chrome.md`](./build-prompts/B0-header-chrome.md) → [`build-prompts/B-homepage.md`](./build-prompts/B-homepage.md) → [`build-prompts/C-market-detail.md`](./build-prompts/C-market-detail.md).

Total: 3 prompts, ~3 hours of agent work, mostly on cheap models. Everything else below is for deeper / later work.

## Full reading order (for the deeper refactor)

Read in this order:

1. [`current-vs-target.md`](./current-vs-target.md) — **the plain-English overview.** What the user sees today, what they should see, why it matters. Read this if you only read one doc.
2. [`sources-of-truth.md`](./sources-of-truth.md) — the evaluation report (sections A–G). It explains which doc wins for what, and what is implemented vs proposed.
3. [`design/design-philosophy.md`](./design/design-philosophy.md) — why we use Skeleton `nouveau` (not Polymarket cobalt) and what "professional but approachable" means concretely.
4. [`design/README.md`](./design/README.md) — index of canonical design docs and the single-source rule.
5. [`design/styling-contract.md`](./design/styling-contract.md) — rules of usage, tier model, naming contract, dark-mode requirement, migration guardrails.
6. [`design/bm-semantic-tokens-proposal.md`](./design/bm-semantic-tokens-proposal.md) — semantic token inventory; each row is annotated **Implemented** or **Next wave**.
7. [`design/skeleton-theme-nouveau.md`](./design/skeleton-theme-nouveau.md) — visual baseline (palette, contrast, fonts, radius base, text-scaling, chart library) and how `nouveau` is mapped into our semantic aliases.
8. [`ui-system.md`](./ui-system.md) — layer boundaries only (`bm-ui` vs app).
9. [`design/polymarket-ui-audit.md`](./design/polymarket-ui-audit.md) + [`design/polymarket-analysis.md`](./design/polymarket-analysis.md) — populated reference baseline (method + full reading).
10. [`audit-report.md`](./audit-report.md) — read-only gap audit against the "amazing prediction-market UI" bar.
11. [`PROMPTS.md`](./PROMPTS.md) — the executable, dependency-ordered checklist that drives **token / chrome refactor** commits.
12. [`section-by-section-prompts.md`](./section-by-section-prompts.md) — the executable, **one-section-at-a-time** prompt set that closes the audit gaps (component specs, formatting, motion, a11y, etc.) without overwhelming the agent.
13. [`tokens-and-rules.lock.md`](./tokens-and-rules.lock.md) — **locked** token values + numeric / motion / a11y rules used by the build prompts in `build-prompts/`.
14. [`build-prompts/`](./build-prompts/) — three pragmatic, self-contained prompts (A: token wires, B: homepage, C: market detail) for the fastest ship-it-today path.

## Single-source rule (top-level)

If two sources disagree:

1. `design/styling-contract.md` wins for **process and rules**.
2. `design/bm-semantic-tokens-proposal.md` wins for **naming and inventory**.
3. `packages/bm-design/src/theme.css` wins for **runtime implementation values** (it drives Tailwind v4 classes).
4. `packages/bm-design/src/tokens.ts` is the **TypeScript mirror** of `theme.css` and must be kept in lock-step (consumed only by JS — charts, inline styles, API payloads).

If a doc disagrees with `theme.css`:
- For **naming/role** disagreements → the doc wins; update code to match.
- For **value/wiring** disagreements → `theme.css` wins; update the doc and `tokens.ts` to match.

## Primary goal of the refactor

A visibly more professional, pixel-perfect prediction-market UI. Tokens and primitives are the foundation, not the result. Every step in `PROMPTS.md` must serve a concrete visual upgrade.

## Hard guardrail for every refactor step

Do not change behavior.

- **Allowed:** HTML structure, CSS classes, layout, semantic tokens, visual states, accessibility attributes (`aria-*`, `role`, focus targets).
- **Forbidden:** edits to `.ts` business logic, Svelte `<script>` bodies that own state, stores, SDK calls, API calls, routing, contracts, data shapes, or event-handler semantics.
- If a component mixes logic and presentation, only the presentation half may change.
- If a visual change requires a logic change, **stop and flag it** — do not refactor silently.
- Dark-mode parity is mandatory for every change.
