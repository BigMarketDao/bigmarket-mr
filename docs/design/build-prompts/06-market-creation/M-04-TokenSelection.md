# Market Creation · M-04 — TokenSelection

**File:** `packages/bm-create-market/src/lib/TokenSelection.svelte`
**Model:** Haiku 4.5
**Time:** ~5 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`packages/bm-create-market/src/lib/TokenSelection.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `text-gray-700` | Body text | `text-foreground` |
| `text-gray-200`, `bg-gray-200` | Muted surface | `bg-muted` / `text-muted-foreground` |
| `text-gray-300`, `text-gray-400`, `text-gray-500` | Muted text | `text-muted-foreground` |
| `border-gray-300` | Dropdown border | `border-border` |
| `text-red-600` | Validation error | `text-destructive` |

## UX additions

- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to the dropdown trigger.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-create-market/src/lib/TokenSelection.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-create-market/src/lib/TokenSelection.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. Token dropdown renders correctly in light + dark. Dropdown trigger has focus ring.
