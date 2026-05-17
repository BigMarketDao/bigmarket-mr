# 03 — Market Detail Page

**Depends on:** `00-token-wiring` + `01-app-chrome` landed.
**Route:** `/market/[marketId]/[marketType]` → `packages/bm-market/`

## Current state
`C-market-detail.md` sweeps ~20 components in one prompt (~60–90 min, high risk).

## Recommended split (component-by-component)
| # | Prompt (to be created) | Component | File |
|---|------------------------|-----------|------|
| C-01 | *(pending)* | `MarketHeader` | `packages/bm-market/src/lib/market/version2/MarketHeader.svelte` |
| C-02 | *(pending)* | `MarketStatsBar` | `packages/bm-market/src/lib/market/version2/MarketStatsBar.svelte` |
| C-03 | *(pending)* | `MarketDetails` | `packages/bm-market/src/lib/market/version2/MarketDetails.svelte` — **not on live route** |
| C-21 | *(pending)* | `MarketResolutionCriteria` | `packages/bm-market/src/lib/market/MarketResolutionCriteria.svelte` — **live resolution criteria box** |
| C-04 | *(pending)* | `MarketStaking` | `packages/bm-market/src/lib/market/version2/MarketStaking.svelte` |
| C-05 | *(pending)* | `StakingButton` | `packages/bm-market/src/lib/market/version2/do-stake/StakingButton.svelte` |
| C-06 | *(pending)* | `SlippageSlider` | `packages/bm-market/src/lib/market/version2/do-stake/SlippageSlider.svelte` |
| C-07 | *(pending)* | `SharePriceInfo` | `packages/bm-market/src/lib/market/version2/do-stake/SharePriceInfo.svelte` |
| C-08 | *(pending)* | `MarketLiquidity` | `packages/bm-market/src/lib/market/version2/MarketLiquidity.svelte` |
| C-09 | *(pending)* | `MarketVoting` | `packages/bm-market/src/lib/market/version2/MarketVoting.svelte` |
| C-10 | *(pending)* | `MarketResolving` | `packages/bm-market/src/lib/market/version2/MarketResolving.svelte` |
| C-11 | *(pending)* | `MarketClaiming` | `packages/bm-market/src/lib/market/version2/MarketClaiming.svelte` |
| C-12 | *(pending)* | `ClaimWinnings` | `packages/bm-market/src/lib/market/version2/do-claim/ClaimWinnings.svelte` |
| C-13 | *(pending)* | `ResolutionBanner` | `packages/bm-market/src/lib/market/version2/do-resolve/ResolutionBanner.svelte` |
| C-14 | *(pending)* | `AgentResolveMarket` | `packages/bm-market/src/lib/market/version2/do-resolve/AgentResolveMarket.svelte` |
| C-15 | *(pending)* | `MarketCharts` | `packages/bm-market/src/lib/market/version2/MarketCharts.svelte` |
| C-16 | *(pending)* | `StakeChart` | `packages/bm-market/src/lib/market/version2/do-charts/StakeChart.svelte` |
| C-17 | *(pending)* | `TVLChart` | `packages/bm-market/src/lib/market/version2/do-charts/TVLChart.svelte` |
| C-18 | *(pending)* | `MarketComments` | `packages/bm-market/src/lib/market/version2/MarketComments.svelte` |
| C-19 | *(pending)* | `OrderBook` | `packages/bm-market/src/lib/market/version2/OrderBook.svelte` |
| C-20 | *(pending)* | `MarketSummary` | `packages/bm-market/src/lib/MarketSummary.svelte` |

## Files
| File | Status |
|------|--------|
| `C-market-detail.md` | Existing — full sweep (use if you want speed over granularity) |
| `C-01` … `C-20` | To be written — one component each |
