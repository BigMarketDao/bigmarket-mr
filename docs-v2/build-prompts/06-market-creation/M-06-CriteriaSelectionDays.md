# Market Creation · M-06 — CriteriaSelectionDays

**File:** `packages/bm-create-market/src/lib/CriteriaSelectionDays.svelte`
**Model:** Haiku 4.5
**Time:** ~5 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`packages/bm-create-market/src/lib/CriteriaSelectionDays.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `text-gray-700` | Body text | `text-foreground` |
| `text-gray-300` | Muted text | `text-muted-foreground` |
| `text-orange-500` | Accent / selected | `text-primary` |
| `text-red-600` | Validation error | `text-destructive` |
| `text-amber-600` | Warning / deadline hint | `text-warning` |

## UX additions

- **Tabular numerics:** add `tabular-nums` to the day count display.
- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to day selection buttons.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-create-market/src/lib/CriteriaSelectionDays.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-create-market/src/lib/CriteriaSelectionDays.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. Day count carries `tabular-nums`. Selection buttons have focus rings. Light + dark parity.
