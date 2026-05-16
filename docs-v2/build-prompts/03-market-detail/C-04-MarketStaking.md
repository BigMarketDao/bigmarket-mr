# Market Detail · C-04 — MarketStaking

**File:** `packages/bm-market/src/lib/market/version2/MarketStaking.svelte`
**Model:** Haiku 4.5
**Time:** ~10 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`packages/bm-market/src/lib/market/version2/MarketStaking.svelte`

## Tier-1 classes to replace

This component has the most leakage — outcome/prediction colors used for YES/NO/BULL/BEAR buttons.

| Current | Intent | Replace with |
|---|---|---|
| `bg-green-50`, `bg-green-200`, `bg-green-700`, `bg-green-900` | YES/UP outcome surface | `bg-success-soft` / `bg-success` |
| `text-green-500`, `text-green-600`, `text-green-700` | YES/UP text | `text-success` |
| `border-green-200` | YES/UP border | `border-success-border` |
| `bg-red-50`, `bg-red-200`, `bg-red-700`, `bg-red-900` | NO/DOWN outcome surface | `bg-destructive-soft` / `bg-destructive` |
| `text-red-500`, `text-red-600`, `text-red-700` | NO/DOWN text | `text-destructive` |
| `border-red-200` | NO/DOWN border | `border-destructive-border` |
| `bg-orange-50`, `bg-orange-200`, `bg-orange-700`, `bg-orange-900` | BULL/neutral outcome | `bg-warning-soft` / `bg-warning` |
| `text-orange-500`, `text-orange-600`, `text-orange-700` | BULL text | `text-warning` |
| `border-orange-200` | BULL border | `border-warning-border` |
| `bg-gray-200`, `text-gray-700` | Muted surface / text | `bg-muted` / `text-muted-foreground` |

## UX additions (apply alongside the token sweep)

- **Outcome button focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to every outcome button (YES/NO/BULL/BEAR). These are the primary interactive elements on the page.
- **Tabular numerics:** add `tabular-nums` to every price, probability %, or amount field rendered inside this component.
- **Selected state:** the currently selected outcome button should use the full token (e.g. `bg-success text-success-foreground`) not just the soft tint — make the selection visually unambiguous.
- **Panel.svelte note:** this component renders inside `bm-ui/Panel.svelte`. Panel's outer container class is built in a `$derived` expression in its `<script>` block — do NOT try to change Panel. The outer chrome will remain Tier-1 until a separate "bm-ui Panel fix" prompt. Only change what is INSIDE the Panel content.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-market/src/lib/market/version2/MarketStaking.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market/src/lib/market/version2/MarketStaking.svelte
```

## Definition of done

- Zero Tier-1 palette utilities.
- YES/NO/BULL/BEAR outcome buttons visually distinct; selected state uses full token (not just soft tint).
- All outcome buttons have focus rings.
- Numeric fields carry `tabular-nums`.
- Panel.svelte outer container not touched.
- Active (selected) state preserved. Light + dark parity.
