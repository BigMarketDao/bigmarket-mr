# Homepage · B-04 — Gauge

**File:** `packages/bm-market-homepage/src/lib/components/markets/Gauge.svelte`
**Model:** Sonnet 4.6
**Time:** ~10 min
**Depends on:** `00-token-wiring` landed.

> **Use Sonnet 4.6 here**, not Haiku — Gauge uses inline hex in SVG/canvas, which requires judgment about which outcome/price token maps correctly.

---

## Guardrails

DO NOT change behavior.

Allowed: HTML/Svelte markup, CSS class attributes, SVG fill/stroke attributes (replace hex with CSS vars), inline `style=` that references design tokens via CSS vars.

Forbidden: `.ts` logic, `<script>` block content, chart data logic, animation logic, new dependencies, arbitrary values.

Rules:
- Touch ONLY `packages/bm-market-homepage/src/lib/components/markets/Gauge.svelte`.
- Replace all hardcoded hex values with CSS variable references.
- Use only CSS vars from `packages/bm-design/src/theme.css` — no raw hex in final code.
- Output: one file diff + a 3-bullet PR summary. Nothing else.

---

## Scope

One file: `packages/bm-market-homepage/src/lib/components/markets/Gauge.svelte`

## Hex values found — replace with CSS vars

| Current hex | Intent | Replace with |
|---|---|---|
| `#22c55e` | Green — high probability / price up | `var(--color-price-up)` |
| `#eab308` | Yellow — neutral / warning | `var(--color-warning)` |
| `#ef4444` | Red — low probability / price down | `var(--color-price-down)` |

## How to apply in SVG/inline style

If the hex appears in an SVG `fill` or `stroke` attribute:
```svelte
<!-- Before -->
<path fill="#22c55e" ... />

<!-- After -->
<path fill="var(--color-price-up)" ... />
```

If the hex appears in a JS/TS expression inside `<script>` (e.g. a color array for a chart library), **do NOT change it** — flag it in the PR summary instead. Only change markup-side values.

## UX additions (apply alongside the hex replacement)

- **Motion guard:** if the gauge has a `transition` or `animate-*` on the arc/needle, check it respects `prefers-reduced-motion`. The global guard in `layout.css` handles the `@media` rule — just confirm no indefinitely looping animation exists in the markup. Flag it in the PR summary if found.
- **ARIA:** ensure the gauge root has `role="img"` and `aria-label="Probability gauge: {value}%"` (or equivalent) so screen readers can read the value. If aria is already present, leave it as-is.

## Verification

```bash
# Hex literals (must return zero in the template/markup section)
rg -n '#[0-9a-fA-F]{3,8}\b' \
  packages/bm-market-homepage/src/lib/components/markets/Gauge.svelte

# Arbitrary values
rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market-homepage/src/lib/components/markets/Gauge.svelte
```

## Definition of done

- Zero hex literals in the markup/template section of the file.
- Gauge renders with `price-up` / `warning` / `price-down` CSS variable colors.
- Works in both light and dark (CSS vars resolve per theme).
- No indefinitely looping animations without `prefers-reduced-motion` coverage.
