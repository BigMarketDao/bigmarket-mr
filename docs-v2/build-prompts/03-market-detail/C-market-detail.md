# Build Prompt C — Market detail page (Claude Code or Cursor with quality model)

**Use this for:** migrating the market-detail page to the new token system — layout grid restructure, sticky trade widget, tab-strip Tier-1 sweep, KPI strip, time-range tab note, and the inline numeric / motion / a11y rules.

**Recommended model:** Claude Code (or Cursor Auto for the mechanical sweeps after the layout shell is correct).

**Prerequisites:** Build Prompt A landed. Build Prompt B0 landed (so `bm-ui` Card / Button / PageContainer leakage is fixed and the chrome proves the pipeline).

> **Panel.svelte dependency:** every trade widget renders inside `<Panel>` from `bm-ui`. `Panel.svelte`'s container class is built in a `$derived` expression in its `<script>` block — the guardrail prevents changing it here. The trade-widget outer chrome will still use Tier-1 from Panel until a dedicated "bm-ui Panel fix" prompt runs. Track separately; do not block this PR on it.

**Estimated time:** 60–90 minutes.

**Paste everything below this line into a fresh agent session.**

---

## Guardrails (do not break)

```text
DO NOT change behavior.

Allowed files (and only these):
- apps/frontend-c1/src/routes/market/[marketId]/[marketType]/+page.svelte                   (bg sweep — 1 line; Task 1a)
- packages/bm-market/src/lib/MarketContainer.svelte                                           (layout grid restructure + tab-strip Tier-1 sweep; Task 1b)
- packages/bm-market/src/lib/MarketSummary.svelte                                             (Tier-1 sweep; Task 3)
- packages/bm-market/src/lib/market/MarketResolutionCriteria.svelte                           (Tier-1 sweep; Task 8)
- packages/bm-market/src/lib/market/version2/MarketHeader.svelte                              (Tier-1 sweep + KPI strip; Task 2)
- packages/bm-market/src/lib/market/version2/MarketCharts.svelte                              (Tier-1 sweep + time-range tab note; Task 4)
- packages/bm-market/src/lib/market/version2/MarketStaking.svelte                             (outcome buttons + inner chrome sweep; Task 6; DO NOT touch staking logic)
- packages/bm-market/src/lib/market/version2/market-staking-components/MarketStakingPurchaseAmount.svelte  (CTA + Tier-1 sweep — 126 matches; Task 7 + Task 8)
- packages/bm-market/src/lib/market/version2/MarketComments.svelte                            (Tier-1 sweep; Task 8)
- packages/bm-market/src/lib/market/version2/MarketResolving.svelte                           (Tier-1 sweep; Task 8)
- packages/bm-market/src/lib/market/version2/MarketVoting.svelte                              (Tier-1 sweep; Task 8)
- packages/bm-market/src/lib/market/version2/MarketClaiming.svelte                            (Tier-1 sweep; Task 8)
- packages/bm-market/src/lib/market/version2/MarketLiquidity.svelte                           (Tier-1 sweep; Task 8)
- packages/bm-market/src/lib/market/version2/do-resolve/ResolutionBanner.svelte               (status tokens; Task 8)
- packages/bm-market/src/lib/market/version2/do-stake/SlippageSlider.svelte                   (Tier-1 sweep; Task 8)
- packages/bm-market/src/lib/market/version2/do-stake/SharePriceInfo.svelte                   (Tier-1 sweep; Task 8)
- packages/bm-market/src/lib/market/version2/do-stake/StakingButton.svelte                    (Tier-1 sweep only; Task 8)
- packages/bm-market/src/lib/market/version2/do-stake/StakingButtonClassic.svelte             (Tier-1 sweep only; Task 8)
- packages/bm-market/src/lib/market/version2/do-stake/StakingCoolDown.svelte                  (Tier-1 sweep; Task 8)

NOT in scope (dead code on the live route — do not edit):
- MarketStatsBar.svelte — not imported anywhere on the market-detail render path
- MarketDetails.svelte  — not imported anywhere on the market-detail render path
- OrderBook.svelte      — not imported anywhere on the market-detail render path

Forbidden:
- Any edit outside the files above.
- ANY edit to Svelte <script> blocks that own state, $effect, $derived, $state, $props, onMount,
  store subscribers, SDK calls, API calls. Markup + classes ONLY.
  Exception: class ternaries in the TEMPLATE (not script) are markup — you may change the class
  values inside those ternaries (e.g., changing 'bg-gray-100' to 'bg-muted' inside a {condition ?
  'class-a' : 'class-b'} expression). Do not change the condition or the JavaScript around it.
- New dependencies.
- DaisyUI.
- Tier-1 palette utilities anywhere (gray-*, zinc-*, etc.). Use tokens.
- Arbitrary values: no text-[Npx], no bg-[#abc], no shadow-[0_6px_...]. Use tokens or existing utilities.
- Binding price-down to the destructive name. Use price-down.
- The ¢ glyph.
- Changing chart libraries, chart data, or chart series. Chart palette stays as-is (tracked as debt).

If a visual change requires a logic change, STOP and flag.
```

---

## Required reading (read fully BEFORE editing)

1. `docs-v2/tokens-and-rules.lock.md`.
2. `docs-v2/current-vs-target.md` §3 Gap 2 (trade widget), §3 Gap 6 (live data).
3. `docs-v2/design/design-philosophy.md` §5 (market-detail register).
4. The route file: `apps/frontend-c1/src/routes/market/[marketId]/[marketType]/+page.svelte` (full).
5. `packages/bm-market/src/lib/MarketContainer.svelte` (full — this is the real layout root).
6. `packages/bm-market/src/lib/MarketSummary.svelte` (full).
7. `packages/bm-market/src/lib/market/version2/MarketHeader.svelte`, `MarketCharts.svelte`, `MarketStaking.svelte` (full).

Reference screenshots (read if needed for visual guidance): `docs/design/assets/polymarket/{market details - BTC Up or Down 5m*.png, market details - West Ham*.png, market details - Hantavirus*.png, order book.png}`.

Do NOT open other files. If you think you need to, stop and flag.

---

## Task 1 — Layout restructure

### 1a. Route file `+page.svelte` — bg sweep only

The route renders only `<MarketContainer>` (all layout lives there). The only Tier-1 in the route is the outer div's background:

Replace (line ~111):
```
class="min-h-screen bg-gray-50 dark:bg-gray-900"
```
With:
```
class="min-h-screen bg-background"
```

No other change to this file. Preserve all `<script>` lines, props, and the `<PageContainer>` + `<MarketContainer>` rendering exactly.

### 1b. `MarketContainer.svelte` — restructure grid + sweep Tier-1

Read the file first. The current layout (lines ~116–179) is `flex flex-col gap-6 md:flex-row` with the trade-widget sidebar at `md:w-1/3` (left) and the chart/comments column at `md:w-2/3` (right).

**Target: flip to a CSS grid, push the trade widget to the right sticky sidebar.**

Replace the outer grid div and its two child columns. The trade widget MUST be first in DOM order (so on mobile it stacks above charts). Use explicit grid placement to put it visually on the right at `lg` breakpoint:

```svelte
<div class="mt-6 grid gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">

  <!-- Trade/Liquidity sidebar — FIRST in DOM for mobile stacking (appears above charts on small screens) -->
  <aside class="space-y-4 lg:sticky lg:top-16 lg:self-start lg:col-start-2 lg:row-start-1">
    {#if market.marketData.resolutionState === ResolutionState.RESOLUTION_OPEN}
      <!-- Tab strip: preserve ALL onclick handlers exactly; change classes only -->
      <div
        class="flex rounded-md border border-border bg-muted p-1"
        role="tablist"
        aria-label="Market actions"
      >
        <button
          type="button"
          role="tab"
          aria-selected={sidePanelTab === 'trade'}
          class="flex-1 rounded px-3 py-2.5 text-center text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring {sidePanelTab === 'trade'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'}"
          onclick={() => { sidePanelTab = 'trade'; }}
        >Trade</button>
        <button
          type="button"
          role="tab"
          aria-selected={sidePanelTab === 'liquidity'}
          class="flex-1 rounded px-3 py-2.5 text-center text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring {sidePanelTab === 'liquidity'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'}"
          onclick={() => { sidePanelTab = 'liquidity'; }}
        >Liquidity</button>
      </div>
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

  <!-- Main column: charts + comments — SECOND in DOM; placed in col 1 at lg via explicit grid placement -->
  <main class="min-w-0 space-y-6 lg:col-start-1 lg:row-start-1">
    <!-- Chart card -->
    <div class="overflow-hidden rounded-md border border-border bg-card p-4 sm:p-6">
      <MarketCharts market={market} showTvl={false} showStake={true} />
    </div>
    <MarketComments {thread} market={market} {userStake} />
  </main>

</div>
```

**Constraints:**
- Preserve every prop on `<MarketStakingContainer>`, `<MarketLiquidityContainer>`, `<MarketCharts>`, `<MarketComments>` exactly.
- Preserve every `{#if}` condition exactly. Only the wrapping classes and element types change.
- `lg:top-16` = 64 px offset — matches the actual `h-16` header height in `HeaderMenuTailwind.svelte`.
- `lg:col-start-2 lg:row-start-1` on `<aside>` + `lg:col-start-1 lg:row-start-1` on `<main>` creates the visual column flip while keeping DOM order mobile-friendly.
- The chart wrapper div replaces the current `class="overflow-hidden rounded-lg border border-gray-200 bg-white p-4 sm:p6 dark:border-gray-700 dark:bg-gray-800"` (lines ~168–170).
- Also sweep the `MarketResolutionCriteria` line below the grid — it's markup-only and just needs `class` changes if any.

---

## Task 2 — `MarketHeader.svelte` (title + KPI strip)

Class-only sweep of Tier-1 → tokens. Then add the KPI strip pattern if the component already renders volume / end-date / live fields:

- Title: `h1` or `h2` with `class="text-2xl md:text-3xl font-bold text-foreground"`.
- Subtitle / category breadcrumb (if present): `text-sm text-muted-foreground`.
- KPI strip pattern:

```svelte
<div class="flex items-center gap-3 text-sm text-muted-foreground">
  <span class="tabular-nums">{volumeLabel}</span>
  <span aria-hidden="true">·</span>
  <span class="tabular-nums">{endsLabel}</span>
  <span aria-hidden="true">·</span>
  <!-- Only render the live pill if the existing component already exposes a live-active state.
       If it does not, do NOT invent one — just render volume / ends labels. -->
  <span class="inline-flex items-center gap-1.5">
    <span class="size-2 rounded-full bg-live-indicator animate-pulse" aria-hidden="true"></span>
    Live
  </span>
</div>
```

Numbers carry `tabular-nums`. Do not invent state, props, or handlers that don't already exist.

---

## Task 3 — `MarketSummary.svelte` (market overview cards)

Class-only Tier-1 sweep. Read the file first to understand its current structure. Apply the card pattern to each summary stat:

```svelte
<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
  <!-- per stat -->
  <div class="flex items-center gap-4 rounded-md bg-card text-card-foreground border border-border p-4">
    <div>
      <div class="text-sm text-muted-foreground">{stat.label}</div>
      <div class="text-lg font-semibold tabular-nums whitespace-pre-line">
        {stat.value}
      </div>
    </div>
  </div>
</div>
```

Adapt to the actual component structure (it may use a different loop or static items — read it first). Sweep all Tier-1 → tokens. Add `tabular-nums` to every numeric display. Container uses `bg-card border-border` (not `border-purple-600/20`).

---

## Task 4 — `MarketCharts.svelte` (Tier-1 sweep; time-range tabs deferred)

**Important:** read `MarketCharts.svelte` before editing. This component currently accepts only `{ market, showTvl, showStake }` and has **no time-range selector logic**. Do NOT add time-range state or handlers — that requires `<script>` changes and is deferred to a future prompt. Add only this comment where a range strip could go:

```svelte
<!-- TODO: time-range tabs (5m / 1H / 6H / 1D / 1W / 1M / All) — requires new script state; tracked separately -->
```

Then perform the class-only Tier-1 sweep:

- Container card: `bg-card text-card-foreground border border-border rounded-md p-4`.
- Any internal `text-gray-*`, `bg-gray-*`, `border-gray-*` → corresponding tokens.
- Chart series colors (ApexCharts hex) are out of scope — leave them as-is (tracked as tech debt).

---

## Task 5 — (No OrderBook task)

> `OrderBook.svelte` is not imported or rendered on the live market-detail page. It is dead code on this route. Do not edit it here. Deferred to a separate prompt that decides "real order book vs recent trades". The `<details>` collapse pattern from the original Prompt C is preserved in the audit history for that future prompt.

---

## Task 6 — `MarketStaking.svelte` (inner chrome + outcome buttons)

This is the trade widget. `MarketStaking.svelte` wraps its content in `<Panel>` from `bm-ui` — the Panel outer container **cannot be changed here** (see Panel.svelte note in prerequisites). Only sweep what lives INSIDE the Panel:

**Inner chrome sweep:**
- Headline / title row classes → tokens.
- Tab labels / eyebrow text → `text-muted-foreground`.
- Error band (if any): `bg-destructive-soft text-destructive border border-destructive-border rounded-md p-3 text-sm`.
- `tabular-nums` on every number.

**Outcome-row buttons** (the Yes/No or categorical option buttons, lines ~339–388):

Two-tier rule — read the existing `{#each}` or `{#if}` to identify market type:

```svelte
<!-- Binary market (2 categories — Yes / No): -->
<!-- Yes button -->
<button class="... border-price-up-soft bg-price-up-soft text-price-up hover:bg-price-up/15
               focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
  Yes
</button>
<!-- No button -->
<button class="... border-price-down-soft bg-price-down-soft text-price-down hover:bg-price-down/15
               focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
  No
</button>

<!-- Categorical market (3+ categories — use outcome-{N} tokens, capped at 4): -->
<!-- Option at index 0 -->
<button class="... border-outcome-1/30 bg-outcome-1/10 text-outcome-1 hover:bg-outcome-1/20 ...">
<!-- Option at index 1 -->
<button class="... border-outcome-2/30 bg-outcome-2/10 text-outcome-2 hover:bg-outcome-2/20 ...">
<!-- Option at index 2 -->
<button class="... border-outcome-3/30 bg-outcome-3/10 text-outcome-3 hover:bg-outcome-3/20 ...">
<!-- Option at index 3 -->
<button class="... border-outcome-4/30 bg-outcome-4/10 text-outcome-4 hover:bg-outcome-4/20 ...">
```

**Do not touch:** any `$state`, `$derived`, `$effect`, `onMount`, store reads, SDK calls. Classes and markup wrapping only. The existing `bg-green-500` / `bg-red-500` / `bg-orange-500` cluster on the outcome buttons is the Tier-1 leakage to replace.

---

## Task 7 — CTA button in `MarketStakingPurchaseAmount.svelte`

The submit / buy CTA lives in `MarketStakingPurchaseAmount.svelte`. Read the file to locate the submit `<button>`. It currently uses something like `bg-primary-600 hover:bg-primary-700` or `bg-green-500`. Replace it with:

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
  <!-- existing slot / label — preserve exactly -->
</button>
```

`h-11 md:h-10` = 44 px touch on mobile, 40 px on desktop (meets hit-target rule). Do not change props, slots, or any `<script>` logic.

Note: `StakingButton.svelte` and `StakingButtonClassic.svelte` are the **cool-down refund buttons** (not the trade CTA). They are in scope for Tier-1 sweep in Task 8, but do NOT apply the CTA shape to them.

---

## Task 8 — Sweep all remaining files

For each remaining file in scope (`MarketResolutionCriteria`, `MarketComments`, `MarketResolving`, `MarketVoting`, `MarketClaiming`, `MarketLiquidity`, `ResolutionBanner`, `SlippageSlider`, `SharePriceInfo`, `StakingButton`, `StakingButtonClassic`, `StakingCoolDown`, and the remaining Tier-1 in `MarketStakingPurchaseAmount`):

- Class-only.
- Tier-1 → tokens.
- Arbitrary values → tokens or standard utilities.
- Add `tabular-nums` to numeric elements.
- Add `focus-visible:ring-2 focus-visible:ring-ring` to interactive elements that don't already have it.
- ResolutionBanner three-state mapping:
  - Resolving: `bg-warning-soft text-warning border border-warning-border rounded-md p-3`
  - Resolved: `bg-success-soft text-success border border-success-border rounded-md p-3`
  - Awaiting: `bg-info-soft text-info border border-info-border rounded-md p-3`

`MarketStakingPurchaseAmount.svelte` is heavy (~126 Tier-1 matches). Do it **last** — by then the patterns are repetitive and mechanical.

---

## Verification (in PR summary)

```bash
# 1. Type + lint + build
pnpm --filter @bigmarket/frontend-c1 check
pnpm --filter @bigmarket/frontend-c1 lint

# 2. Tier-1 leakage — only the files this prompt migrated (MUST RETURN ZERO)
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret|accent)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  apps/frontend-c1/src/routes/market/marketId/marketType/+page.svelte \
  packages/bm-market/src/lib/MarketContainer.svelte \
  packages/bm-market/src/lib/MarketSummary.svelte \
  packages/bm-market/src/lib/market/MarketResolutionCriteria.svelte \
  packages/bm-market/src/lib/market/version2/MarketHeader.svelte \
  packages/bm-market/src/lib/market/version2/MarketCharts.svelte \
  packages/bm-market/src/lib/market/version2/MarketStaking.svelte \
  packages/bm-market/src/lib/market/version2/market-staking-components/MarketStakingPurchaseAmount.svelte \
  packages/bm-market/src/lib/market/version2/MarketComments.svelte \
  packages/bm-market/src/lib/market/version2/MarketResolving.svelte \
  packages/bm-market/src/lib/market/version2/MarketVoting.svelte \
  packages/bm-market/src/lib/market/version2/MarketClaiming.svelte \
  packages/bm-market/src/lib/market/version2/MarketLiquidity.svelte \
  packages/bm-market/src/lib/market/version2/do-resolve/ResolutionBanner.svelte \
  packages/bm-market/src/lib/market/version2/do-stake/SlippageSlider.svelte \
  packages/bm-market/src/lib/market/version2/do-stake/SharePriceInfo.svelte \
  packages/bm-market/src/lib/market/version2/do-stake/StakingButton.svelte \
  packages/bm-market/src/lib/market/version2/do-stake/StakingButtonClassic.svelte \
  packages/bm-market/src/lib/market/version2/do-stake/StakingCoolDown.svelte

# 3. Arbitrary values in migrated files (MUST RETURN ZERO)
rg -n '(bg|text|border|ring|fill|stroke|shadow|outline|outline-offset)-\[' \
  packages/bm-market/src/lib/MarketContainer.svelte \
  packages/bm-market/src/lib/market/version2/MarketStaking.svelte \
  packages/bm-market/src/lib/market/version2/market-staking-components/MarketStakingPurchaseAmount.svelte

# 4. Dev — open a real market URL on devnet
pnpm dev
# → open http://localhost:8081/market/<marketId>/<marketType> in light and dark
# Visually confirm:
#   a. Two-column layout at lg+; trade widget in sticky RIGHT sidebar.
#   b. Trade widget stacks ABOVE charts on mobile (< lg breakpoint).
#   c. Sticky trade widget stays in view while scrolling the comments thread on lg+.
#   d. Tab strip (Trade / Liquidity) uses token colors; active tab is bg-card.
#   e. Outcome buttons: Yes = price-up-soft, No = price-down-soft; categorical = outcome-{N}.
#   f. Submit CTA is bg-accent text-accent-foreground, h-11 on mobile.
#   g. Numbers are tabular (no jitter on update / scroll).
#   h. ResolutionBanner (if market is in resolving state) uses warning-soft / success-soft / info-soft.
#   i. With macOS "Reduce motion": no infinite pulse on the live pill (if present).
```

**Note on grep paths:** the route file is at
`apps/frontend-c1/src/routes/market/[marketId]/[marketType]/+page.svelte` — the brackets in the
directory name may need quoting or escaping in your shell. Adjust as needed.

If grep 2 or grep 3 returns any line, **fix before commit**.

---

## PR summary template

```
Market detail — two-column grid + sticky widget + Tier-2 tokens (19 files)

What changed:
- +page.svelte: bg-gray-50/gray-900 → bg-background (1 line)
- MarketContainer.svelte: flex-row → grid lg:grid-cols-[1fr_360px]; trade widget moved to sticky
  right sidebar via explicit grid placement; tab-strip + chart-card Tier-1 swept.
- MarketSummary.svelte: Tier-1 swept to bg-card / border-border / tabular-nums pattern.
- MarketHeader.svelte: Tier-1 swept; KPI strip tabular-nums applied.
- MarketCharts.svelte: Tier-1 swept; time-range tabs deferred (TODO comment added).
- MarketStaking.svelte: outcome buttons → price-up/price-down (binary) / outcome-{N} (categorical);
  inner chrome swept; Panel outer container NOT changed (tracked as separate bm-ui prompt).
- MarketStakingPurchaseAmount.svelte: submit CTA → bg-accent h-11/h-10; 126 Tier-1 matches swept.
- 11 other files in packages/bm-market swept to tokens.

What did NOT change:
- Zero <script> body changes (template class ternaries updated; all logic unchanged).
- No SDK / API / store / contract / event-handler edit.
- No new deps. No chart redesign. No trade-widget redesign. Panel.svelte not touched.
- MarketStatsBar / MarketDetails / OrderBook not touched (not rendered on this route).

Verification:
- Tier-1 grep on 19 migrated paths: 0 hits.
- Arbitrary-values grep: 0 hits.
- Typecheck / lint: ok.
- Visual: two-column grid, sticky sidebar, token outcome buttons confirmed in light + dark (screenshots).
- Mobile: trade widget stacks above charts confirmed (screenshot).
- Reduced motion: confirmed (screenshot).
```

---

## What this prompt does NOT do (deferred — fine for now)

- `bm-ui/Panel.svelte` outer container fix → separate "bm-ui Panel fix" prompt.
- Real order book vs recent-trades decision and implementation → later prompt.
- Chart series palette (`outcome-1..4` for lines) → tokens exist; chart code still uses hex. Later.
- Trade widget redesign (Buy/Sell tabs, quick chips, pre-flight modal) → separate effort.
- `do-charts/StakeChart.svelte`, `do-charts/TVLChart.svelte`, `do-claim/ClaimWinnings.svelte`, `do-vote/DaoMintingInput.svelte`, `do-vote/DaoVotingPowerInput.svelte`, `do-resolve/{AgentResolveMarket, DisputeResolution, FinaliseMarket, ResolvedInRange}.svelte` — all have Tier-1 leakage but are out of scope here. They will still show in a repo-wide grep. Fix in a follow-up sweep prompt.
- Wallet modal welcome redesign. Tracked.

If anything feels missing while working, **STOP and ask**, do not improvise.
