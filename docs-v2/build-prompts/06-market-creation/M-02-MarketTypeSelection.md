# Market Creation · M-02 — MarketTypeSelection

**File:** `packages/bm-create-market/src/lib/MarketTypeSelection.svelte`
**Model:** Haiku 4.5
**Time:** ~5 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`packages/bm-create-market/src/lib/MarketTypeSelection.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `text-gray-700` | Body text | `text-foreground` |
| `text-gray-300`, `text-gray-500`, `text-gray-400` | Muted text | `text-muted-foreground` |
| `text-orange-500`, `text-orange-600` | Selected / primary accent | `text-primary` |
| `border-orange-600` | Selected card border | `border-primary` |
| `text-red-600` | Validation error | `text-destructive` |

## UX additions

- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to each market type card/button.
- **Selected state contrast:** selected card should use `border-primary ring-1 ring-primary` for clear visual selection, not just a color change.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-create-market/src/lib/MarketTypeSelection.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-create-market/src/lib/MarketTypeSelection.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. Selected card uses `border-primary ring-1 ring-primary`. Focus rings on cards. Light + dark parity.
