# Market Creation · M-01 — MainInformation

**File:** `packages/bm-create-market/src/lib/MainInformation.svelte`
**Model:** Haiku 4.5
**Time:** ~8 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`packages/bm-create-market/src/lib/MainInformation.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `bg-gray-50`, `bg-gray-100` | Muted surface | `bg-muted` |
| `bg-gray-900` | Dark card | `bg-card` |
| `text-gray-700`, `text-gray-900` | Body / heading text | `text-foreground` |
| `text-gray-300` | Muted placeholder | `text-muted-foreground` |
| `border-gray-200`, `border-gray-300` | Input border | `border-border` |
| `text-orange-500` | Label accent | `text-primary` |
| `bg-orange-100`, `bg-orange-200`, `bg-orange-300` | Tag soft surface | `bg-primary/10` |
| `border-orange-700` | Tag border | `border-primary` |
| `text-red-300`, `text-red-500`, `text-red-600` | Validation error | `text-destructive` |
| `bg-red-200` | Error soft | `bg-destructive-soft` |

## UX additions

- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to all form inputs and buttons (complement `@tailwindcss/forms` base styles).
- **Error state:** validation error messages should use `role="alert"` or `aria-live="polite"` if not already set — do not add this if it would require a `<script>` change; just flag it.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-create-market/src/lib/MainInformation.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-create-market/src/lib/MainInformation.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. Form inputs, tags, and validation errors use semantic tokens. Focus rings on inputs and buttons. Light + dark parity.
