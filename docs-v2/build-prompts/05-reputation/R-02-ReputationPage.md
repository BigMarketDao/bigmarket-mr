# Reputation · R-02 — Reputation route page (inline HTML)

**File:** `apps/frontend-c1/src/routes/reputation/+page.svelte`
**Model:** Sonnet 4.6
**Time:** ~15 min
**Depends on:** `00-token-wiring` + `01-app-chrome` + R-01 landed.

> **Use Sonnet 4.6** — the route file has heavy inline HTML with many Tier-1 utility classes directly in the markup (not extracted into components). Requires judgment to apply tokens consistently across sections.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Do NOT touch the `<script>` block. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`apps/frontend-c1/src/routes/reputation/+page.svelte` — markup and class attributes only.

## Common Tier-1 patterns to sweep (read the file and apply these mappings throughout)

| Pattern | Replace with |
|---|---|
| `text-orange-500`, `text-orange-600` | `text-primary` |
| `bg-orange-500`, `bg-orange-600` | `bg-primary` |
| `text-gray-400`, `text-gray-500` | `text-muted-foreground` |
| `text-gray-700`, `text-gray-800`, `text-gray-900` | `text-foreground` |
| `bg-gray-100`, `bg-gray-200` | `bg-muted` |
| `border-gray-200`, `border-gray-300` | `border-border` |
| `text-green-*` (success context) | `text-success` |
| `text-purple-*` (community context) | `text-community` |
| `text-blue-*` (info context) | `text-info` |
| Lucide icon classes like `text-orange-500` on icons | `text-primary` |

## UX additions (sweep throughout the entire template)

- **Tabular numerics:** add `tabular-nums` to every reputation score, rank number, and stat value in the markup.
- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to any button or link that is missing it.
- **Motion guard:** if `animate-pulse` appears on a live indicator or loading element, confirm the global `prefers-reduced-motion` guard covers it.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  apps/frontend-c1/src/routes/reputation/+page.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  apps/frontend-c1/src/routes/reputation/+page.svelte
```

## Definition of done

- Zero Tier-1 palette utilities in the markup. `<script>` block unchanged. Scores carry `tabular-nums`. Buttons have focus rings. Light + dark parity.
