# Market Detail · C-17 — OrderBook

**File:** `packages/bm-market/src/lib/market/version2/OrderBook.svelte`
**Model:** Haiku 4.5
**Time:** ~8 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`packages/bm-market/src/lib/market/version2/OrderBook.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `text-gray-400`, `text-gray-600` | Muted text | `text-muted-foreground` |
| `text-gray-700`, `text-gray-800` | Body text | `text-foreground` |
| `text-green-400`, `text-green-500` | Buy / bid price | `text-price-up` |
| `text-red-400`, `text-red-500` | Sell / ask price | `text-price-down` |
| `text-blue-300`, `text-blue-400` | Info / mid price | `text-info` |

## UX additions

- **Tabular numerics:** add `tabular-nums` to ALL price and size cells — this is critical for an order book; digits must align perfectly in the column.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-market/src/lib/market/version2/OrderBook.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market/src/lib/market/version2/OrderBook.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. Buy/sell sides use `price-up` / `price-down`. ALL price and size cells carry `tabular-nums`. Light + dark parity.
