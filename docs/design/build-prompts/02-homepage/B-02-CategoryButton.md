# Homepage · B-02 — CategoryButton

**File:** `packages/bm-market-homepage/src/lib/components/markets/CategoryButton.svelte`
**Model:** Haiku 4.5
**Time:** ~5 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior.

Allowed: HTML/Svelte markup, CSS class attributes, spacing, typography, color tokens, radii, shadows, visual states (hover, focus-visible, active, disabled), accessibility attributes (aria-*, role).

Forbidden: `.ts` logic, `<script>` block content (state, stores, effects), new dependencies, DaisyUI utilities, arbitrary values (`text-[14px]`, `bg-[#abc]`, hex/rgb in components).

Rules:
- Touch ONLY the one file listed in Scope.
- Use only Tier-2 semantic tokens. Never raw palette (gray-*, orange-*, etc.).
- Semantic tokens handle dark mode — only add `dark:` for explicit deviations.
- Output: one file diff + a 3-bullet PR summary. Nothing else.

---

## Scope

One file: `packages/bm-market-homepage/src/lib/components/markets/CategoryButton.svelte`

## Tier-1 classes to replace

| Current (Tier-1) | Replace with (Tier-2) |
|---|---|
| `text-orange-600`, `text-orange-400` | `text-primary` |
| `bg-orange-600`, `bg-orange-400` | `bg-primary` |
| `border-orange-600` | `border-primary` |
| `text-gray-500`, `text-gray-400` | `text-muted-foreground` |
| `text-gray-700` | `text-foreground` |
| `bg-gray-200` | `bg-muted` |
| `border-gray-200` | `border-border` |

## Active / selected state note

The active/selected chip likely uses orange for the selected state and gray for the inactive state. Map:
- Selected: `bg-primary text-primary-foreground`
- Inactive: `bg-muted text-muted-foreground hover:bg-muted/80`

## UX additions (apply alongside the token sweep)

- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to the button element.
- **Touch target:** ensure the button has a minimum height of `h-8` (32px) — increase padding if needed, do not change the `<script>`.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-market-homepage/src/lib/components/markets/CategoryButton.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market-homepage/src/lib/components/markets/CategoryButton.svelte
```

## Definition of done

- Zero Tier-1 palette utilities in the file.
- Selected chip is visually distinct from unselected using semantic tokens only.
- Hover state visible on unselected chips.
- Focus ring visible on keyboard navigation. Minimum 32px height.
