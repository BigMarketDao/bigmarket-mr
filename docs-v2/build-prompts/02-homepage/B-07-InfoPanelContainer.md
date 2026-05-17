# Homepage · B-07 — InfoPanelContainer

**File:** `packages/bm-market-homepage/src/lib/components/InfoPanelContainer.svelte`
**Model:** Haiku 4.5
**Time:** ~5 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior.

Allowed: HTML/Svelte markup, CSS class attributes, spacing, typography, color tokens, radii, shadows, visual states, accessibility attributes.

Forbidden: `.ts` logic, `<script>` block content, new dependencies, DaisyUI utilities, arbitrary values, hex/rgb in components.

Rules:
- Touch ONLY the one file listed in Scope.
- Use only Tier-2 semantic tokens. Never raw palette.
- Output: one file diff + a 3-bullet PR summary. Nothing else.

---

## Scope

One file: `packages/bm-market-homepage/src/lib/components/InfoPanelContainer.svelte`

## Tier-1 classes to replace

| Current (Tier-1) | Intent | Replace with (Tier-2) |
|---|---|---|
| `bg-gray-200` | Muted surface | `bg-muted` |
| `text-gray-700` | Secondary text | `text-muted-foreground` |
| `text-orange-500` | Primary accent | `text-primary` |
| `bg-gray-900` | Dark surface / card | `bg-card` |

## UX additions (apply alongside the token sweep)

- **Tabular numerics:** add `tabular-nums` to any stat values displayed in the panel.
- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to any interactive elements.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-market-homepage/src/lib/components/InfoPanelContainer.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market-homepage/src/lib/components/InfoPanelContainer.svelte
```

## Definition of done

- Zero Tier-1 palette utilities in the file.
- Panel surface and text contrast correct in light and dark.
- Stat values carry `tabular-nums`.
