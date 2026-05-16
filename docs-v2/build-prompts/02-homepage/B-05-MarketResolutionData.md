# Homepage · B-05 — MarketResolutionData

**File:** `packages/bm-market-homepage/src/lib/components/markets/MarketResolutionData.svelte`
**Model:** Haiku 4.5
**Time:** ~5 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior.

Allowed: HTML/Svelte markup, CSS class attributes, spacing, typography, color tokens, radii, shadows, visual states, accessibility attributes.

Forbidden: `.ts` logic, `<script>` block content, new dependencies, DaisyUI utilities, arbitrary values, hex/rgb in components.

Rules:
- Touch ONLY the one file listed in Scope.
- Use only Tier-2 semantic tokens. Never raw palette.
- Output: one file diff + a 3-bullet PR summary. Nothing else.

---

## Scope

One file: `packages/bm-market-homepage/src/lib/components/markets/MarketResolutionData.svelte`

## Tier-1 classes to replace

| Current (Tier-1) | Intent | Replace with (Tier-2) |
|---|---|---|
| `text-blue-600` | Info / link accent | `text-info` |
| `text-yellow-600` | Warning / pending | `text-warning` |
| `text-red-600` | Error / failed | `text-destructive` |
| `text-purple-600` | Community / DAO | `text-community` |
| `text-gray-800` | Body text | `text-foreground` |
| `bg-gray-800` | Dark surface | `bg-card` |

## UX additions (apply alongside the token sweep)

- **Tabular numerics:** add `tabular-nums` to any block height, date, or numeric field.
- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to any interactive elements (links, buttons).

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-market-homepage/src/lib/components/markets/MarketResolutionData.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market-homepage/src/lib/components/markets/MarketResolutionData.svelte
```

## Definition of done

- Zero Tier-1 palette utilities in the file.
- Resolution status colors map to info / warning / destructive / community tokens.
- Numeric fields carry `tabular-nums`. Renders correctly in light and dark.
