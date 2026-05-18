# Market Detail · C-02 — MarketStatsBar

**File:** `packages/bm-market/src/lib/market/version2/MarketStatsBar.svelte`
**Model:** Haiku 4.5
**Time:** ~5 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`packages/bm-market/src/lib/market/version2/MarketStatsBar.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `text-purple-600` | Community / DAO accent | `text-community` |
| `bg-gray-800`, `text-gray-800` | Dark surface / text | `bg-card` / `text-foreground` |

## UX additions

- **Tabular numerics:** add `tabular-nums` to all stat values (TVL, volume, participant count).

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-market/src/lib/market/version2/MarketStatsBar.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market/src/lib/market/version2/MarketStatsBar.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. Stats bar renders correctly in light + dark. Stat values carry `tabular-nums`.
