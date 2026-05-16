# Homepage · B-03 — MarketEntry

**File:** `packages/bm-market-homepage/src/lib/components/markets/MarketEntry.svelte`
**Model:** Haiku 4.5
**Time:** ~8 min
**Depends on:** `00-token-wiring` + B-02 landed.

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

One file: `packages/bm-market-homepage/src/lib/components/markets/MarketEntry.svelte`

## Tier-1 classes to replace

| Current (Tier-1) | Replace with (Tier-2) |
|---|---|
| `bg-gray-100` | `bg-muted` |
| `bg-gray-800`, `bg-gray-900` | `bg-card` |
| `text-orange-600`, `text-orange-500` | `text-primary` |
| `bg-orange-600`, `bg-orange-500` | `bg-primary` |
| `bg-green-50` | `bg-success-soft` |
| `border-green-200` | `border-success-border` |
| `text-green-700` | `text-success` |
| `bg-red-50` | `bg-destructive-soft` |
| `border-red-200` | `border-destructive-border` |
| `text-red-700` | `text-destructive` |

## Intent notes

- The green/red pill badges on market cards represent YES/NO or UP/DOWN outcome prices — use `success-soft/success` and `destructive-soft/destructive` tokens respectively.
- The card surface should use `bg-card text-card-foreground` so it lifts off the page background in both themes.
- Card hover: `hover:bg-card/80` or `hover:shadow-md` — keep whichever is present, just token-correct the colors.

## UX additions (apply alongside the token sweep)

- **Tabular numerics:** add `tabular-nums` to every numeric element — probability %, TVL/volume amounts, countdown. Numbers must not jitter when live data updates.
- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to the card's `<a>` title link and the YES/NO outcome buttons.
- **`fmtProbability` helper:** the script block currently has a raw `optionChance` function. You are authorized to add ONE import and swap it:
  ```ts
  import { fmtProbability } from '@bigmarket/bm-utilities';
  // replace the return value:
  return fmtProbability(v); // outputs "42% chance" / "<1% chance" / ">99% chance"
  ```
  This is the only `<script>` change authorized in this file. Do not touch `$state`, `$derived`, `$effect`, or `onMount`.
- **No `text-[Npx]` arbitrary sizes:** replace any `text-[12px]`, `text-[11px]`, `text-[10px]` with `text-xs`. Never below 12px.
- **Motion guard:** if `animate-pulse` is on the live indicator dot, confirm the global `prefers-reduced-motion` guard in `layout.css` covers it.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-market-homepage/src/lib/components/markets/MarketEntry.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market-homepage/src/lib/components/markets/MarketEntry.svelte
```

## Definition of done

- Zero Tier-1 palette utilities in the file.
- Market card renders in light and dark with correct surface/text contrast.
- YES/NO price badges use `price-up-soft/price-up` and `price-down-soft/price-down` token pairs.
- Probability % uses `fmtProbability` and `tabular-nums`.
- Card title link and outcome buttons have visible focus rings.
