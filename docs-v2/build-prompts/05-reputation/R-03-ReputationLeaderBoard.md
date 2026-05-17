# Reputation · R-03 — ReputationLeaderBoard

**File:** `apps/frontend-c1/src/lib/components/reputation/ReputationLeaderBoard.svelte`
**Model:** Haiku 4.5
**Time:** ~5 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`apps/frontend-c1/src/lib/components/reputation/ReputationLeaderBoard.svelte`

## Note

The Explore agent did not capture specific classes for this file. Read it first, then apply the standard mapping:

| Pattern | Replace with |
|---|---|
| `text-orange-*` | `text-primary` |
| `text-gray-4xx/5xx` | `text-muted-foreground` |
| `text-gray-7xx/8xx/9xx` | `text-foreground` |
| `bg-gray-*` | `bg-muted` or `bg-card` |
| `border-gray-*` | `border-border` |
| `text-purple-*` | `text-community` |
| `text-green-*` | `text-success` |
| `text-yellow-*` | `text-warning` |

## UX additions

- **Tabular numerics:** add `tabular-nums` to all scores and rank numbers — alignment critical in a leaderboard.
- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to any row links.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  apps/frontend-c1/src/lib/components/reputation/ReputationLeaderBoard.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  apps/frontend-c1/src/lib/components/reputation/ReputationLeaderBoard.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. Scores and ranks carry `tabular-nums`. Focus rings on row links. Light + dark parity.
