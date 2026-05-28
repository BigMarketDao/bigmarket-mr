# Homepage · B-01 — FilteredMarketView

**File:** `packages/bm-market-homepage/src/lib/components/FilteredMarketView.svelte`
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
- Use only Tier-2 semantic tokens from `packages/bm-design/src/theme.css`. Never raw palette (gray-*, orange-*, etc.).
- Semantic tokens handle dark mode automatically — only add `dark:` for explicit deviations.
- If a visual change requires a logic change, STOP and flag it. Do not refactor silently.
- Output: one file diff + a 3-bullet PR summary. Nothing else.

---

## Scope

One file: `packages/bm-market-homepage/src/lib/components/FilteredMarketView.svelte`

## Tier-1 classes to replace

| Current (Tier-1) | Replace with (Tier-2) |
|---|---|
| `bg-gray-50`, `bg-gray-100` | `bg-muted` |
| `bg-gray-800`, `bg-gray-900` | `bg-card` |
| `text-gray-200`, `text-gray-300` | `text-muted-foreground` |
| `text-gray-400`, `text-gray-500` | `text-muted-foreground` |
| `border-gray-200`, `border-gray-300` | `border-border` |
| `text-orange-500`, `text-orange-600` | `text-primary` |
| `bg-orange-500`, `bg-orange-600` | `bg-primary` |
| `border-orange-500`, `border-orange-600` | `border-primary` |
| `bg-orange-50` | `bg-primary/10` |
| `bg-green-50` | `bg-success-soft` |
| `border-green-200` | `border-success-border` |
| `text-green-700` | `text-success` |
| `bg-red-50` | `bg-destructive-soft` |
| `border-red-200` | `border-destructive-border` |
| `text-red-700` | `text-destructive` |

## UX additions (apply alongside the token sweep)

- **Tabular numerics:** add `tabular-nums` to every element displaying a count, price, or percentage (e.g. market count badge, TVL).
- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to every `<button>` and `<a>` that does not already have it (filter chips, sort buttons).
- **Motion guard:** if `animate-pulse` or looping `transition-*` is present, confirm the global `prefers-reduced-motion` guard in `layout.css` covers it. Do not add per-element overrides — flag any loops in the PR summary.

## Verification

Run after editing. Both must return zero hits before committing.

```bash
# Tier-1 leakage
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-market-homepage/src/lib/components/FilteredMarketView.svelte

# Arbitrary values
rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market-homepage/src/lib/components/FilteredMarketView.svelte
```

## Definition of done

- Zero Tier-1 palette utilities remaining in the file.
- Dark-mode parity — semantic tokens handle it; no new `dark:` overrides needed.
- Hover/active states on filter chips still visible using token-based classes.
- Numeric elements carry `tabular-nums`. Interactive elements have visible focus rings.
- File renders correctly; market list and filter bar look unchanged structurally.
