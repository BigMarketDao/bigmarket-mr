# Market Detail · C-07 — MarketLiquidity

**File:** `packages/bm-market/src/lib/market/version2/MarketLiquidity.svelte`
**Model:** Haiku 4.5
**Time:** ~10 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`packages/bm-market/src/lib/market/version2/MarketLiquidity.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `bg-gray-50`, `bg-gray-100` | Muted surface | `bg-muted` |
| `bg-gray-900` | Dark card | `bg-card` |
| `text-gray-400`, `text-gray-600` | Muted text | `text-muted-foreground` |
| `text-gray-700`, `text-gray-800` | Body text | `text-foreground` |
| `border-gray-200` | Divider / border | `border-border` |
| `text-emerald-500`, `text-emerald-600`, `text-emerald-700` | LP positive / success | `text-success` |
| `bg-emerald-300`, `bg-emerald-500`, `bg-emerald-600` | LP surface | `bg-success-soft` / `bg-success` |
| `text-amber-600`, `text-amber-700` | Warning / fee highlight | `text-warning` |

## UX additions

- **Tabular numerics:** add `tabular-nums` to LP token amounts, fee %, and pool share values.
- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to add/remove liquidity buttons.
- **CTA button touch target:** if the add/remove LP button is the primary CTA, apply `h-11 md:h-10` (44px mobile / 40px desktop).

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-market/src/lib/market/version2/MarketLiquidity.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market/src/lib/market/version2/MarketLiquidity.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. LP panels render correctly in light + dark. Amounts carry `tabular-nums`. CTA meets touch target.
