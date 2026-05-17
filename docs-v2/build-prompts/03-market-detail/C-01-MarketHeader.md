# Market Detail · C-01 — MarketHeader

**File:** `packages/bm-market/src/lib/market/version2/MarketHeader.svelte`
**Model:** Haiku 4.5
**Time:** ~5 min
**Depends on:** `00-token-wiring` + `01-app-chrome` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Semantic tokens handle dark mode. Output: one file diff + 3-bullet PR summary.

---

## Scope

`packages/bm-market/src/lib/market/version2/MarketHeader.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `bg-gray-100` | Light surface | `bg-muted` |
| `bg-gray-800`, `bg-gray-900` | Dark card surface | `bg-card` |
| `text-orange-600`, `text-orange-400` | Primary accent | `text-primary` |
| `bg-orange-600` | Primary button/badge | `bg-primary` |

## UX additions

- **Tabular numerics:** add `tabular-nums` to volume, TVL, and end-date fields.
- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to any interactive element (share button, category link).
- **Live dot:** if a live indicator dot exists (`animate-pulse`), confirm the global `prefers-reduced-motion` guard in `layout.css` covers it.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-market/src/lib/market/version2/MarketHeader.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market/src/lib/market/version2/MarketHeader.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. Light + dark parity. Numeric fields carry `tabular-nums`. Focus rings on interactive elements.
