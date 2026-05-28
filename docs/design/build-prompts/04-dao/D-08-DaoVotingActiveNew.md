# DAO · D-08 — DaoVotingActiveNew

**File:** `apps/frontend-c1/src/lib/components/dao/proposals/dao-voting/ballot-box/DaoVotingActiveNew.svelte`
**Model:** Haiku 4.5
**Time:** ~10 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`apps/frontend-c1/src/lib/components/dao/proposals/dao-voting/ballot-box/DaoVotingActiveNew.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `text-green-500`, `text-green-400`, `text-green-600`, `text-green-700` | Vote FOR | `text-success` |
| `bg-green-400`, `bg-green-600` | Vote FOR button | `bg-success` |
| `text-red-500`, `text-red-400`, `text-red-600`, `text-red-700` | Vote AGAINST | `text-destructive` |
| `bg-red-400`, `bg-red-600` | Vote AGAINST button | `bg-destructive` |
| `text-orange-500` | Abstain / neutral | `text-warning` |
| `bg-gray-800` | Dark surface | `bg-card` |
| `white/50`, `white/10` | Opacity overlays | Keep — these are valid opacity modifiers, not palette tokens |

## UX additions

- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to FOR, AGAINST, and ABSTAIN vote buttons.
- **CTA touch target:** `h-11 md:h-10` on the vote submission buttons — these are primary actions.
- **Tabular numerics:** add `tabular-nums` to voting power amounts displayed.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  apps/frontend-c1/src/lib/components/dao/proposals/dao-voting/ballot-box/DaoVotingActiveNew.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  apps/frontend-c1/src/lib/components/dao/proposals/dao-voting/ballot-box/DaoVotingActiveNew.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. FOR/AGAINST/ABSTAIN buttons use success/destructive/warning. Focus rings present. Touch target met. Voting power carries `tabular-nums`. Light + dark parity.
