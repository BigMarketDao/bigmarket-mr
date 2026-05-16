# DAO · D-05 — DisputeGridItem

**File:** `apps/frontend-c1/src/lib/components/dao/disputes/DisputeGridItem.svelte`
**Model:** Haiku 4.5
**Time:** ~5 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`apps/frontend-c1/src/lib/components/dao/disputes/DisputeGridItem.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `text-green-600` | Resolved / success | `text-success` |
| `text-purple-600` | Community / DAO | `text-community` |
| `text-gray-400` | Muted metadata | `text-muted-foreground` |

## UX additions

- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to the dispute card link.
- **Tabular numerics:** add `tabular-nums` to any block height or vote count fields.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  apps/frontend-c1/src/lib/components/dao/disputes/DisputeGridItem.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  apps/frontend-c1/src/lib/components/dao/disputes/DisputeGridItem.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. Status colors use semantic tokens. Focus ring on card link. Numeric fields carry `tabular-nums`.
