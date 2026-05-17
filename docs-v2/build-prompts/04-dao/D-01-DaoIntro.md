# DAO · D-01 — DaoIntro

**File:** `apps/frontend-c1/src/lib/components/dao/DaoIntro.svelte`
**Model:** Haiku 4.5
**Time:** ~5 min
**Depends on:** `00-token-wiring` + `01-app-chrome` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`apps/frontend-c1/src/lib/components/dao/DaoIntro.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `text-orange-500`, `text-orange-600` | Primary accent | `text-primary` |
| `bg-orange-500`, `bg-orange-600` | Primary button/badge | `bg-primary` |
| `text-gray-600`, `text-gray-400` | Muted text | `text-muted-foreground` |
| `bg-gray-100` | Muted surface | `bg-muted` |

## UX additions

- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to any CTA buttons.
- **CTA touch target:** `h-11 md:h-10` on primary action buttons.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  apps/frontend-c1/src/lib/components/dao/DaoIntro.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  apps/frontend-c1/src/lib/components/dao/DaoIntro.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. DAO intro renders correctly in light + dark. CTAs have focus rings and meet touch target.
