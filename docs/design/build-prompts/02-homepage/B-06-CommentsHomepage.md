# Homepage · B-06 — CommentsHomepage

**File:** `packages/bm-market-homepage/src/lib/components/markets/CommentsHomepage.svelte`
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

One file: `packages/bm-market-homepage/src/lib/components/markets/CommentsHomepage.svelte`

## Tier-1 classes to replace

| Current (Tier-1) | Intent | Replace with (Tier-2) |
|---|---|---|
| `text-purple-600` | Community / DAO accent | `text-community` |
| `text-gray-600` | Secondary text | `text-muted-foreground` |
| `text-gray-400` | Tertiary / placeholder text | `text-muted-foreground` |

## UX additions (apply alongside the token sweep)

- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to any reply/link button.
- **Tabular numerics:** add `tabular-nums` to comment counts or timestamps.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-market-homepage/src/lib/components/markets/CommentsHomepage.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market-homepage/src/lib/components/markets/CommentsHomepage.svelte
```

## Definition of done

- Zero Tier-1 palette utilities in the file.
- Comment text hierarchy preserved using muted-foreground for secondary/tertiary text.
- Numeric counts carry `tabular-nums`.
