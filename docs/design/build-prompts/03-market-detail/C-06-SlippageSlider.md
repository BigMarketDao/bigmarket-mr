# Market Detail · C-06 — SlippageSlider

**File:** `packages/bm-market/src/lib/market/version2/do-stake/SlippageSlider.svelte`
**Model:** Haiku 4.5
**Time:** ~5 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`packages/bm-market/src/lib/market/version2/do-stake/SlippageSlider.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `bg-gray-900` | Dark surface | `bg-card` |
| `bg-gray-100` | Light surface | `bg-muted` |

## UX additions

- **Tabular numerics:** add `tabular-nums` to the slippage % display value.
- **Focus rings:** ensure the slider `<input type="range">` has `focus-visible:ring-2 focus-visible:ring-ring` or that the browser default focus indicator is not suppressed.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-market/src/lib/market/version2/do-stake/SlippageSlider.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market/src/lib/market/version2/do-stake/SlippageSlider.svelte
```

## Definition of done

- Zero Tier-1 palette utilities. Slider renders correctly in light + dark. Slippage % carries `tabular-nums`.
