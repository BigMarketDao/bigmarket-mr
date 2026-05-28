# Market Detail · C-16 — MarketComments

**File:** `packages/bm-market/src/lib/market/version2/MarketComments.svelte`
**Model:** Haiku 4.5
**Time:** ~8 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`packages/bm-market/src/lib/market/version2/MarketComments.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `bg-gray-100` | Light surface | `bg-muted` |
| `bg-gray-200` | Muted surface | `bg-muted` |
| `bg-gray-800`, `bg-gray-900` | Dark card | `bg-card` |
| `text-gray-300`, `text-gray-400` | Muted text | `text-muted-foreground` |
| `text-gray-500`, `text-gray-600` | Secondary text | `text-muted-foreground` |
| `border-gray-200`, `border-gray-700` | Divider | `border-border` |
| `text-blue-400` | Link / info accent | `text-info` |
| `text-orange-500`, `text-orange-600` | Primary accent | `text-primary` |

## UX additions

- **Tabular numerics:** add `tabular-nums` to comment counts and timestamps.
- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to the reply/submit button.
- **Submit button touch target:** if a submit button exists, apply `h-11 md:h-10`.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-market/src/lib/market/version2/MarketComments.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market/src/lib/market/version2/MarketComments.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. Comment thread renders correctly in light + dark. Counts carry `tabular-nums`. Submit button has focus ring and touch target.
