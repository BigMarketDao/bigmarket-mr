# Market Detail · C-03 — MarketDetails

**File:** `packages/bm-market/src/lib/market/version2/MarketDetails.svelte`
**Model:** Haiku 4.5
**Time:** ~5 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`packages/bm-market/src/lib/market/version2/MarketDetails.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `text-purple-600` | Community / DAO accent | `text-community` |
| `bg-gray-200`, `border-gray-200` | Muted surface / border | `bg-muted` / `border-border` |
| `text-green-400` | Success / live indicator | `text-success` |

## UX additions

- **Tabular numerics:** add `tabular-nums` to any numeric detail fields.
- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to any interactive elements (expand/collapse, links).

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-market/src/lib/market/version2/MarketDetails.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market/src/lib/market/version2/MarketDetails.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. Renders correctly in light + dark. Numeric fields carry `tabular-nums`.
