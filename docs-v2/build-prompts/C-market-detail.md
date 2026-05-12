# Build Prompt C — Market detail page (Claude Code or Cursor with quality model)

**Use this for:** migrating the market-detail page to the new token system + applying the two-column layout + collapsing the order book + sticky trade widget + time-range tabs + the inline numeric / motion / a11y rules.

**Recommended model:** Claude Code (or Cursor Auto for the mechanical sweeps after the layout shell is correct).

**Prerequisites:** Build Prompt A landed. Build Prompt B landed (so `bm-ui` Card / Button leakage is fixed and the homepage proves the pipeline).

**Estimated time:** 60–90 minutes.

**Paste everything below this line into a fresh agent session.**

---

## Guardrails (do not break)

```text
DO NOT change behavior.

Allowed files (and only these):
- apps/frontend-c1/src/routes/market/[marketId]/[marketType]/+page.svelte                     (layout grid; markup + classes only — see Task 1)
- packages/bm-market/src/lib/market/version2/MarketHeader.svelte                              (Tier-1 sweep + KPI strip class polish)
- packages/bm-market/src/lib/market/version2/MarketStatsBar.svelte                            (Tier-1 sweep)
- packages/bm-market/src/lib/market/version2/MarketCharts.svelte                              (Tier-1 sweep + time-range tabs visual)
- packages/bm-market/src/lib/market/version2/MarketDetails.svelte                             (Tier-1 sweep)
- packages/bm-market/src/lib/market/version2/MarketStaking.svelte                             (class-only on container/header/CTA; DO NOT touch the staking logic)
- packages/bm-market/src/lib/market/version2/OrderBook.svelte                                 (Tier-1 sweep + wrap in collapsed-by-default `<details>` per Task 5)
- packages/bm-market/src/lib/market/version2/MarketComments.svelte                            (Tier-1 sweep)
- packages/bm-market/src/lib/market/version2/MarketResolving.svelte
- packages/bm-market/src/lib/market/version2/MarketVoting.svelte
- packages/bm-market/src/lib/market/version2/MarketClaiming.svelte
- packages/bm-market/src/lib/market/version2/MarketLiquidity.svelte
- packages/bm-market/src/lib/market/version2/do-resolve/ResolutionBanner.svelte
- packages/bm-market/src/lib/market/version2/do-stake/SlippageSlider.svelte                  (class-only)
- packages/bm-market/src/lib/market/version2/do-stake/SharePriceInfo.svelte
- packages/bm-market/src/lib/market/version2/do-stake/StakingButton.svelte                   (class-only; CTA visual only)
- packages/bm-market/src/lib/market/version2/do-stake/StakingButtonClassic.svelte            (class-only)
- packages/bm-market/src/lib/market/version2/do-stake/StakingCoolDown.svelte
- packages/bm-market/src/lib/market/version2/market-staking-components/MarketStakingPurchaseAmount.svelte  (Tier-1 sweep — 126 matches, mechanical)

Forbidden:
- Any edit outside the files above.
- ANY edit to Svelte <script> blocks that own state, $effect, $derived, $state, $props, onMount, store subscribers, SDK calls, API calls. Markup + classes ONLY (except the explicit Task 5 wrapper).
- New dependencies.
- DaisyUI.
- Tier-1 palette utilities anywhere (gray-*, zinc-*, etc.). Use tokens.
- Arbitrary values: no text-[Npx], no bg-[#abc], no shadow-[0_6px_...]. Use tokens or existing utilities.
- Binding `price-down` to `destructive` name. Use `price-down`.
- The `¢` glyph.
- Changing chart libraries, chart data, or chart series. Chart palette stays as-is for v1 (tracked as debt; Step 8).

If a visual change requires a logic change, STOP and flag.
```

---

## Required reading (read fully BEFORE editing)

1. `docs-v2/tokens-and-rules.lock.md`.
2. `docs-v2/current-vs-target.md` §3 Gap 2 (trade widget), §3 Gap 4 (order book), §3 Gap 6 (live data).
3. `docs-v2/design/design-philosophy.md` §5 (market-detail register).
4. `docs-v2/design/polymarket-analysis.md` §2.6 (market-detail layout), §2.4 (order book — used by Task 5).
5. The route file: `apps/frontend-c1/src/routes/market/[marketId]/[marketType]/+page.svelte` (full).
6. `packages/bm-market/src/lib/market/version2/MarketHeader.svelte`, `MarketStatsBar.svelte`, `MarketCharts.svelte`, `MarketStaking.svelte`, `OrderBook.svelte`, `MarketComments.svelte`, `MarketDetails.svelte` (full).

Reference screenshots: `docs/design/assets/polymarket/{market details - BTC Up or Down 5m*.png, market details - West Ham*.png, market details - Hantavirus*.png, order book.png, widget buying.png}`.

Do NOT open other files. If you think you need to, stop and flag.

---

## Task 1 — Layout shell in `+page.svelte`

The current page renders children in a single column. Replace the outer container with the canonical two-column market-detail grid.

**Target shape** (preserve every existing child component placement; only change wrapping classes):

```svelte
<!-- BEFORE (current shape — preserve all <script>, all imports, all child component usages):
<div class="…some classes…">
  <MarketHeader … />
  <MarketStatsBar … />
  <MarketCharts … />
  <MarketStaking … />
  <OrderBook … />
  <MarketComments … />
</div>
-->

<!-- AFTER -->
<div class="container mx-auto px-4 py-6 md:py-8">
  <MarketHeader … />

  <div class="mt-6 grid gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">

    <!-- Main column -->
    <main class="min-w-0 space-y-6">
      <MarketStatsBar … />
      <MarketCharts … />
      <MarketDetails … />
      <!-- order book collapsed by default — see Task 5 -->
      <OrderBook … />
      <MarketComments … />
    </main>

    <!-- Sticky sidebar (desktop). On mobile it stacks above MarketDetails/comments. -->
    <aside class="lg:sticky lg:top-20 lg:self-start space-y-4">
      <MarketStaking … />
      <!-- ResolutionBanner / MarketResolving / MarketVoting / MarketClaiming
           render here IF the existing logic decided to render them. Preserve the
           existing conditional structure exactly; only adjust the wrapping order
           so trade widget sits at the top of the sticky column. -->
    </aside>

  </div>
</div>
```

**Constraints:**

- Preserve every existing `<script>` line.
- Preserve every child component's props.
- Preserve every existing `{#if}` / `{#each}` block — just move them inside the new grid.
- `lg` breakpoint = 1024 px (Tailwind default).
- `lg:top-20` assumes a sticky header ≈ 80 px tall. If the existing header is different (check `HeaderMenuTailwind.svelte` height), adjust the offset accordingly.
- On mobile (`<lg`), trade widget MUST appear above the chart's order book and comments. The above order satisfies that because `<aside>` stacks above `<main>`'s lower content when the grid collapses. **Verify visually in the PR.**

If the existing route renders different component sets based on `marketData.resolutionState`, **preserve the same `{#if}` branching** — the grid wraps only the markup, not the conditional logic.

---

## Task 2 — `MarketHeader.svelte` (title + KPI strip)

Class-only sweep. Replace Tier-1 utilities with tokens. The KPI strip pattern:

```svelte
<div class="flex items-center gap-3 text-sm text-muted-foreground">
  <span class="tabular-nums">{volumeLabel}</span>
  <span aria-hidden="true">·</span>
  <span class="tabular-nums">{endsLabel}</span>
  <span aria-hidden="true">·</span>
  <span class="inline-flex items-center gap-1.5">
    <span class="size-2 rounded-full bg-live-indicator animate-pulse" aria-hidden="true"></span>
    Live
  </span>
</div>
```

**Only render the live pill if** the existing component already exposes a live-active state. If it does not, **do not invent one** — just render the volume / ends labels. Defer live-state to a future prompt.

Title: `h1` with `class="text-2xl md:text-3xl font-bold text-foreground"`. Subtitle / category breadcrumb (if present): `text-sm text-muted-foreground`.

---

## Task 3 — `MarketStatsBar.svelte`

Replace the existing Tier-1 cluster (`bg-surface text-secondary text-primary border-purple-600/20`) with:

```svelte
<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
  {#each stats as stat}
    <div class="flex items-center gap-4 rounded-md bg-card text-card-foreground border border-border p-4">
      <div>
        <div class="text-sm text-muted-foreground">{stat.label}</div>
        <div class="text-lg font-semibold whitespace-pre-line tabular-nums">
          {#if stat.link}
            <a href={stat.link} class="hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded">{stat.value}</a>
          {:else}
            {stat.value}
          {/if}
        </div>
      </div>
    </div>
  {/each}
</div>
```

Numbers carry `tabular-nums`. Card uses semantic surface tokens. Border is `border-border` (not `border-purple-600/20`).

---

## Task 4 — `MarketCharts.svelte` (time-range tabs visual; chart palette stays)

Class-only. The ApexCharts series colors are out of scope (tracked as tech debt). What changes:

- Container card: `bg-card text-card-foreground border border-border rounded-md p-4`.
- Time-range tab strip (`5m / 1H / 6H / 1D / 1W / 1M / All`):

```svelte
<div role="tablist" class="inline-flex items-center gap-1 rounded-md bg-muted p-1">
  {#each ranges as range}
    <button
      role="tab"
      type="button"
      aria-selected={range === activeRange}
      onclick={() => setRange(range)}
      class="rounded px-3 py-1.5 text-xs font-medium tabular-nums transition-colors
             text-muted-foreground hover:text-foreground
             aria-selected:bg-card aria-selected:text-foreground aria-selected:shadow-sm
             focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      {range}
    </button>
  {/each}
</div>
```

If the existing component already has tab handlers, **wire your new buttons to the existing handler function names** — do not introduce a new `setRange`. Read the script for the existing variable / function names and call those.

If there is no existing time-range selector logic, **do not add one in this prompt**. Render the chart as-is and leave a `<!-- TODO: time-range tabs need new logic; tracked separately -->` comment.

---

## Task 5 — `OrderBook.svelte` — collapse by default

**This is the only authorized "wrap markup in new element" change in this prompt.**

The current `OrderBook.svelte` renders its content inline. Wrap the rendered markup in a `<details>` element so it is collapsed by default:

```svelte
<details class="rounded-md bg-card text-card-foreground border border-border group">
  <summary class="cursor-pointer select-none px-4 py-3 flex items-center justify-between
                  text-sm font-medium
                  hover:bg-muted/40
                  focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
    <span>Order book</span>
    <span class="text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
  </summary>
  <div class="px-4 pb-4 pt-2">
    <!-- existing OrderBook markup goes here, with its Tier-1 classes swept -->
  </div>
</details>
```

**Tier-1 sweep inside the order-book rows:**

- Sell-side (red) price rows: `text-price-down tabular-nums` (NOT `text-destructive`, NOT `text-red-500`).
- Buy-side (green) price rows (if any): `text-price-up tabular-nums`.
- Shares / total columns: `text-foreground tabular-nums`.
- Column headers: `text-xs uppercase tracking-wide text-muted-foreground`.
- Footer (`Last:` / `Spread:`): `text-xs text-muted-foreground tabular-nums`.

The `<script>` block is untouched.

---

## Task 6 — `MarketStaking.svelte` (chrome only — DO NOT touch staking logic)

This is the trade widget. Today it is a 368-line component that mixes layout and logic. **You are NOT redesigning it.** Only:

- Outer container: `bg-card text-card-foreground border border-border rounded-md p-4`.
- Headline / title row classes → tokens.
- Buy/Sell buttons or any Tier-1 colors → `bg-price-up`/`bg-price-down` for outcome buttons; `bg-accent text-accent-foreground` for the primary "Place trade" CTA (see Task 7 for the CTA button file).
- Slippage section: keep visible for now (full trade-widget redesign is a separate effort); just swap Tier-1 → tokens.
- Error band (if any): `bg-destructive-soft text-destructive border-destructive-border rounded-md p-3 text-sm`.
- `tabular-nums` on every number.

**Do not touch:** any `$state`, `$derived`, `$effect`, `onMount`, store reads, SDK calls. Class + markup only.

---

## Task 7 — `StakingButton.svelte` / `StakingButtonClassic.svelte` (CTA visuals)

Pure class-only sweep. The CTA button on the trade widget should look like:

```svelte
<button
  type="button"
  disabled={…existing disabled binding…}
  class="w-full inline-flex items-center justify-center gap-2 rounded-md
         bg-accent text-accent-foreground
         h-11 md:h-10 px-4 text-sm font-medium
         hover:bg-accent/90 active:scale-[0.98] transition
         disabled:opacity-50 disabled:pointer-events-none
         focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
         focus-visible:outline-none">
  <!-- existing slot / label -->
</button>
```

`h-11 md:h-10` = 44 px touch on mobile, 40 px on desktop (meets the hit-target rule). Same shape applies to `StakingButtonClassic.svelte`. Do not change props.

---

## Task 8 — Sweep the rest of the listed files

For each remaining file in scope (MarketDetails / MarketComments / MarketResolving / MarketVoting / MarketClaiming / MarketLiquidity / ResolutionBanner / SlippageSlider / SharePriceInfo / StakingCoolDown / MarketStakingPurchaseAmount):

- Class-only.
- Tier-1 → tokens.
- Arbitrary values → tokens or standard utilities.
- Add `tabular-nums` to numeric elements.
- Add `focus-visible:ring-2 focus-visible:ring-ring` to interactive elements that don't already have it.
- Resolution banner: `bg-warning-soft text-warning border-warning-border` for the resolving state; `bg-success-soft text-success border-success-border` for resolved; `bg-info-soft text-info border-info-border` for awaiting.

`MarketStakingPurchaseAmount.svelte` is heavy (~126 Tier-1 matches). Do it **last** — by then the patterns are repetitive and you can batch.

---

## Verification (in PR summary)

```bash
# 1. Type + lint + build
pnpm --filter @bigmarket/bm-market check
pnpm --filter frontend-c1 check
pnpm --filter frontend-c1 lint

# 2. Tier-1 leakage in the migrated files (MUST RETURN ZERO)
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  apps/frontend-c1/src/routes/market \
  packages/bm-market/src/lib/market/version2

# 3. Arbitrary values
rg -n '(bg|text|border|ring|fill|stroke)-\[' apps/frontend-c1/src/routes/market packages/bm-market/src/lib/market/version2
rg -n 'text-\[[0-9]+px\]' packages/bm-market/src/lib/market/version2

# 4. Dev — open a real market URL on devnet
pnpm dev
# → open http://localhost:8081/market/<marketId>/<marketType> in light and dark
# Visually confirm:
#   a. Two-column layout on lg+; stacked on mobile; trade widget pinned-to-top on mobile.
#   b. Sticky trade widget on lg+ when scrolling the comments thread.
#   c. Order book is COLLAPSED by default — must click "Order book ▾" to expand.
#   d. Time-range tabs (if added) show active state correctly in both themes.
#   e. Numbers are tabular (no jitter on update / scroll).
#   f. Comments use card + token surfaces, focus rings visible.
#   g. With macOS "Reduce motion" enabled: no infinite pulse on the live pill (if present).
```

If grep 2 or grep 3 returns any line, **fix before commit**.

---

## PR summary template

```
Market detail migration — two-column grid + sticky widget + collapsed order book + Tier-2 tokens

What changed:
- Route: +page.svelte wraps children in `container > grid lg:grid-cols-[1fr_360px]` with sticky sidebar.
- OrderBook: wrapped in `<details>` (collapsed by default); sell-side rows bound to `text-price-down` (NOT `text-destructive`); footer uses tabular-nums.
- MarketStaking + StakingButton(Classic): chrome migrated to `bg-card` / `bg-accent` CTAs; logic untouched.
- N other components in packages/bm-market/src/lib/market/version2/ swept to tokens (list inline).
- ResolutionBanner uses `success-soft` / `warning-soft` / `info-soft` per state.

What did NOT change:
- Zero <script> body changes (other than the explicit Task 5 markup wrap, which adds no logic).
- No SDK / API / store / contract / event-handler edit.
- No new deps. No chart redesign. No trade-widget redesign (separate effort).

Verification:
- Tier-1 grep on migrated paths: 0 hits.
- Arbitrary-values grep: 0 hits.
- Typecheck / lint / build: ok.
- Visual: two-column grid, sticky sidebar, collapsed order book all confirmed in light + dark (screenshots).
- Reduced motion: confirmed (screenshot).
```

---

## What this prompt does NOT do (deferred — fine for now)

- Trade widget redesign (Buy/Sell tabs, quick chips, plain-English CTA copy, pre-flight modal). Tracked.
- Real order book vs recent-trades decision. Today it stays as the existing simulation, just collapsed. Tracked.
- Chart series palette (`outcome-1..4` for lines). Tokens exist; chart code still uses hex. Tracked.
- Wallet modal welcome redesign. Tracked.
- Comments avatar / badge polish. Class-only sweep here, not redesign.
- Sports market specific patterns (team colors). Out of scope.
- Price-up-down "live" hero variant. Out of scope.

If anything feels missing while you're working, **STOP and ask**, do not improvise.
