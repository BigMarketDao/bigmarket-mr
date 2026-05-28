# Market Creation · M-09 — LogoDisplay

**File:** `packages/bm-create-market/src/lib/LogoDisplay.svelte`
**Model:** Haiku 4.5
**Time:** ~8 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`packages/bm-create-market/src/lib/LogoDisplay.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `bg-gray-50`, `bg-gray-200` | Upload zone surface | `bg-muted` |
| `text-gray-600`, `text-gray-700`, `text-gray-800` | Body text | `text-foreground` / `text-muted-foreground` |
| `text-gray-400` | Placeholder text | `text-muted-foreground` |
| `border-gray-200` | Upload zone border | `border-border` |
| `text-red-400`, `text-red-500`, `text-red-600`, `text-red-700` | Upload error | `text-destructive` |
| `bg-red-50`, `bg-red-200` | Error soft surface | `bg-destructive-soft` |
| `border-red-700` | Error border | `border-destructive-border` |

## UX additions

- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to the upload zone (it's a button or label element).
- **Upload zone hover:** `hover:border-primary hover:bg-primary/5` gives clear affordance that the zone is interactive.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-create-market/src/lib/LogoDisplay.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-create-market/src/lib/LogoDisplay.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. Upload drop zone has focus ring and hover affordance. Error state uses destructive token quad. Light + dark parity.
