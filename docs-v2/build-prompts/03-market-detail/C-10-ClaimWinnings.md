# Market Detail · C-10 — ClaimWinnings

**File:** `packages/bm-market/src/lib/market/version2/do-claim/ClaimWinnings.svelte`
**Model:** Haiku 4.5
**Time:** ~5 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`packages/bm-market/src/lib/market/version2/do-claim/ClaimWinnings.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `text-green-700`, `text-green-600` | Winnings / success amount | `text-success` |

## UX additions

- **Tabular numerics:** add `tabular-nums` to the winnings amount.
- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to the claim button.
- **CTA touch target:** `h-11 md:h-10` on the claim button.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-market/src/lib/market/version2/do-claim/ClaimWinnings.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market/src/lib/market/version2/do-claim/ClaimWinnings.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. Winnings amount uses `text-success` with `tabular-nums`. Claim button meets touch target and has focus ring.
