# Reputation · R-04 — Leaderboard route page (inline HTML)

**File:** `apps/frontend-c1/src/routes/reputation/leader-board/+page.svelte`
**Model:** Sonnet 4.6
**Time:** ~15 min
**Depends on:** `00-token-wiring` + `01-app-chrome` + R-03 landed.

> **Use Sonnet 4.6** — route file has heavy inline HTML with Lucide icon color classes scattered throughout.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Do NOT touch the `<script>` block. Use only Tier-2 semantic tokens. Output: one file diff + 3-bullet PR summary.

---

## Scope

`apps/frontend-c1/src/routes/reputation/leader-board/+page.svelte` — markup and class attributes only.

## Common patterns to sweep

| Pattern | Replace with |
|---|---|
| `text-orange-500` on Lucide icons | `text-primary` |
| `text-yellow-500` on Trophy icon | `text-warning` |
| `text-gray-400` on Medal/secondary icons | `text-muted-foreground` |
| `text-gray-*` body text | `text-foreground` or `text-muted-foreground` |
| `bg-gray-*` surfaces | `bg-muted` or `bg-card` |
| `border-gray-*` | `border-border` |

## UX additions

- **Tabular numerics:** add `tabular-nums` to all score and rank values in the inline markup.
- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to any interactive rows or links.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  apps/frontend-c1/src/routes/reputation/leader-board/+page.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  apps/frontend-c1/src/routes/reputation/leader-board/+page.svelte
```

## Definition of done

- Zero Tier-1 palette utilities in the markup. `<script>` block unchanged. Lucide icons use semantic token colors. Scores carry `tabular-nums`.
