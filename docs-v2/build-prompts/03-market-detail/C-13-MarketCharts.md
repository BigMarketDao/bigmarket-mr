# Market Detail · C-13 — MarketCharts

**File:** `packages/bm-market/src/lib/market/version2/MarketCharts.svelte`
**Model:** Haiku 4.5
**Time:** ~5 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`packages/bm-market/src/lib/market/version2/MarketCharts.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `text-purple-600` | Community / section label | `text-community` |
| `bg-gray-900` | Dark chart background | `bg-card` |
| `bg-gray-100` | Light chart background | `bg-muted` |

## UX additions

- **Time-range tab note:** do NOT add time-range selector logic here (requires `<script>` state). Add only this comment in the markup where a range strip could go:
  ```svelte
  <!-- TODO: time-range tabs (5m / 1H / 6H / 1D / 1W / 1M / All) — requires new script state; tracked separately -->
  ```
- **Tabular numerics:** add `tabular-nums` to any axis label or tooltip value rendered in the markup (not inside chart library config).

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-market/src/lib/market/version2/MarketCharts.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market/src/lib/market/version2/MarketCharts.svelte
```

## Definition of done

- Zero Tier-1 palette utilities in the markup. Chart container uses `bg-card border-border`. Time-range TODO comment added. Light + dark parity.
