# Reputation · R-01 — ReputationClaims

**File:** `apps/frontend-c1/src/lib/components/reputation/ReputationClaims.svelte`
**Model:** Haiku 4.5
**Time:** ~10 min
**Depends on:** `00-token-wiring` + `01-app-chrome` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`apps/frontend-c1/src/lib/components/reputation/ReputationClaims.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `bg-gray-200`, `border-gray-200` | Muted surface / border | `bg-muted` / `border-border` |
| `text-gray-400`, `text-gray-500` | Muted text | `text-muted-foreground` |
| `text-gray-700`, `text-gray-900` | Body / heading text | `text-foreground` |
| `text-orange-600`, `text-orange-700` | Primary accent | `text-primary` |
| `bg-orange-100`, `bg-orange-900` | Primary soft surface | `bg-primary/10` |
| `text-red-600`, `bg-red-50`, `bg-red-200` | Destructive / penalty | `text-destructive` / `bg-destructive-soft` |
| `text-purple-700`, `text-purple-800`, `text-purple-900` | Community / high tier | `text-community` |
| `bg-purple-50`, `bg-purple-200`, `bg-purple-300` | Community soft surface | `bg-community/10` |

## UX additions

- **Tabular numerics:** add `tabular-nums` to reputation score, claim amounts, and rank numbers.
- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to claim action buttons.
- **CTA touch target:** `h-11 md:h-10` on the primary claim button.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  apps/frontend-c1/src/lib/components/reputation/ReputationClaims.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  apps/frontend-c1/src/lib/components/reputation/ReputationClaims.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. Tier/rank badges use community token. Claims use destructive for penalties. Scores carry `tabular-nums`. Claim button has focus ring and meets touch target. Light + dark parity.
