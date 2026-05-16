# Market Detail · C-15 — TVLChart

**File:** `packages/bm-market/src/lib/market/version2/do-charts/TVLChart.svelte`
**Model:** Sonnet 4.6
**Time:** ~10 min
**Depends on:** `00-token-wiring` + C-14 landed (same pattern).

> **Lock alignment:** Same as C-14 — Prompt A does **not** add `chart-*` tokens yet. Use structural semantics (`border`, `muted-foreground`) for grid/axis until `docs-v2/PROMPTS.md` Step 8.

> **Use Sonnet 4.6** — same hex-in-chart pattern as StakeChart. Follow the same approach.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Only color references. Output: one file diff + 3-bullet PR summary.

---

## Scope

`packages/bm-market/src/lib/market/version2/do-charts/TVLChart.svelte`

## Hex values to replace

| Current hex | Intent | Replace with CSS var |
|---|---|---|
| `#ea580c` | Primary TVL line | `var(--color-outcome-1)` |
| `#374151` | Grid dark (no `chart-grid` until Step 8) | `var(--color-border)` |
| `#6b7280` | Axis label | `var(--color-muted-foreground)` |
| `#4b5563` | Axis line | `var(--color-border)` |

Follow the same `getComputedStyle` pattern as C-14 if hex is in a JS array.

## Verification

```bash
rg -n '#[0-9a-fA-F]{3,8}\b' \
  packages/bm-market/src/lib/market/version2/do-charts/TVLChart.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market/src/lib/market/version2/do-charts/TVLChart.svelte
```

## Definition of done

- Zero hex literals in the file. TVL chart renders with CSS variable colors in light + dark. Grid/axis use `border` + `muted-foreground` (not `chart-*`) until the token wave in `PROMPTS.md` Step 8.
