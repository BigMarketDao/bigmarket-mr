# My Markets · U-01 — UserClaim

**File:** `apps/frontend-c1/src/lib/components/my-markets/UserClaim.svelte`
**Model:** Haiku 4.5
**Time:** ~5 min
**Depends on:** `00-token-wiring` + `01-app-chrome` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`apps/frontend-c1/src/lib/components/my-markets/UserClaim.svelte`

## Note

The Explore agent did not capture specific classes for this file. Read it first, then apply the standard mapping:

| Pattern | Replace with |
|---|---|
| `text-orange-*` | `text-primary` |
| `text-gray-4xx/5xx` | `text-muted-foreground` |
| `text-gray-7xx/8xx/9xx` | `text-foreground` |
| `bg-gray-*` | `bg-muted` or `bg-card` |
| `border-gray-*` | `border-border` |
| `text-green-*` (winnings) | `text-success` |
| `text-red-*` (loss/error) | `text-destructive` |

## UX additions

- **Tabular numerics:** add `tabular-nums` to all amounts (winnings, pending, claimable).
- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to the claim button.
- **CTA touch target:** `h-11 md:h-10` on the primary claim button.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  apps/frontend-c1/src/lib/components/my-markets/UserClaim.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  apps/frontend-c1/src/lib/components/my-markets/UserClaim.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. Amounts carry `tabular-nums`. Claim button has focus ring and meets touch target. Light + dark parity.
