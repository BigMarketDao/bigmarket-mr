# B-03 MarketEntry — CTO follow-up (must-do fixes)

**Branch context:** Homepage market card refactor (`MarketEntry.svelte` + `fmtProbability` in `bm-utilities`).

**Files touched in B-03:**
- `packages/bm-market-homepage/src/lib/components/markets/MarketEntry.svelte`
- `packages/bm-utilities/src/lib/format.ts` (added `fmtProbability` — prerequisite for B-03 import)

---

## Functionality audit summary

**No core behavior was removed.** Navigation, market-state branching, and child components are unchanged.

| Area | Status |
|------|--------|
| Card gating (`inited` + `market.marketData`) | Unchanged |
| Title link + SvelteKit preload | Unchanged |
| Binary CTAs | Same URLs: Yes → `?option=1`, No → `?option=0` |
| Categorical / scalar rows | Still top 2 categories; same `?option=${i}` preselect |
| Gauge on binary (`marketType === 1`, 2 categories) | Unchanged |
| Running vs closed UI | Unchanged (`isRunning`, countdown, resolution footer) |
| `CommentsHomepage`, `MarketResolutionData` | Still rendered |

**Intentional UX changes (by design):**
- Probability copy: `16%` → `16% chance` (via `fmtProbability`)
- Categorical: single **Trade** button → **Yes** + **No** pills (both still link to `?option=${i}`)
- Binary labels: **Yes** / **No** (was Buy Yes / Buy No)
- Tier-2 semantic tokens + layout polish (no Tier-1 palette in `MarketEntry`)

---

## Must-do fixes (before calling B-03 done)

### 1. Fix 0% outcome display (bug)

**Problem:** When an outcome has 0 stake but the market has total volume, `fmtProbability(0)` returns `"<1% chance"` instead of `"0% chance"`.

**Fix (in `MarketEntry.svelte` `optionChance`):**
```ts
if (v === 0) return '0% chance';
return fmtProbability(v);
```

**Optional (shared helper):** Teach `fmtProbability` to distinguish exact zero vs sub-1% if other callers need it.

---

### 2. Categorical / scalar “No” button is misleading (UX)

**Problem:** **Yes** and **No** both navigate to the same `?option=${i}`. This matches the old single **Trade** link functionally, but **No** implies a different action.

**Fix (pick one):**
- **A (safe, markup-only):** Revert to one action per row — **Trade** or **Yes** only — until market detail supports a real “no” side URL.
- **B (product):** Wire **No** to the correct deep link / staking side when the API supports it (requires script + routing clarity, not markup-only).

---

### 3. Replace non-standard `min-w-18` (CSS)

**Problem:** `min-w-18` is used only in `MarketEntry` and may not exist in the Tailwind theme.

**Fix:** Use `min-w-16` (or another token from the design system) on the probability column.

---

## Should-do (follow-up prompts — not blockers for B-03 merge)

| Item | Notes |
|------|--------|
| **Bitcoin / 2-outcome non-type-1** | `marketType === 3` with 2 categories still uses categorical layout (no gauge, small row CTAs). Extend `isBinaryMarket` when script changes are allowed. |
| **`totalStakesAll` not reactive** | Initialized once; live stake updates may show stale %. Sync in `$effect` when script changes are allowed. |
| **Child components still Tier-1** | `Gauge.svelte` (B-04), `CommentsHomepage` (B-06), `MarketResolutionData` (B-05) — footer volume, LIVE dot, gauge colors won’t match reference until those land. |
| **`fmtProbability(0)` at source** | Consider `value === 0` → `"0% chance"` in `format.ts` if all callers should share the rule. |

---

## Verification commands (B-03 definition of done)

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-market-homepage/src/lib/components/markets/MarketEntry.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market-homepage/src/lib/components/markets/MarketEntry.svelte
```

Both should return no matches after B-03 (and after must-do #3 if `min-w-18` is removed).

---

## Manual QA checklist (light + dark)

1. Homepage grid — cards readable on page background; no raw gray/orange utilities on the card.
2. Binary card — gauge right; large **Yes** / **No**; focus rings on title + buttons.
3. Categorical card — two rows; `NN% chance` with stable width (`tabular-nums`).
4. Scalar card — range labels in rows; same row layout as categorical.
5. Closed market — status in body; footer countdown / resolution unchanged.
6. Dark mode — repeat 2–5; contrast on pills and footer divider.

---

*Generated for CTO review — B-03 MarketEntry refactor session.*
