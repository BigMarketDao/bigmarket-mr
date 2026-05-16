# 02 — Homepage

**Depends on:** `00-token-wiring` + `01-app-chrome` landed.
**Route:** `/` → `apps/frontend-c1/src/routes/+page.svelte`

## Current state
`B-homepage.md` sweeps all 9 homepage components in one prompt (~60–90 min, medium risk).

## Recommended split (component-by-component)
Break `B-homepage.md` into smaller prompts — one per component. Each takes 5–10 min, easy to test in isolation.

| # | Prompt (to be created) | Component | File |
|---|------------------------|-----------|------|
| B-01 | *(pending)* | `FilteredMarketView` | `packages/bm-market-homepage/src/lib/components/FilteredMarketView.svelte` |
| B-02 | *(pending)* | `CategoryButton` | `packages/bm-market-homepage/src/lib/components/markets/CategoryButton.svelte` |
| B-03 | *(pending)* | `MarketEntry` | `packages/bm-market-homepage/src/lib/components/markets/MarketEntry.svelte` |
| B-04 | *(pending)* | `Gauge` | `packages/bm-market-homepage/src/lib/components/markets/Gauge.svelte` |
| B-05 | *(pending)* | `MarketResolutionData` | `packages/bm-market-homepage/src/lib/components/markets/MarketResolutionData.svelte` |
| B-06 | *(pending)* | `CommentsHomepage` | `packages/bm-market-homepage/src/lib/components/markets/CommentsHomepage.svelte` |
| B-07 | *(pending)* | `InfoPanelContainer` | `packages/bm-market-homepage/src/lib/components/InfoPanelContainer.svelte` |
| B-08 | *(pending)* | `LeaderBoardDisplay` | `packages/bm-market-homepage/src/lib/components/leader-board/LeaderBoardDisplay.svelte` |
| B-09 | *(pending)* | `MarketPlace` (route wrapper) | `apps/frontend-c1/src/lib/components/home/MarketPlace.svelte` |

## Files
| File | Status |
|------|--------|
| `B-homepage.md` | Existing — full sweep (use if you want speed over granularity) |
| `B-01` … `B-09` | To be written — one component each |
