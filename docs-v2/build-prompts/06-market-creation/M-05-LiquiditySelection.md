# Market Creation · M-05 — LiquiditySelection

**File:** `packages/bm-create-market/src/lib/LiquiditySelection.svelte`
**Model:** Haiku 4.5
**Time:** ~5 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`packages/bm-create-market/src/lib/LiquiditySelection.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `text-gray-700` | Body text | `text-foreground` |
| `text-gray-300`, `text-gray-400`, `text-gray-500` | Muted text | `text-muted-foreground` |
| `border-gray-300` | Input border | `border-border` |
| `text-orange-500` | Accent hint | `text-primary` |
| `text-red-300`, `text-red-500`, `text-red-600` | Validation error | `text-destructive` |
| `border-red-300`, `border-red-500` | Error border | `border-destructive-border` |

## UX additions

- **Tabular numerics:** add `tabular-nums` to the liquidity amount input display.
- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring` to the input field (complement `@tailwindcss/forms`).

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-create-market/src/lib/LiquiditySelection.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-create-market/src/lib/LiquiditySelection.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. Error states use destructive token quad. Amount carries `tabular-nums`. Light + dark parity.
