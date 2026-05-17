# DAO · D-02 — DaoTabs

**File:** `apps/frontend-c1/src/lib/components/dao/DaoTabs.svelte`
**Model:** Haiku 4.5
**Time:** ~5 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`apps/frontend-c1/src/lib/components/dao/DaoTabs.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `text-orange-500`, `text-orange-600` | Active tab accent | `text-primary` |
| `border-orange-500`, `border-orange-600` | Active tab underline | `border-primary` |
| `text-gray-500`, `text-gray-400` | Inactive tab text | `text-muted-foreground` |
| `text-gray-700` | Hover tab text | `text-foreground` |
| `bg-gray-200`, `border-gray-200` | Tab bar / border | `bg-muted` / `border-border` |
| `border-gray-300` | Divider | `border-border` |

## UX additions

- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to each tab button.
- **ARIA:** ensure `role="tablist"` on the container and `role="tab"` + `aria-selected` on each button (if not already present).

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  apps/frontend-c1/src/lib/components/dao/DaoTabs.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  apps/frontend-c1/src/lib/components/dao/DaoTabs.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. Active tab visually distinct. Hover preserved. Focus rings on tab buttons. Light + dark parity.
