# My Markets · U-02 — My Markets route page (inline HTML)

**File:** `apps/frontend-c1/src/routes/my-markets/[address]/+page.svelte`
**Model:** Sonnet 4.6
**Time:** ~20 min
**Depends on:** `00-token-wiring` + `01-app-chrome` + U-01 landed.

> **Use Sonnet 4.6** — this is the largest single route file. Very heavy inline HTML with no sub-components extracted. Requires sustained attention to apply token mapping consistently.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Do NOT touch the `<script>` block. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`apps/frontend-c1/src/routes/my-markets/[address]/+page.svelte` — markup and class attributes only.

## Standard sweep — apply throughout the entire template

| Pattern | Replace with |
|---|---|
| `text-orange-*` | `text-primary` |
| `bg-orange-*` | `bg-primary` |
| `text-gray-400`, `text-gray-500` | `text-muted-foreground` |
| `text-gray-600`, `text-gray-700` | `text-muted-foreground` |
| `text-gray-800`, `text-gray-900` | `text-foreground` |
| `bg-gray-50`, `bg-gray-100` | `bg-muted` |
| `bg-gray-800`, `bg-gray-900` | `bg-card` |
| `border-gray-200`, `border-gray-300` | `border-border` |
| `border-gray-700`, `border-gray-800` | `border-border` |
| `text-green-*` (profit / claimed) | `text-success` |
| `bg-green-*` | `bg-success-soft` or `bg-success` |
| `text-red-*` (loss / unclaimed / error) | `text-destructive` |
| `bg-red-*` | `bg-destructive-soft` |
| `text-blue-*` (info / link) | `text-info` |
| `text-purple-*` (community / reputation) | `text-community` |

## UX additions (sweep throughout the entire template)

- **Tabular numerics:** add `tabular-nums` to ALL amount, stake, and profit/loss values — this is the most amount-heavy page in the app.
- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to every claim/action button that is missing it.
- **CTA touch target:** `h-11 md:h-10` on every primary action button (claim, withdraw, etc.).

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  "apps/frontend-c1/src/routes/my-markets/[address]/+page.svelte"

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  "apps/frontend-c1/src/routes/my-markets/[address]/+page.svelte"
```

## Definition of done

- Zero Tier-1 palette utilities in the markup. `<script>` block unchanged. All amounts carry `tabular-nums`. Action buttons have focus rings and meet touch target. Light + dark parity.
