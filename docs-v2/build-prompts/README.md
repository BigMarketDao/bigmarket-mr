# Build prompts — the cheap, fast path

This folder holds the **self-contained prompts** that, together with `../tokens-and-rules.lock.md`, are enough to migrate BigMarket's UI to the new design system one slice at a time. Nothing else from `docs-v2/` is required to execute them — every value, rule, and constraint is inlined.

## Read order (mandatory, but short)

1. [`../tokens-and-rules.lock.md`](../tokens-and-rules.lock.md) — locked decisions (tokens, numeric rules, motion, a11y). One read; ~10 minutes.

## Run order (current — May 2026)

| Step | Prompt | Recommended model | What it does | Time |
|---|---|---|---|---|
| 0 | [`0-pre-run-audit.md`](./0-pre-run-audit.md) | **Claude Code** (read-only) | Audits Prompts A / B0 / B / C against the actual codebase. Finds critical flaws, proposes concrete fix patches. **No files are modified.** Run this BEFORE the build prompts so the build runs are free of surprises. | 20–40 min |
| 1 | [`A-token-wires.md`](./A-token-wires.md) | **Cursor Auto / Composer** | Adds Wave 1 + minimum Wave 2 + domain + outcome tokens to `theme.css`, mirrors them in `tokens.ts`, lands the reduced-motion guard. 3 files, no behavior change. | 20–30 min |
| 2 | [`B0-header.md`](./B0-header.md) | **Claude Code** (HeaderMenuTailwind is ~375 lines) | **Conservative first build slice** — app chrome only (header, banners, footer, splash, empty-state, `bm-ui` Card + Button leakage). Smallest possible visible payoff that proves the pipeline. | 40–60 min |
| 3 | [`B-homepage.md`](./B-homepage.md) | **Claude Code** | Full homepage migration — market cards, leaderboard, gauges, comments, category chips, `format-extras.ts`. Larger and louder than B0. | 60–90 min |
| 4 | [`C-market-detail.md`](./C-market-detail.md) | **Claude Code** | Market detail page — two-column grid, sticky trade widget, collapsed order book, KPI strip, time-range tabs visual, MarketStaking chrome sweep. | 60–90 min |

**Order rule:** 0 → 1 → 2 are sequential. After 2 lands, 3 and 4 can run in either order (both depend only on 1, plus the `bm-ui` Card/Button fixes from 2).

## Why B0 (Header-first) instead of jumping straight to B (Homepage)

The original plan was Prompt A → Prompt B (full homepage in one shot). That covers ~8 components and ~700 lines of class migration in a single PR — review is hard, visual regressions are slow to bisect, and any one bug in `MarketEntry.svelte` or `LeaderBoardDisplay.svelte` blocks the merge.

B0 is the smallest *visible* slice possible:

- 5 chrome files (app.html splash, HeaderMenuTailwind, ReputationCommunityBanner, Footer, +page.svelte empty-state branch).
- 2 `bm-ui` Tier-1 leakage fixes (Card + Button) that **unblock both B and C** by making those primitives token-correct.

Land B0, ship it to your CTO with screenshots, take the win, then queue B and C with confidence in the pipeline.

## Why the pre-run audit (step 0)

Build Prompts A, B, B0, C have all gone through several edits. Even with care, drift accumulates — a token name in Prompt B might assume a different value than Prompt A lands, a Task in Prompt C might reference a file structure that no longer matches. Running Claude Code in read-only audit mode for 30 minutes against the actual codebase + the actual prompt text catches those before the build agent silently does the wrong thing.

The audit produces a **structured report with proposed fix patches**. You review, accept what you want, apply manually (or via a follow-up "apply the audit fixes" prompt), then proceed to step 1.

## When to escalate to the long version

Switch back to [`../section-by-section-prompts.md`](../section-by-section-prompts.md) when you need any of these — they are **not** covered by the four build prompts here:

- Trade widget redesign (Buy/Sell tabs, quick chips, plain-English copy, pre-flight modal). → §4.
- Real order-book vs recent-trades decision and implementation. → §6.
- Wallet modal welcome shape. → §10.
- Chart structure tokens (`chart-grid`, `chart-axis`, etc.) and series wiring. → §13.
- Toast / notification redesign. → §16.
- Six-variant Button (adding `tertiary` + `soft`). → §11.
- Numeric `format-extras` test suite. → §3 (post-ship).

## After 0 → 1 → 2 ship

You'll have:
- A complete token system in `theme.css` + `tokens.ts`.
- A working `prefers-reduced-motion` guard.
- A token-correct header, banners, footer, splash, and `bm-ui` Card / Button.
- Zero new behavior, zero new dependencies, zero `<script>` mutations (except 3 class-name string constants in HeaderMenuTailwind).

That's a clean foundation commit story for the team. Everything that comes after (B, C, then the long section-by-section list) is now a controlled visual upgrade per slice, not a refactor leap.
