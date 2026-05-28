# 06 — Market Creation Page

**Depends on:** `00-token-wiring` + `01-app-chrome` landed.
**Route:** `/market-mgt` → `packages/bm-create-market/`

## Components to refactor

| # | Prompt | Component | File | Status |
|---|--------|-----------|------|--------|
| M-01 | [M-01](./M-01-MainInformation.md) | `MainInformation` | `packages/bm-create-market/src/lib/MainInformation.svelte` | **Done** |
| M-02 | [M-02](./M-02-MarketTypeSelection.md) | `MarketTypeSelection` | `packages/bm-create-market/src/lib/MarketTypeSelection.svelte` | **Done** |
| M-03 | [M-03](./M-03-CategorySelection.md) | `CategorySelection` | `packages/bm-create-market/src/lib/CategorySelection.svelte` | **Done** |
| M-04 | [M-04](./M-04-TokenSelection.md) | `TokenSelection` | `packages/bm-create-market/src/lib/TokenSelection.svelte` | **Done** |
| M-05 | [M-05](./M-05-LiquiditySelection.md) | `LiquiditySelection` | `packages/bm-create-market/src/lib/LiquiditySelection.svelte` | **Done** |
| M-06 | [M-06](./M-06-CriteriaSelectionDays.md) | `CriteriaSelectionDays` | `packages/bm-create-market/src/lib/CriteriaSelectionDays.svelte` | **Done** |
| M-07 | [M-07](./M-07-CriteriaSelectionSources.md) | `CriteriaSelectionSources` | `packages/bm-create-market/src/lib/CriteriaSelectionSources.svelte` | **Done** |
| M-08 | [M-08](./M-08-Gating.md) | `Gating` | `packages/bm-create-market/src/lib/Gating.svelte` | **Done** |
| M-09 | [M-09](./M-09-LogoDisplay.md) | `LogoDisplay` | `packages/bm-create-market/src/lib/LogoDisplay.svelte` | **Done** |
| M-10 | *(no prompt file yet)* | `PromptMarket` | `packages/bm-create-market/src/lib/prompt/PromptMarket.svelte` | **N/A** — delegates to `@bigmarket/bm-ui`; no Tier-1 classes in file |
| M-11 | *(no prompt file yet)* | Market-mgt route (inline HTML) | `apps/frontend-c1/src/routes/market-mgt/+page.svelte` | **Done** |
