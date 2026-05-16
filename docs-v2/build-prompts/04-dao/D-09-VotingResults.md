# DAO · D-09 — VotingResults

**File:** `apps/frontend-c1/src/lib/components/dao/proposals/dao-voting/VotingResults.svelte`
**Model:** Haiku 4.5
**Time:** ~8 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`apps/frontend-c1/src/lib/components/dao/proposals/dao-voting/VotingResults.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `text-green-700`, `text-green-600` | FOR votes | `text-success` |
| `bg-green-600` | FOR progress bar | `bg-success` |
| `text-red-500`, `text-red-400`, `text-red-700` | AGAINST votes | `text-destructive` |
| `bg-red-600` | AGAINST progress bar | `bg-destructive` |
| `bg-gray-100` | Light bar track | `bg-muted` |
| `bg-gray-900` | Dark surface | `bg-card` |
| `white/50` | Opacity — keep as-is |

## UX additions

- **Tabular numerics:** add `tabular-nums` to all vote counts and percentages — critical for results readability.
- **Motion guard:** if the progress bar uses `transition-width` or similar animation, confirm `prefers-reduced-motion` guard in `layout.css` covers it.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  apps/frontend-c1/src/lib/components/dao/proposals/dao-voting/VotingResults.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  apps/frontend-c1/src/lib/components/dao/proposals/dao-voting/VotingResults.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. FOR/AGAINST bars use success/destructive. All counts and % carry `tabular-nums`. Light + dark parity.
