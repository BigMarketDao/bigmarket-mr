# Section-by-section build-out prompts

**Purpose.** Close the gaps from [`audit-report.md`](./audit-report.md) one section at a time. **Each numbered prompt is self-contained** — paste it into a fresh agent session, the agent has everything it needs (reading list, output schema, length budget, constraints, verification). You should not have to give context twice.

**This file is not a replacement for `PROMPTS.md`.** `PROMPTS.md` drives the **token + chrome code refactor** (Steps 1–9). This file drives the **docs + component-spec backlog** that closes the audit gaps. The two run in parallel:

- Code refactor stream → `PROMPTS.md` Steps 1 → 9.
- Doc gap closure stream → this file's prompts 1 → 23.

**Order is dependency-driven.** Prompts 1–3 unlock everything else; prompts 4–7 are foundation docs; prompts 8–21 are component specs (each depends on at least one foundation doc); prompts 22–23 are enforcement.

---

## How to use a single prompt

1. Open a fresh agent session.
2. Paste **the guardrails block** (below) + **the numbered prompt body**.
3. Let the agent produce exactly one doc (or one doc + small targeted code change if explicitly scoped).
4. Review against the **Definition of done** at the bottom of the prompt.
5. Merge as a single small commit. Move to the next prompt.

If the agent produces more than one file, asks for more scope, or starts editing business logic — **stop and re-run with the guardrails block emphasized**.

---

## Guardrails block (paste in every prompt)

```text
DO NOT change behavior.

Allowed:
- New Markdown docs under docs-v2/.
- Edits to existing docs under docs-v2/ that align with the single-source rule in docs-v2/README.md.
- Targeted code edits ONLY where the prompt explicitly scopes them (e.g. add a helper to bm-utilities/format.ts).

Forbidden:
- Edits to .ts business logic outside the explicitly scoped helper file(s).
- Svelte <script> blocks that own state, stores, or effects.
- Stores, SDK calls, API calls, routing, contracts, data shapes, or event-handler semantics.
- Introducing new dependencies (unless the prompt names the dep and version).
- Editing docs/design/ legacy files. docs-v2/ is canonical.
- Reintroducing DaisyUI utilities.

Conflict rule:
- If two docs disagree, follow the resolution rule in docs-v2/README.md "Single-source rule".
- design-philosophy.md wins for product personality / voice / register.
- styling-contract.md wins for rules of usage.
- bm-semantic-tokens-proposal.md wins for naming.
- theme.css wins for runtime values.

Output discipline:
- One doc per prompt unless the prompt explicitly requests more.
- Cite file paths with line numbers when claiming a code fact (e.g. packages/bm-ui/src/lib/components/ui/card/card.svelte:23).
- When citing Polymarket, cite docs-v2/design/polymarket-research/extracted/<file>.txt:<line> or the screenshot filename in docs/design/assets/polymarket/.
- English only. Use plain language; do not invent jargon.
- No emojis unless the doc surface already uses them.
```

---

## Prompts (run in order)

### Prompt 1 — `design/tokens-domain.md` (prediction-domain tokens)

**Why this section first.** Every component spec from prompt 8 onward consumes `price-up / price-down / price-neutral / live-indicator / selected / community / overlay`. Until they have committed values, every component decision is fiat.

**Required reading (do not read more than this):**

- [`docs-v2/design/bm-semantic-tokens-proposal.md`](./design/bm-semantic-tokens-proposal.md) §"Prediction domain" + §"Brand / community"
- [`docs-v2/design/styling-contract.md`](./design/styling-contract.md) §4 "Naming contract" (the `destructive ≠ price-down` rule)
- [`docs-v2/design/skeleton-theme-nouveau.md`](./design/skeleton-theme-nouveau.md) (so values land in the right palette family)
- [`packages/bm-design/src/vendor/skeleton-nouveau.css`](../packages/bm-design/src/vendor/skeleton-nouveau.css) — read **only** the `--color-success-*`, `--color-error-*`, `--color-tertiary-*`, `--color-surface-*` scales (search for each).
- [`docs-v2/design/polymarket-analysis.md`](./design/polymarket-analysis.md) §1.3 + §2.7 (for cross-check values; do NOT copy)

**Output:** `docs-v2/design/tokens-domain.md`, ~150 lines.

**Contents (in order):**

1. **Why a separate doc** (one paragraph, citing the styling contract's `price-down ≠ destructive` rule).
2. **Token table** — for each of `price-up`, `price-down`, `price-neutral`, `live-indicator`, `selected`, `community`, `community-foreground`, `community-soft`, `community-border`, `overlay`:
   - role / when to use
   - light value (OKLCH literal **or** Skeleton primitive alias)
   - dark value (same)
   - WCAG-AA contrast pair requirement (cite the contrast token row)
   - "may share value with X but never share name with X" rule, where relevant
3. **Outcome series** (`outcome-1..6`): full table; for each, light + dark value + Skeleton family alias.
4. **7+ outcomes rule**: pick **either** "HSL rotation algorithm" **or** "capped legend with +N more". Decide and write the rule.
5. **Live-indicator behavior** (1 paragraph): static red dot under `prefers-reduced-motion`, pulse animation under default.
6. **Selected ring rule** (1 paragraph): `ring-selected` works on any colored card; must contrast against `primary` and against `accent`.

**Constraints:**

- Use only Skeleton-primitive values; no Tailwind palette literals.
- Every token has both light and dark values. No half-tokens.
- Cite the contrast pair for any non-trivial foreground/background combo.

**Definition of done:**

- A separate doc that PROMPTS.md Step 5 can implement verbatim — no further design discussion needed.
- Every token has light + dark + contrast cite.
- The doc references `polymarket-analysis.md` for cross-check **once**, near the end, with the caveat "values cross-checked but not copied".

---

### Prompt 2 — `design/formatting.md` + add helpers to `packages/bm-utilities/src/lib/format.ts`

**Why this section next.** Numbers are visible on every screen. Without one consistent rule, every component spec re-litigates this question.

**Required reading:**

- [`docs-v2/current-vs-target.md`](./current-vs-target.md) §3 Gap 3 ("Numbers look like a different app on every screen")
- [`docs-v2/design/design-philosophy.md`](./design/design-philosophy.md) §6 "Do/Don't"
- [`docs-v2/design/polymarket-analysis.md`](./design/polymarket-analysis.md) §2.7 (numeric formatting comparison)
- [`packages/bm-utilities/src/lib/format.ts`](../packages/bm-utilities/src/lib/format.ts) — existing helpers (read fully; ≤100 lines)

**Output:**

1. New doc `docs-v2/design/formatting.md`, ~120 lines.
2. New helpers added to `packages/bm-utilities/src/lib/format.ts` (do not delete or modify existing helpers): `fmtSignedPercent`, `fmtCompact`, `fmtProbability`, `fmtAddressShort`, `fmtCountdown`.
3. Add `"tabular-nums"` rule to `docs-v2/design/styling-contract.md` §5 "Recipes" (one sentence).

**Doc contents (in order):**

1. **One-sentence rule** ("All numeric displays use `tabular-nums`; crypto addresses also use `font-mono`.").
2. **Probability format**: `XX% chance` for binary/categorical/scalar; `<1% chance` / `>99% chance` at extremes. Never `¢`. (Decide once.)
3. **Signed change**: `▲ +X.X%` (`price-up`) or `▼ X.X%` (`price-down`); also `▲ +$X` for absolute deltas. Always colored.
4. **Compact currency**: ≤999 = full digits with locale separators; ≥1,000 = `$1.5K`, `$12.4K`, `$1.2M`, `$3.4B`. Provide the formatter signature.
5. **Crypto amount**: `0.0123 sBTC` with max 4 decimals and trailing zeros trimmed via existing `trimTrailingZeros`.
6. **Time formatting**: relative `Ends in 2:34` under 1h; relative `Ends in 6d 4h` over 1h; absolute UTC for resolved markets. Time-zone policy: UTC absolute; relative is computed from `Date.now()`.
7. **Truncation**: addresses = `0xABCD…WXYZ` (4+4) via `fmtAddressShort`; market titles = `line-clamp-2`; outcome labels = single-line ellipsis.
8. **Locale posture**: en-US only for v1, said explicitly.
9. **Helper signatures** (TypeScript): each new helper's signature and one-line description.

**Helper file changes (`format.ts`):**

- `fmtSignedPercent(value: number, decimals = 1): { text: string; sign: 'up' | 'down' | 'flat' }`
- `fmtCompact(value: number, currency: string = 'USD'): string`
- `fmtProbability(value: number): string` (returns `XX% chance` / `<1% chance` / `>99% chance`)
- `fmtAddressShort(address: string, head = 4, tail = 4): string`
- `fmtCountdown(secondsRemaining: number): string` (e.g. `2:34`, `6d 4h`)

**Constraints:**

- No new dependencies.
- Helpers are **pure functions**; no store reads, no API calls.
- Do not modify existing helpers' signatures or behavior.

**Definition of done:**

- `format.ts` adds five helpers; existing helpers untouched.
- `formatting.md` cites the helpers and provides one example call per surface (card chance %, hero signed delta, trade widget compact amount, address pill).
- `styling-contract.md` §5 gains a one-sentence `tabular-nums` rule.

---

### Prompt 3 — `design/motion.md`

**Why now.** Live indicators and pre-flight modals need a motion vocabulary. Without one, components either invent ad-hoc CSS or skip animation entirely.

**Required reading:**

- [`docs-v2/design/polymarket-analysis.md`](./design/polymarket-analysis.md) §1.7 (Polymarket's named animations)
- [`packages/bm-design/src/theme.css`](../packages/bm-design/src/theme.css) — read only the `--ease-*` and `--animate-*` lines (search for `--ease`)
- [`docs-v2/design/design-philosophy.md`](./design/design-philosophy.md) §6 "Don't" (decorative animations forbidden)
- One file using existing motion: [`apps/frontend-c1/src/lib/components/template/HeaderMenuTailwind.svelte:225-363`](../apps/frontend-c1/src/lib/components/template/HeaderMenuTailwind.svelte)

**Output:** `docs-v2/design/motion.md`, ~80 lines.

**Contents:**

1. **Token vocabulary**:
   - Durations: `motion-fast: 120ms`, `motion-base: 200ms`, `motion-slow: 320ms`.
   - Easings: `ease-pop: cubic-bezier(.16, 1, .3, 1)` for enter/exit; `ease-stand: cubic-bezier(.4, 0, .2, 1)` for state transitions.
   - To be added to `theme.css` + `tokens.ts` in a Wave-2 ticket (does not block this doc).
2. **When to animate** (a table):
   - State change (hover, active, focus) → `motion-fast` + `ease-stand`.
   - Enter / exit (modal, popover, toast) → `motion-base` + `ease-pop`.
   - Page transition / route change → `motion-slow` + `ease-pop` (or no animation).
   - Decorative / ambient → **never**.
3. **`prefers-reduced-motion` policy** (loud paragraph):
   - All transform and opacity animations honor it.
   - Infinite animations (live dot pulse, ticker scroll) **must** degrade to a static state under reduced-motion. Provide the canonical media query CSS snippet.
4. **Live updates** (1 paragraph): pulse + `aria-live="polite"` on the value element; static dot under reduced-motion.
5. **Forbidden patterns**: aurora gradients, shimmer skeletons over 600 ms, scroll-jacking, parallax.

**Constraints:**

- Token values are recommendations; do not edit `theme.css` in this prompt.
- Do not introduce a Svelte transition library or `motionone` etc.

**Definition of done:** doc + a CI-greppable token list at the top + one canonical reduced-motion snippet.

---

### Prompt 4 — `design/a11y.md`

**Why now.** `components/trade-widget.md` and the wallet flow both need a single a11y rule to cite, not invent.

**Required reading:**

- [`docs-v2/audit-report.md`](./audit-report.md) §D (Interaction and accessibility)
- [`packages/bm-design/src/vendor/skeleton-nouveau.css`](../packages/bm-design/src/vendor/skeleton-nouveau.css) — `*-contrast-*` table (search for `contrast`)
- [`packages/bm-ui/src/lib/components/ui/button/button-variants.ts`](../packages/bm-ui/src/lib/components/ui/button/button-variants.ts) — existing focus rules

**Output:** `docs-v2/design/a11y.md`, ~80 lines.

**Contents:**

1. **WCAG target**: AA. State this once at the top.
2. **Contrast** (table): for body / large text / icon / focus ring — required ratios + how to verify against the Skeleton `*-contrast-*` table.
3. **Focus policy**: `focus-visible:ring-2 ring-ring` on every interactive control. Transparent / ghost controls may use `focus-visible:outline-2 outline-ring`. Document the choice once; fix `HeaderMenuTailwind.svelte:111` to comply.
4. **Hit targets**: ≥36 px desktop, ≥44 px mobile. State this once.
5. **Keyboard reachability**: Tab order is markup order; no `tabindex > 0`. Trade widget Tab order spec: outcome chip → amount input → preset chips → CTA.
6. **Live regions**: `aria-live="polite"` on price elements that update on a polling interval; `aria-live="assertive"` on tx-status changes (`TxModal.svelte`).
7. **Reduced motion**: see `motion.md`; this doc references it.
8. **Error message tone**: 1 sentence what + 1 sentence what next; never start with "Error:". Cite `current-vs-target.md` §3 Gap 5 examples.
9. **Screen-reader names**: every icon-only button has `aria-label`; every chart has a text alternative summary.

**Definition of done:** one short doc that future component specs can cite by section number.

---

### Prompt 5 — `design/dark-mode.md`

**Why now.** Audit §I "Where `.dark` is toggled" is undocumented; this is a 60-minute doc.

**Required reading:**

- [`apps/frontend-c1/src/app.html:7-17`](../apps/frontend-c1/src/app.html) — FOUC script (read this exactly)
- [`apps/frontend-c1/src/lib/components/template/HeaderMenuTailwind.svelte:46-59`](../apps/frontend-c1/src/lib/components/template/HeaderMenuTailwind.svelte) — toggle UI
- [`apps/frontend-c1/src/routes/layout.css:13`](../apps/frontend-c1/src/routes/layout.css) — `@custom-variant dark`

**Output:** `docs-v2/design/dark-mode.md`, ~50 lines.

**Contents:**

1. **Mechanism**: class-based, `.dark` on `<html>`.
2. **Where it's toggled**: cite both files + line numbers.
3. **FOUC script**: paste the canonical version verbatim from `app.html` so future edits keep it in sync.
4. **localStorage key**: `theme` (`'light' | 'dark' | undefined`). State precedence: localStorage > `prefers-color-scheme` > light default.
5. **Parity rule**: every semantic token has a `.dark` counterpart; no semantic value ships without it.
6. **Forbidden patterns**: `dark:bg-*` on Tier-1 utilities (use the token instead); `prefers-color-scheme` media queries outside the FOUC script.

**Definition of done:** doc lets a new engineer find / verify / modify the dark toggle in 5 minutes.

---

### Prompt 6 — `design/charts.md`

**Why now.** PROMPTS.md Step 8 (chart tokens) needs a contract for how chart code reads them.

**Required reading:**

- [`docs-v2/design/skeleton-theme-nouveau.md`](./design/skeleton-theme-nouveau.md) §"Charts" (ApexCharts is the library)
- [`docs-v2/design/bm-semantic-tokens-proposal.md`](./design/bm-semantic-tokens-proposal.md) §"Chart structure" + §"Outcome series"
- [`packages/bm-market/src/lib/market/version2/do-charts/StakeChart.svelte`](../packages/bm-market/src/lib/market/version2/do-charts/StakeChart.svelte) — read the imports + the colors array at line 68
- [`docs-v2/design/polymarket-analysis.md`](./design/polymarket-analysis.md) §2.2 (multi-line categorical chart, single-line binary chart, live-tick scalar chart)

**Output:** `docs-v2/design/charts.md`, ~120 lines.

**Contents:**

1. **Library**: ApexCharts `^5.3.5` + `svelte-apexcharts `^1.0.2`. No second chart library without an RFC.
2. **How chart code reads tokens** (the contract):
   - Preferred: `getComputedStyle(document.documentElement).getPropertyValue('--color-outcome-1')` in `onMount`.
   - Fallback: `import { tokens } from '@bigmarket/bm-design'` (kept in lock-step per the styling contract).
   - **Never**: literal hex in Svelte / TS files.
3. **Dark-mode flip**: derive from `document.documentElement.classList.contains('dark')` in `onMount` + a `MutationObserver` (or via the theme store if one exists; check `bm-common`). Pass `theme.mode: 'dark' | 'light'` to ApexCharts options.
4. **Token mapping** (the table):
   - `outcome-1..6` → `colors: [...]`
   - `chart-grid` → `grid.borderColor` + `xaxis.axisBorder.color`
   - `chart-axis` → `xaxis.axisTicks.color`, `yaxis.axisTicks.color`
   - `chart-axis-label` → `xaxis.labels.style.colors`, `yaxis.labels.style.colors`
   - `chart-tooltip-bg` → `tooltip.theme` (light/dark) + custom background via CSS
   - `chart-cursor` → `xaxis.crosshairs.stroke.color`
   - `chart-area-opacity` → `fill.opacity` (likely `0.15` light / `0.20` dark)
5. **Reduced motion**: disable `animations.enabled` when `matchMedia('(prefers-reduced-motion: reduce)').matches`.
6. **Three canonical chart types** (one paragraph each):
   - Binary single-line area chart.
   - Categorical multi-line chart with legend dots colored to match lines.
   - Live scalar ticking chart (used in price-up-down hero).
7. **Tooltip / crosshair / time-range selector** spec.
8. **Migration** (1 paragraph): `StakeChart.svelte:68` hex palette is documented technical debt; replace under PROMPTS.md Step 8.

**Constraints:** no new deps; no logic edits to existing chart components in this prompt.

**Definition of done:** doc + token-mapping table that PROMPTS.md Step 8 implements verbatim.

---

### Prompt 7 — `components/shell.md`

**Why now.** PROMPTS.md Step 4 migrates the shell; the spec is in our heads, not on paper.

**Required reading:**

- [`docs-v2/design/design-philosophy.md`](./design/design-philosophy.md) §5 "App shell" personality
- [`docs-v2/design/polymarket-analysis.md`](./design/polymarket-analysis.md) §2.1 (Polymarket shell pattern)
- [`apps/frontend-c1/src/routes/+layout.svelte`](../apps/frontend-c1/src/routes/+layout.svelte)
- [`apps/frontend-c1/src/lib/components/template/HeaderMenuTailwind.svelte`](../apps/frontend-c1/src/lib/components/template/HeaderMenuTailwind.svelte)
- [`apps/frontend-c1/src/lib/components/template/Footer.svelte`](../apps/frontend-c1/src/lib/components/template/Footer.svelte)
- [`apps/frontend-c1/src/lib/components/template/AlphaBanner.svelte`](../apps/frontend-c1/src/lib/components/template/AlphaBanner.svelte)
- [`apps/frontend-c1/src/lib/components/template/ReputationCommunityBanner.svelte`](../apps/frontend-c1/src/lib/components/template/ReputationCommunityBanner.svelte)

**Output:** `docs-v2/components/shell.md`, ~120 lines.

**Contents:**

1. **Header anatomy**: logo (left), category nav (scrollable on mobile), search (collapsible on mobile), "How it works" pill, theme toggle, wallet connect / address pill (right).
2. **Sticky behavior**: `position: sticky; top: 0` with `bg-background/80 backdrop-blur` after scroll; transition follows `motion.md`.
3. **Mobile drawer**: lift the inline `fly`-from-`svelte/transition` drawer in `HeaderMenuTailwind.svelte:225-363` into a `bm-ui` primitive `<Drawer />` (separate ticket; this doc just names the spec).
4. **Banner stack order** (top→bottom): `AlphaBanner` (alpha-testing notice) → `ReputationCommunityBanner` (DAO / governance) → `<network-mismatch banner>` (when chain ≠ expected) → header. Each banner is dismissible; dismissed banners persist in `sessionStorage`.
5. **Footer anatomy**: centered logo, link grid (Markets, Community, Resources, Legal), locale picker bottom-right, copyright line.
6. **Dark + light reference frames**: cite `homepage LIGHT.png` and `homepage DARK.png`.
7. **Tokens used**: explicit list (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-accent` for active nav, `ring-ring`).
8. **A11y notes** (cite `a11y.md`): keyboard reachability, focus rings, `aria-label` on icon buttons.

**Constraints:** no logic changes; doc only. Refers PROMPTS.md Step 4 for the implementation pass.

**Definition of done:** every visual decision in the shell is now documented; PROMPTS.md Step 4 can be implemented without further discussion.

---

### Prompt 8 — `components/market-card.md` (the single most important doc)

**Why now.** Market card is the most-repeated surface in the product. Four variants × four states × two themes = 32 visual cells we currently invent each time.

**Required reading:**

- [`docs-v2/design/design-philosophy.md`](./design/design-philosophy.md) §5 (registers per surface)
- [`docs-v2/design/polymarket-analysis.md`](./design/polymarket-analysis.md) §2.2 (hero variants)
- [`docs-v2/design/tokens-domain.md`](./design/tokens-domain.md) (must be done by Prompt 1)
- [`docs-v2/design/formatting.md`](./design/formatting.md) (must be done by Prompt 2)
- [`packages/bm-market-homepage/src/lib/components/markets/MarketEntry.svelte`](../packages/bm-market-homepage/src/lib/components/markets/MarketEntry.svelte) (full read)
- [`packages/bm-market-homepage/src/lib/components/markets/Gauge.svelte`](../packages/bm-market-homepage/src/lib/components/markets/Gauge.svelte) (full read)
- Reference screenshots: `docs/design/assets/polymarket/homepage hero {binary,categorical,PriceUP:DOWN,Sports}.png`

**Output:** `docs-v2/components/market-card.md`, ~250 lines.

**Contents:**

1. **Anatomy** (ASCII diagram for each variant):
   - **Binary** (Yes/No): icon · title (2-line clamp) · chance % top-right · `▲ ▼` signed delta · Yes / No buttons (`price-up` / `price-down` soft fills) · volume · countdown · share / bookmark icons.
   - **Categorical** (multi-outcome): icon · title · up to 4 outcome rows (label + chance %) · top-3 outcomes get Yes / No buttons inline · "See all N outcomes" link if >4.
   - **Scalar / price-up-down**: icon · title · "Price to Beat" / "Current Price" KPI strip · `UP {n}x / DOWN {n}x` buttons · live countdown · live dot · live ticker.
   - **Sports**: category breadcrumb · title · 3 outcome buttons (Team / Draw / Team) · spread + total accordion · live status.
2. **Tokens used** per variant (table): `bg-card`, `border-border`, `text-card-foreground`, `text-muted-foreground`, `price-up`, `price-down`, `outcome-1..6`, `live-indicator`.
3. **Hover state**: subtle `border-border/60` lift + `shadow-card-hover`. Focus state: `ring-2 ring-ring`.
4. **Loading skeleton**: skeleton primitives + per-variant shapes.
5. **Empty state**: not applicable per card (cards always show data); see `components/empty-states.md` for the grid-level empty.
6. **A11y**: card is `<article>`; title is `<h3>` with link wrapping the title text; buttons are `<a>` with `href` to the market detail; chart has `aria-label`.
7. **Density**: 16 px padding small; 20 px padding `md+`. Title `text-sm leading-5 font-semibold`. Chance % `text-base font-bold tabular-nums`.
8. **Dark / light parity**: identical layout; only colors flip via tokens.
9. **Reference frames** (citations):
   - Binary → `homepage hero binary.png` (large) + the binary card rows visible in `homepage LIGHT.png` / `DARK.png` grid.
   - Categorical → `homepage hero categorical.png`.
   - Scalar → `homepage hero PriceUP:DOWN.png`.
   - Sports → `homepage hero Sports.png`.
10. **Mobile**: single column; reduce title to `text-[13px]` is **not allowed** — use `text-xs` from the scale.
11. **Code map**: the prop interface for `<MarketCard variant="binary|categorical|scalar|sports" market={...} />`.

**Constraints:** no logic edits; we are documenting the spec for `PROMPTS.md` Step 7.

**Definition of done:** every variant has anatomy + tokens + states + reference frame. A future engineer can build it without further design discussion.

---

### Prompt 9 — `components/market-detail.md`

**Required reading:** Prompts 1-8 output + Polymarket market-detail screenshots.

**Output:** `docs-v2/components/market-detail.md`, ~180 lines.

**Contents:**

1. **Two-column grid** (`md+`): main ~64% / sidebar ~36%.
2. **Sticky trade widget** in the desktop sidebar; `position: sticky; top: <header height>`.
3. **Mobile collapse order** (top→bottom): title strip → chart → time-range tabs → outcomes table → Order Book ▾ (collapsed) → comments → FAQ → related markets. Trade widget portals to a fixed bottom sheet.
4. **Chart region**: time-range selector tabs (`5m 1H 6H 1D 1W 1M All`); chart canvas; live pill bottom-right.
5. **Outcomes table** (categorical only): row = outcome label + chance % + Yes / No buttons.
6. **Comments** layout: avatar + username + time + body + reply count + like + position-holder badge.
7. **FAQ accordion** (uses `bm-ui` accordion).
8. **Related markets** sidebar list under the trade widget.
9. **Citations**: `market details - *.png`.

---

### Prompt 10 — `components/trade-widget.md` (conversion-critical)

**Required reading:** Prompts 1-9 + `MarketStaking.svelte` + `SlippageSlider.svelte` + `widget buying.png`.

**Output:** `docs-v2/components/trade-widget.md`, ~250 lines.

**Contents:**

1. **Anatomy** (ASCII diagram): title row · Buy/Sell tabs + Market/Limit dropdown · outcome chips (Yes/No with chance %) · amount input + huge display · quick chips (`+$1 +$5 +$10 +$100`) · CTA · Advanced expander (slippage + fee preview).
2. **Plain-English CTA copy** rule: `Place ${amount} on "${outcome}"`. Never just "Trade".
3. **States**:
   - Idle (no amount): "Enter amount" placeholder; CTA disabled.
   - With amount: CTA enabled, copy shows the amount.
   - Submitting: spinner in CTA, button disabled, "Awaiting wallet signature".
   - Submitted (pending tx): pending state with hash chip.
   - Failed: inline error band above CTA + retry option.
4. **Slippage**: behind "Advanced" by default; default 1%; expose inline only when order would exceed slippage.
5. **Limit order**: scope decision (in or out for v1?). If in, document the additional fields (limit price, time-in-force). If out, mark out-of-scope and what to render.
6. **Mobile**: full-width sheet, sticky CTA at bottom of sheet.
7. **A11y**: Tab order spec, `aria-describedby` for slippage hint, screen-reader labels.
8. **Cross-references**: `components/confirmation.md` (next prompt) for the modal; `tokens-domain.md` for chip colors.

---

### Prompt 11 — `components/confirmation.md` (pre-flight modal)

**Required reading:** Prompts 1, 2, 10 + `TxModal.svelte` + `current-vs-target.md` §3 Gap 2 (the plain-English pre-flight example).

**Output:** `docs-v2/components/confirmation.md`, ~120 lines.

**Contents:** pre-flight (token, amount, est fee, est return, slippage, wallet that will sign) + in-flight (spinner, hash chip with copy + explorer link) + post-flight (success toast with "View positions" CTA / failure with explainer + retry).

---

### Prompt 12 — `components/order-book.md`

**Required reading:** `OrderBook.svelte` + `order book.png`.

**Output:** `docs-v2/components/order-book.md`, ~120 lines.

**Decision required up front (call it out in the doc):** is this a **real order book** (CLOB) or a **recent-trades widget**? Today's code is the latter. Picked decision drives the spec.

**Contents:** three-column layout, footer (`Last:` + `Spread:`), color binding to `price-up` / `price-down` (NOT `success` / `destructive`), heat-bar left margin, **collapsed by default** on market detail.

---

### Prompt 13 — `components/forms.md`

**Required reading:** `bm-ui/input/input.svelte` + `bm-ui/select/select-trigger.svelte` + `bm-ui/checkbox/*` + `bm-ui/switch/*`.

**Output:** `docs-v2/components/forms.md`, ~120 lines.

**Contents:** text / number / currency / percentage / datetime variants; helper / error / required / suffix-prefix; depends on Prompt 1 (`input` token must exist).

---

### Prompt 14 — `components/modal.md`

**Required reading:** `bm-ui/dialog/*` + `TxModal.svelte` + `sign up and connect wallet popup.png`.

**Output:** `docs-v2/components/modal.md`, ~80 lines.

**Contents:** size scale (sm/md/lg/xl), scroll-inside vs scroll-outside, header/footer pattern, focus trap, overlay.

---

### Prompt 15 — `components/wallet-modal.md`

**Required reading:** `ConnectLanes.svelte` + `WalletMenuTailwind.svelte` + `sign up and connect wallet popup.png` + `design-philosophy.md` §6.

**Output:** `docs-v2/components/wallet-modal.md`, ~150 lines.

**Contents:** welcome shape (Welcome heading + primary lane + divider + secondary lanes + wallet tiles + Terms · Privacy footer) lifted from the Polymarket pattern; chain-switch banner spec; plain-English wallet event translations (see `current-vs-target.md` §3 Gap 5 table).

---

### Prompt 16 — `components/notifications.md`

**Required reading:** `current-vs-target.md` §3 Gap 5 + audit §B "Toast / notification system".

**Output:** `docs-v2/components/notifications.md`, ~80 lines. Decide on a library (`svelte-sonner` or hand-rolled), document toast anatomy, durations, stack behavior, dismiss, screen-reader behavior (`aria-live="polite"` for info, `assertive` for errors).

---

### Prompt 17 — `components/positions.md`

**Required reading:** `apps/frontend-c1/src/routes/my-markets/[address]/+page.svelte` + `apps/frontend-c1/src/lib/components/my-markets/UserClaim.svelte` + Prompt 1 (`tokens-domain.md`).

**Output:** `docs-v2/components/positions.md`, ~120 lines. Position card, positions table, P&L coloring via `price-up` / `price-down`, empty state.

---

### Prompt 18 — `components/address-pill.md`

**Required reading:** `HeaderMenuTailwind.svelte:319-328` + Prompt 2 (`formatting.md` for the truncation rule).

**Output:** `docs-v2/components/address-pill.md`, ~50 lines + a new `<AddressPill />` primitive in `bm-ui`.

**Note:** this prompt **does include a code addition** (new `bm-ui` component). The component is presentation-only; it takes an `address` prop and emits a copy event.

---

### Prompt 19 — `components/empty-states.md`

**Required reading:** `design-philosophy.md` §5.

**Output:** `docs-v2/components/empty-states.md`, ~80 lines. Top-level (illustrated) vs inline (small muted text) patterns.

---

### Prompt 20 — `components/error-states.md`

**Required reading:** `current-vs-target.md` §3 Gap 7.

**Output:** `docs-v2/components/error-states.md` + new `apps/frontend-c1/src/routes/+error.svelte`, ~100 lines.

**Contents:** inline error pattern + section error pattern + page-level error pattern (SvelteKit `+error.svelte`). The route-level error page is the only code addition.

---

### Prompt 21 — `components/skeletons.md` + new `<Skeleton />` in `bm-ui`

**Required reading:** audit §B "Skeletons and empty states".

**Output:** `docs-v2/components/skeletons.md`, ~50 lines + `packages/bm-ui/src/lib/components/ui/skeleton/skeleton.svelte`.

**Contents:** skeleton card / row / chart shapes; reduced-motion degrades to a static muted block (no shimmer).

---

### Prompt 22 — `process/lint-and-ci.md` + ESLint config additions

**Required reading:** PROMPTS.md Step 9 + `apps/frontend-c1/eslint.config.js`.

**Output:** `docs-v2/process/lint-and-ci.md` + minimal additions to ESLint config in `apps/frontend-c1` and the workspace packages.

**Contents:** ESLint plugin / `no-restricted-syntax` rules that gate Tier-1 leakage (`gray-*`, `zinc-*`, `bg-[#`, `text-[Npx]`, `shadow-[`) outside `packages/bm-design/`. Escape-hatch process (use `eslint-disable-next-line` with a TODO + ticket link).

---

### Prompt 23 — Wave 2 ticket grooming

**Required reading:** `audit-report.md` §6 ("Quick wins") + the docs landed by prompts 1–22.

**Output:** A single doc `docs-v2/process/wave-2-backlog.md` (~80 lines) that lists every token, every component sweep, and every helper that is still outstanding after prompts 1–22, sized S/M/L, with cross-references to the doc that owns the spec.

This becomes the engineering backlog for Wave 2 of the refactor.

---

## After running all 23 prompts

Re-run the audit (`docs-v2/audit-prompt.md`) and compare. The expected outcome:

- Every "Missing" verdict in the audit becomes "Covered" or "Thin".
- Every "Thin" verdict gains the missing field (cite + recommendation).
- The "Critical gaps" section drops from 7 to ≤2 (the remaining are code work, not docs).

If the second audit still flags Missing items, add a Prompt 24+ targeting that gap only.

## Notes for the user

- Prompts 1–6 are foundation and must run in order.
- Prompts 7–21 are component specs; **prompt 8 (`market-card.md`) is the highest-value one** — if you run only one component prompt, run that.
- Prompts 22–23 are enforcement and grooming; run after the rest.
- Each prompt is sized for a single agent session (≤30 min of work).
- If the agent asks for context not listed, **deny** and re-paste the prompt — the constraint is intentional.
