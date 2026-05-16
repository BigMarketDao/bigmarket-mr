# Audit prompt — does `docs-v2/` give us enough to build an amazing prediction-market UI?

Paste the block below into a senior agent (Claude / Cursor / o1-class). It is a **read-only audit** that compares what `docs-v2/` already covers against what is actually required to deliver a visibly more professional, pixel-perfect prediction-market product. The output is a **gap report** — not a refactor.

Do **not** modify `docs-v2/` while running this audit. Capture the gaps, then decide separately whether each one becomes a new doc, a new section, a token addition, or a deferred decision.

---

## How to use

1. Open this repo workspace in your agent.
2. Paste the prompt block (below) verbatim.
3. The agent will produce a structured Markdown report. Save it as `docs-v2/audit-report.md` (or as a PR comment).
4. Review the gaps; only then decide if/how each one lands in `docs-v2/`.

---

## Prompt (copy from here to the end of file)

```text
You are a senior staff engineer, a design-system lead, and a product-design auditor for a Web3 prediction market.

## Your job
Audit the `docs-v2/` pack in this repository. Decide whether it gives an AI agent and a small team enough information to deliver a visibly more professional, pixel-perfect prediction-market UI on the level of Polymarket / Kalshi — not just "better tokens".

Produce a single Markdown report (no code changes). The report must call out exactly what is missing, what is too thin, and what is solid enough to ship.

## Read first (in this order)
1. `docs-v2/README.md`
2. `docs-v2/sources-of-truth.md`
3. `docs-v2/design/README.md`
4. `docs-v2/design/styling-contract.md`
5. `docs-v2/design/bm-semantic-tokens-proposal.md`
6. `docs-v2/design/skeleton-theme-nouveau.md`
7. `docs-v2/ui-system.md`
8. `docs-v2/PROMPTS.md`
9. `docs-v2/design/polymarket-ui-audit.md`

Then verify implementation against:
- `packages/bm-design/src/theme.css`
- `packages/bm-design/src/tokens.ts`
- `packages/bm-design/src/vendor/skeleton-nouveau.css`
- `apps/frontend-c1/src/routes/layout.css`
- `apps/frontend-c1/src/routes/+layout.svelte`
- A representative subset of files in: `apps/frontend-c1/src/lib/components/`, `packages/bm-ui/src/`, `packages/bm-market-homepage/src/`, `packages/bm-market/src/`, `packages/bm-create-market/src/`.

You may use `Grep` / `Glob` / `Read` only. Do not edit anything.

## Definition of "amazing prediction-market UI"
A user landing on the app should immediately perceive:
- A confident visual hierarchy (clear primary action, scannable density).
- Reliable numeric display (tabular figures, consistent currency / percent / signed-change formatting).
- Live-feeling data (price flashes, live indicators, optimistic UI cues).
- A pixel-perfect grid (consistent spacing rhythm, radii, borders, shadows).
- A trust signal (clean wallet/connect flow, safe destructive confirmations, status legibility).
- Dark and light parity on every surface.
- Accessible interactions (visible focus rings, keyboard reachability, contrast).

Your audit must measure docs-v2 against that bar, not against a generic "design system" bar.

## Audit checklist (go through every section)

For each item, output one of:
- **Covered** — the docs explicitly answer this and the implementation is wired.
- **Thin** — mentioned but lacks measurable values, examples, or wiring.
- **Missing** — not in docs-v2 at all (and not deferrable to a later wave without risking the visual goal).
- **Deferrable** — legitimately optional; explain why.

Always cite the file and section that justifies the verdict.

### A. Foundation (color, typography, spacing, radius, shadow, motion, density)
- Color: are all surface levels (`background`, `card`, `popover`, `muted`, `overlay`) defined and wired?
- Color: status quad (`success`, `warning`, `info`, `destructive`, `accent`) with `* / *-foreground / *-soft / *-border` — wired vs proposed?
- Color: prediction domain (`price-up`, `price-down`, `price-neutral`, `live-indicator`, `selected`, `community`)?
- Color: outcome categorical series (`outcome-1..6`) and chart structure tokens?
- Typography: type scale (sizes, line-heights, weights) — explicit values for headings vs body vs label vs meta vs button vs numeric?
- Typography: **numeric/tabular figures** treatment for prices, odds, balances?
- Typography: heading font (`Bahnschrift` stack) — is the fallback acceptable on all OSes? Is there a webfont decision documented?
- Spacing: is there a *canonical spacing rhythm* (e.g. 4/8/12/16/24/32) explicit per surface kind (card padding, button padding, input padding, list-row padding, section padding)?
- Radius: tokens for input, button, card, pill, modal — each with a documented value?
- Shadow: semantic shadow tokens (card / popover / modal / focus) — exist?
- Motion: duration scale, easing scale, principles for when to animate, `prefers-reduced-motion` policy?
- Density: is there a documented density mode (compact vs comfortable) or a single density commitment?

### B. Components needed by a prediction market
For each, state Covered / Thin / Missing. Treat anything not explicitly described as missing — the bar is "an agent can build this without guessing".
- App shell: header, footer, side nav (if any), banner stripes.
- Market card — binary (Yes/No), categorical (multi-outcome), scalar/range, price-up/down.
- Market detail layout (title, KPI strip, chart area, trade widget, order book, comments).
- Trade widget: market order vs limit order, Yes/No tabs, slippage display, balance line, confirm/disabled states.
- Order book row, depth chart, spread indicator.
- Price chart: line/area chart, candlestick, mini-spark, tooltip pattern, crosshair pattern, time-range selector.
- Live indicator: pulsing dot, "live" pill, last-updated timestamp.
- Probability/outcome bar (the visual horizontal bar that shows Yes %).
- Wallet-connect modal and chain-switch flow (visual only; logic is out of scope).
- Position card, positions table, P&L coloring rules.
- Form inputs: text, number, currency, percentage, datetime; helper text, error state, required indicator, suffix/prefix.
- Buttons: primary, secondary, accent, destructive, soft, ghost, icon-only — with size scale and disabled/loading states.
- Tabs: segmented, underline, pill — when to use which.
- Badges / pills (status quad usage).
- Tables: sortable header, sticky header, row hover, row striping policy, dense vs default.
- Tooltip, popover, dropdown menu, command palette (if used).
- Modal: size variants, scroll behavior, header/footer pattern, focus trap (visual side only).
- Drawer / off-canvas (mobile filters?).
- Toast / notification system.
- Skeletons and empty states for: cards, tables, charts, lists.
- Error states: page-level, section-level, inline.
- Splash / app-loading screen.
- Pagination / infinite scroll style.
- Filter chips, search input pattern.
- Breadcrumb pattern.
- Avatar, identicon (for wallet addresses).
- Address pill / copyable hash display.
- Confirmation patterns for destructive / on-chain actions.

### C. Numeric and domain formatting (prediction-market-specific)
- Probability display format (e.g. `67¢` vs `67%` vs `0.67`) — is one chosen?
- Signed change display (`+3.4%`, `-0.8%`) — color, sign placement, arrow glyph rules?
- Currency and abbreviations (`$1.2k`, `$1.2M`) — rule documented?
- Locale / i18n posture (are we en-US only? does it matter for numbers/dates?).
- Time formatting (relative vs absolute, time-zone policy).
- Truncation rules for long addresses, market titles, outcomes.

### D. Interaction and accessibility
- Focus-visible policy (which token, on which surfaces).
- Keyboard reachability for the trade flow.
- Hit-target minimums (mobile vs desktop).
- Contrast policy (WCAG AA target, with explicit pass criteria).
- `prefers-color-scheme` vs class-based dark mode — where is `.dark` toggled? Is the toggle UI documented?
- `prefers-reduced-motion` handling.
- Screen-reader behavior for live price updates (aria-live, polite vs assertive).
- Error message tone and pattern.

### E. Responsiveness
- Breakpoints used by the app (compared to Tailwind defaults in `theme.css`).
- Mobile-first vs desktop-first commitment.
- Mobile order book, mobile trade widget, mobile market card variants documented?
- Touch target adjustments.

### F. Charts
- Library choice (proposal says "library of choice" — is one picked?).
- Whether chart code is allowed to read from CSS variables or only from `tokens.ts`.
- Crosshair, tooltip, axis label, grid token usage.
- Reduced-motion behavior on live ticks.

### G. Reference baselines
- Is there a populated Polymarket / Kalshi audit anywhere in the repo, or is it still the empty template in `docs-v2/design/polymarket-ui-audit.md`?
- Are there Figma / Sketch / reference frames documented? If yes, link; if no, flag the absence.
- Are the screenshots in `docs/design/assets/polymarket/` actually used as the visual ground truth, or are they decorative?

### H. Process, tooling, and enforcement
- Lint rules (ESLint, Tailwind classnames, no-arbitrary-values) — defined or aspirational?
- Visual regression testing (Playwright / Chromatic) — chosen or not?
- Storybook / component gallery — committed or recommended?
- Token export pipeline (Style Dictionary, custom script) — needed yet?
- Designer ↔ engineer handoff path (Figma tokens import?) — covered?
- CI guard on `gray-*` / `bg-[#…]` / Tier-1 leakage — wired, or only described in `PROMPTS.md` step 9?
- The "every change in both `theme.css` and `tokens.ts`" rule — is it enforced or only stated?

### I. Implementation drift to flag (read-only)
- Where is `tokens.ts` out of sync with `theme.css` today? Cite line-level evidence.
- Where is `+layout.svelte` still using Tier-1 utilities? List specific class names and line numbers.
- Are any `@source` paths in `apps/frontend-c1/src/routes/layout.css` referencing packages that no longer exist?
- Are there packages on disk (e.g. `sip18-forum`, `bm-market-homepage`) that are not addressed in `PROMPTS.md`?

### J. Risk surface specific to a prediction market
- Trust: how do users confirm a trade visually (the "are you sure" pattern)?
- Conflict avoidance: where does the doc explicitly forbid using `destructive` for price-down? Is the warning loud enough?
- Live-updates: does the doc address flashing/blinking and accessibility implications?
- Outcome ambiguity: when a market has 7+ outcomes, what is the rule — algorithmic colors or capped legend?
- On-chain timing: does the doc address pending-tx visual state (spinner, hash chip, polling)?

## Output format (Markdown)

```
# docs-v2 gap report

## 1. Summary verdict
One paragraph: can a careful agent ship a Polymarket-grade UI with docs-v2 alone? If no, what are the top three blockers?

## 2. Section-by-section verdicts
For each of A–J above:
### A. Foundation
| Item | Verdict | Evidence (file:lines or "not present") | Recommendation |
|------|---------|----------------------------------------|----------------|

(repeat the table for sections B through J)

## 3. Critical gaps (must add before broad rollout)
Prioritized list with exactly: title, why it blocks the visual goal, suggested doc/section to add, est. effort (S/M/L).

## 4. Important gaps (should add during the refactor, not before)
Same format.

## 5. Nice-to-have / explicitly deferrable
Same format, with the reason it can wait.

## 6. Quick wins (≤1 hour each)
Concrete, scoped edits to docs-v2 that materially raise the audit score. Each item names the file and what to add.

## 7. Implementation drift
Cited file+lines where the codebase diverges from docs-v2 today, with no action — just visibility.

## 8. Recommended next docs
A list of new doc filenames that, if added under docs-v2/, would close the most gaps. For each, one sentence on contents.
```

## Rules
- English only.
- Do not edit files. Read-only audit.
- If something is unknown (no file decides it), label it **Unknown** and name the file that would need to exist to decide.
- Do not invent repo facts. If you cannot find a token or a rule, say so.
- Prefer **measurable** verdicts ("`docs-v2/design/bm-semantic-tokens-proposal.md` lines 71-79: `success-*` proposed but not in `theme.css`") over generic design advice.
- Stay aligned with the canonical sources of truth in `docs-v2/sources-of-truth.md` §A. Do not propose anything that contradicts the behavior-preservation guardrails in `docs-v2/PROMPTS.md`.
- Aim for a report that lets a follow-up agent decide, in one pass, exactly which new docs or sections to add to `docs-v2/` — without re-reading the codebase.
```

---

## After running the prompt

- Save the agent's report as `docs-v2/audit-report.md`.
- Triage section 3 (critical gaps) into new docs or new sections in existing docs.
- Re-run the prompt after each major doc addition to keep the gap surface visible.
- The audit is **read-only by design** — if it starts proposing code changes, reject and re-run with the rules section emphasized.
