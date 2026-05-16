# Market Detail · C-00 — MarketContainer (layout restructure)

**File:** `packages/bm-market/src/lib/MarketContainer.svelte`
**Model:** Sonnet 4.6
**Time:** ~20 min
**Run order:** this prompt runs BEFORE C-01 through C-18 — it establishes the layout shell everything else slots into.
**Depends on:** `00-token-wiring` + `01-app-chrome` landed.

> **Use Sonnet 4.6** — this is a layout restructure, not a mechanical token swap. Requires judgment about grid placement, sticky positioning, and DOM order for mobile.

---

## Guardrails

DO NOT change behavior.

Allowed: HTML/Svelte markup structure, CSS class attributes, layout/grid/position classes, wrapping div reorganization.

Forbidden: `.ts` logic, `<script>` block content (state, stores, effects, onMount), component props, event handlers, new dependencies, DaisyUI, arbitrary values.

Rules:
- Touch ONLY `packages/bm-market/src/lib/MarketContainer.svelte`.
- Preserve every prop on `<MarketStakingContainer>`, `<MarketLiquidityContainer>`, `<MarketCharts>`, `<MarketComments>` exactly.
- Preserve every `{#if}` condition exactly. Only wrapping classes and element types change.
- If a layout change requires touching `<script>` state, STOP and flag it. Do not refactor silently.
- Output: one file diff + a 3-bullet PR summary. Nothing else.

---

## Scope

One file: `packages/bm-market/src/lib/MarketContainer.svelte`

---

## What to change: flex-row → CSS grid with sticky sidebar

The current layout uses `flex flex-col gap-6 md:flex-row` with the trade widget at `md:w-1/3` (left) and the chart/comments at `md:w-2/3` (right). This puts the sidebar on the LEFT.

**Target:** trade widget in a sticky RIGHT sidebar at `lg` breakpoint. Trade widget FIRST in DOM (so it stacks above charts on mobile).

Replace the outer grid container and its two child columns with:

```svelte
<div class="mt-6 grid gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">

  <!-- Trade/Liquidity sidebar — FIRST in DOM so it stacks above charts on mobile -->
  <aside class="space-y-4 lg:sticky lg:top-16 lg:self-start lg:col-start-2 lg:row-start-1">

    <!-- Tab strip (Trade / Liquidity) — token-correct -->
    <div
      class="flex rounded-md border border-border bg-muted p-1"
      role="tablist"
      aria-label="Market actions"
    >
      <button
        type="button"
        role="tab"
        aria-selected={sidePanelTab === 'trade'}
        class="flex-1 rounded px-3 py-2.5 text-center text-sm font-semibold transition-colors
               focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
               {sidePanelTab === 'trade'
                 ? 'bg-card text-foreground shadow-sm'
                 : 'text-muted-foreground hover:text-foreground'}"
        onclick={() => { sidePanelTab = 'trade'; }}
      >Trade</button>
      <button
        type="button"
        role="tab"
        aria-selected={sidePanelTab === 'liquidity'}
        class="flex-1 rounded px-3 py-2.5 text-center text-sm font-semibold transition-colors
               focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
               {sidePanelTab === 'liquidity'
                 ? 'bg-card text-foreground shadow-sm'
                 : 'text-muted-foreground hover:text-foreground'}"
        onclick={() => { sidePanelTab = 'liquidity'; }}
      >Liquidity</button>
    </div>

    <!-- Widget content — preserve existing {#if} conditions exactly -->
    {#if market.marketData.resolutionState === ResolutionState.RESOLUTION_OPEN}
      {#if sidePanelTab === 'trade'}
        <MarketStakingContainer market={market} {userStake} {preselectIndex} />
      {:else}
        <MarketLiquidityContainer
          market={market}
          {marketAccounting}
          userLPTokensShares={userLPTokensShares}
          onRefreshUserData={onRefreshUserData}
        />
      {/if}
    {:else}
      <MarketStakingContainer market={market} {userStake} {preselectIndex} />
    {/if}

  </aside>

  <!-- Main column: charts + comments — SECOND in DOM; placed in col 1 via explicit grid placement -->
  <main class="min-w-0 space-y-6 lg:col-start-1 lg:row-start-1">
    <div class="overflow-hidden rounded-md border border-border bg-card p-4 sm:p-6">
      <MarketCharts market={market} showTvl={false} showStake={true} />
    </div>
    <MarketComments {thread} market={market} {userStake} />
  </main>

</div>
```

**Key constraints:**
- `lg:top-16` = 64px — matches the `h-16` header height.
- `lg:col-start-2 lg:row-start-1` on `<aside>` + `lg:col-start-1 lg:row-start-1` on `<main>` = visual column flip with mobile-first DOM order.
- If the current file uses different prop names (e.g. `leaderAndMarketsData`, different condition variable), adapt to the actual prop names — do NOT invent new ones.
- The `sidePanelTab` variable and `ResolutionState` are already in the `<script>` block. The onclick handlers preserve existing logic.

> **Panel.svelte note:** every `<MarketStakingContainer>` renders inside `bm-ui/Panel.svelte` internally. `Panel.svelte`'s container class is built in a `$derived` expression — it cannot be changed without a `<script>` edit. The trade widget outer chrome will still carry some Tier-1 from Panel until a separate "bm-ui Panel fix" prompt. Do NOT try to fix Panel here.

---

## UX additions

- **Sticky sidebar:** `lg:sticky lg:top-16 lg:self-start` on the aside — trade widget stays in view while user scrolls the comments thread.
- **Tab strip focus rings:** both tab buttons have `focus-visible:ring-2 focus-visible:ring-ring` — keyboard accessible.
- **Mobile stacking:** trade widget is first in DOM, so on small screens it stacks above charts without JS reordering.

---

## Verification

Run after editing. Both must return zero hits before committing.

```bash
# Tier-1 leakage
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-market/src/lib/MarketContainer.svelte

# Arbitrary values
rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market/src/lib/MarketContainer.svelte
```

Then visually verify in the browser (`pnpm dev`):
- Two-column layout at `lg+`: trade widget in sticky RIGHT sidebar.
- Mobile (`< lg`): trade widget stacks ABOVE charts.
- Sticky sidebar stays visible while scrolling comments thread on `lg+`.
- Tab strip (Trade / Liquidity): active tab is `bg-card`; focus ring visible on keyboard nav.

## Definition of done

- CSS grid layout with sticky right sidebar at `lg+`.
- Trade widget first in DOM, renders above charts on mobile.
- Tab strip is token-correct with focus rings.
- Zero Tier-1 palette utilities in the file.
- No `<script>` changes. No prop changes. Zero behavior change.
