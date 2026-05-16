# Market Detail · C-14 — StakeChart

**File:** `packages/bm-market/src/lib/market/version2/do-charts/StakeChart.svelte`
**Model:** Sonnet 4.6
**Time:** ~15 min
**Depends on:** `00-token-wiring` landed.

> **Use Sonnet 4.6** — this file has 13 hardcoded hex values used as chart series colors. Requires judgment about which outcome token maps to which series.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Do NOT modify any chart library configuration logic — only color references. Hex in JS arrays inside `<script>` must be moved to CSS variable references. No arbitrary values. Output: one file diff + 3-bullet PR summary.

---

## Scope

`packages/bm-market/src/lib/market/version2/do-charts/StakeChart.svelte`

> **Lock alignment:** Prompt A defines `outcome-1..4` only and defers `chart-*` tokens (`docs-v2/build-prompts/A-token-wiring.md` §What this prompt does NOT do). Map extra series and structural chrome to **existing** semantic variables below — do not reference undefined `--color-outcome-5` or `--color-chart-*`.

## Hex values to replace

These hex values appear as chart series colors. Replace each with the corresponding CSS variable.

| Current hex | Intent | Replace with CSS var |
|---|---|---|
| `#ea580c` | Series 1 — primary/orange | `var(--color-outcome-1)` |
| `#22c55e` | Series 2 — green / YES | `var(--color-outcome-2)` |
| `#3b82f6` | Series 3 — blue | `var(--color-outcome-3)` |
| `#a855f7` | Series 4 — purple | `var(--color-outcome-4)` |
| `#eab308` | Series 5 — yellow (no `outcome-5` yet) | `var(--color-warning)` |
| `#06b6d4` | Series 6 — cyan (no `outcome-6` yet) | `var(--color-info)` |
| `#ec4899` | Series 7+ (if present) | `var(--color-community)` |
| `#14b8a6` | Teal series | `var(--color-info)` |
| `#f97316` | Orange variant | `var(--color-primary)` |
| `#84cc16` | Lime series | `var(--color-success)` |
| `#374151` | Grid / axis dark (no `chart-grid` until PROMPTS Step 8) | `var(--color-border)` |
| `#6b7280` | Axis label | `var(--color-muted-foreground)` |
| `#4b5563` | Axis line | `var(--color-border)` |

## How to apply

If hex appears in a JS color array in `<script>`:
```js
// Before
const colors = ['#ea580c', '#22c55e', ...]

// After — read CSS vars at runtime
const colors = [
  getComputedStyle(document.documentElement).getPropertyValue('--color-outcome-1').trim(),
  getComputedStyle(document.documentElement).getPropertyValue('--color-outcome-2').trim(),
  getComputedStyle(document.documentElement).getPropertyValue('--color-outcome-3').trim(),
  getComputedStyle(document.documentElement).getPropertyValue('--color-outcome-4').trim(),
  getComputedStyle(document.documentElement).getPropertyValue('--color-warning').trim(),
  getComputedStyle(document.documentElement).getPropertyValue('--color-info').trim(),
  // …extend with same table order for any further series (community, primary, success, …)
]
```

If hex appears in markup/SVG attributes, replace with the matching `var(--color-…)` from the table above (not only `outcome-*`).

> If the chart library does not support CSS variables directly, wrap the color resolution in a helper and call it inside `onMount` or the reactive block — but do NOT change the chart rendering logic itself.

## UX additions

- **Motion guard:** if the chart has any `animate-*` or looping CSS transition on chart elements, confirm the global `prefers-reduced-motion` guard in `layout.css` covers it. Flag any indefinitely looping animation in the PR summary.

## Verification

```bash
# Hex literals (must return zero)
rg -n '#[0-9a-fA-F]{3,8}\b' \
  packages/bm-market/src/lib/market/version2/do-charts/StakeChart.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market/src/lib/market/version2/do-charts/StakeChart.svelte
```

## Definition of done

- Zero hex literals anywhere in the file.
- Chart series colors use `outcome-1..4` plus `warning` / `info` / other **defined** semantic tokens from Prompt A — never undefined `outcome-5` / `outcome-6` / `chart-*` until those ship in a token wave.
- Grid/axis use `border` + `muted-foreground` until dedicated `chart-*` tokens exist (`docs-v2/PROMPTS.md` Step 8).
- Chart renders with correct colors in light + dark.
