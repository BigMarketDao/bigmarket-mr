# Market Detail · C-09 — MarketClaiming

**File:** `packages/bm-market/src/lib/market/version2/MarketClaiming.svelte`
**Model:** Haiku 4.5
**Time:** ~5 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`packages/bm-market/src/lib/market/version2/MarketClaiming.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `bg-gray-900` | Dark card surface | `bg-card` |
| `bg-gray-100` | Light muted surface | `bg-muted` |

## UX additions

- **Tabular numerics:** add `tabular-nums` to claimable amount fields.
- **CTA touch target:** if the claim button is the primary CTA, apply `h-11 md:h-10` and `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none`.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-market/src/lib/market/version2/MarketClaiming.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market/src/lib/market/version2/MarketClaiming.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. Claim panel renders correctly. Amounts carry `tabular-nums`. CTA has focus ring and meets touch target.
