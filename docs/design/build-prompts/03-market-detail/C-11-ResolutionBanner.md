# Market Detail · C-11 — ResolutionBanner

**File:** `packages/bm-market/src/lib/market/version2/do-resolve/ResolutionBanner.svelte`
**Model:** Haiku 4.5
**Time:** ~5 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`packages/bm-market/src/lib/market/version2/do-resolve/ResolutionBanner.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `bg-green-100` | Success soft surface | `bg-success-soft` |
| `bg-yellow-200` | Warning soft surface | `bg-warning-soft` |
| `text-yellow-800`, `text-yellow-600` | Warning text | `text-warning` |
| `border-yellow-600` | Warning border | `border-warning-border` |

## Three-state mapping (read the file to identify which states are rendered)

| State | Token pattern |
|---|---|
| **Resolving / pending** | `bg-warning-soft text-warning border border-warning-border rounded-md p-3` |
| **Resolved / settled** | `bg-success-soft text-success border border-success-border rounded-md p-3` |
| **Awaiting / info** | `bg-info-soft text-info border border-info-border rounded-md p-3` |
| **Disputed / error** | `bg-destructive-soft text-destructive border border-destructive-border rounded-md p-3` |

Apply whichever states are actually present in the file. Do not invent states that don't exist.

## UX additions

- **Tabular numerics:** add `tabular-nums` to any block height or countdown shown inside the banner.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-market/src/lib/market/version2/do-resolve/ResolutionBanner.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market/src/lib/market/version2/do-resolve/ResolutionBanner.svelte
```

## Definition of done

- Zero Tier-1 palette utilities.
- Each resolution state uses the correct semantic quad (soft bg + text + border token).
- Light + dark parity without new `dark:` overrides.
