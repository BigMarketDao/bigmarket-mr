# DAO · D-03 — ProposalGridItem

**File:** `apps/frontend-c1/src/lib/components/dao/proposals/ProposalGridItem.svelte`
**Model:** Haiku 4.5
**Time:** ~8 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`apps/frontend-c1/src/lib/components/dao/proposals/ProposalGridItem.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `text-green-600`, `bg-green-50` | Passed / active status | `text-success` / `bg-success-soft` |
| `text-purple-600` | Community / DAO | `text-community` |
| `text-orange-600`, `bg-orange-50` | Pending / warning status | `text-warning` / `bg-warning-soft` |
| `text-gray-400` | Muted metadata | `text-muted-foreground` |
| `text-blue-600`, `bg-blue-50` | Info / link | `text-info` / `bg-info-soft` |
| `text-red-500`, `bg-red-50` | Rejected / destructive | `text-destructive` / `bg-destructive-soft` |

## UX additions

- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to the proposal card link/button.
- **Tabular numerics:** add `tabular-nums` to vote counts and block heights.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  apps/frontend-c1/src/lib/components/dao/proposals/ProposalGridItem.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  apps/frontend-c1/src/lib/components/dao/proposals/ProposalGridItem.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. Status badges use semantic token quads. Vote counts carry `tabular-nums`. Focus ring on card link. Light + dark parity.
