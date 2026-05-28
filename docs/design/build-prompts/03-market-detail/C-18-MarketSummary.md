# Market Detail · C-18 — MarketSummary

**File:** `packages/bm-market/src/lib/MarketSummary.svelte`
**Model:** Haiku 4.5
**Time:** ~8 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`packages/bm-market/src/lib/MarketSummary.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `bg-gray-200`, `border-gray-200` | Muted surface / border | `bg-muted` / `border-border` |
| `text-gray-700`, `text-gray-800` | Body / card text | `text-foreground` |
| `bg-blue-100`, `text-blue-100` | Info soft surface | `bg-info-soft` / `text-info` |
| `bg-blue-900` | Info dark surface | `bg-info` |
| `text-blue-400`, `text-blue-600` | Info / link accent | `text-info` |
| `text-green-600` | Success / profit | `text-success` |
| `text-purple-400`, `text-purple-600` | Community accent | `text-community` |
| `text-orange-400`, `text-orange-600` | Primary accent | `text-primary` |

## UX additions

- **Tabular numerics:** add `tabular-nums` to every stat value (TVL, volume, participants, etc.).
- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to any interactive elements.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-market/src/lib/MarketSummary.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market/src/lib/MarketSummary.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. Summary panel renders correctly in light + dark. All stat values carry `tabular-nums`.
