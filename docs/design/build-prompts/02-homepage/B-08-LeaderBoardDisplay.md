# Homepage · B-08 — LeaderBoardDisplay

**File:** `packages/bm-market-homepage/src/lib/components/leader-board/LeaderBoardDisplay.svelte`
**Model:** Haiku 4.5
**Time:** ~8 min
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

One file: `packages/bm-market-homepage/src/lib/components/leader-board/LeaderBoardDisplay.svelte`

## Tier-1 classes to replace

| Current (Tier-1) | Intent | Replace with (Tier-2) |
|---|---|---|
| `text-purple-600` | Community / DAO rank accent | `text-community` |
| `bg-blue-50` | Info tinted surface | `bg-info-soft` |
| `text-blue-600` | Info accent | `text-info` |
| `bg-green-50` | Success tinted surface | `bg-success-soft` |
| `text-green-600` | Success accent | `text-success` |
| `bg-orange-50` | Primary tinted surface | `bg-primary/10` |
| `text-orange-600` | Primary accent | `text-primary` |
| `bg-gray-200`, `border-gray-200` | Muted surface / border | `bg-muted` / `border-border` |
| `text-gray-700` | Secondary text | `text-muted-foreground` |

## UX additions (apply alongside the token sweep)

- **Tabular numerics:** add `tabular-nums` to all score, rank, and volume values — digits must not reflow when scores change.
- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to any leaderboard row that is a link or button.
- **Rank badge contrast:** ensure rank 1/2/3 badges have sufficient text contrast against their tinted backgrounds (use `-foreground` token pair, not the soft tint alone).

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-market-homepage/src/lib/components/leader-board/LeaderBoardDisplay.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market-homepage/src/lib/components/leader-board/LeaderBoardDisplay.svelte
```

## Definition of done

- Zero Tier-1 palette utilities in the file.
- Rank 1/2/3 podium colors use semantic token pairs (background + foreground).
- Score and volume values carry `tabular-nums`.
- Light and dark render correctly without new `dark:` overrides.
