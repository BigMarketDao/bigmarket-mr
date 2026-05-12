# Build Prompt B — Homepage (Claude Code or Cursor with quality model)

**Use this for:** migrating the BigMarket homepage to the new token system + the four market-card variants + the inline numeric / motion / a11y rules. This is the **first visible payoff** of the entire refactor.

**Recommended model:** Claude Code (or Cursor Auto for the mechanical class-replacement passes after the first card variant is correct). The first card variant is a design-judgement task; the rest are sweeps.

**Prerequisites:** Build Prompt A landed and merged. New tokens (`bg-card`, `bg-popover`, `price-up`, `outcome-1..4`, `community`, etc.) are emitted by Tailwind.

**Estimated time:** 60–90 minutes including verification.

**Paste everything below this line into a fresh agent session.**

---

## Guardrails (do not break)

```text
DO NOT change behavior.

Allowed files (and only these):
- apps/frontend-c1/src/routes/+page.svelte                                                    (markup + classes only; no <script> body changes)
- apps/frontend-c1/src/app.html                                                               (splash inline CSS only — replace var(--color-gray-900) and literal #667085)
- packages/bm-market-homepage/src/lib/components/markets/MarketEntry.svelte                  (full pass)
- packages/bm-market-homepage/src/lib/components/markets/Gauge.svelte                         (color refs only)
- packages/bm-market-homepage/src/lib/components/markets/MarketResolutionData.svelte         (color refs only)
- packages/bm-market-homepage/src/lib/components/markets/CommentsHomepage.svelte             (color refs only)
- packages/bm-market-homepage/src/lib/components/markets/CategoryButton.svelte
- packages/bm-market-homepage/src/lib/components/FilteredMarketView.svelte
- packages/bm-market-homepage/src/lib/components/InfoPanelContainer.svelte
- packages/bm-market-homepage/src/lib/components/leader-board/LeaderBoardDisplay.svelte
- packages/bm-ui/src/lib/components/ui/card/card.svelte                                       (Tier-1 leakage fix — see Task 2)
- packages/bm-ui/src/lib/components/ui/button/button-variants.ts                              (Tier-1 leakage fix in `outline` variant only)
- packages/bm-utilities/src/lib/format-extras.ts                                              (NEW FILE — see Task 1; this is the only new file allowed)
- packages/bm-utilities/src/lib/index.ts                                                      (re-export format-extras)
- apps/frontend-c1/src/lib/components/template/HeaderMenuTailwind.svelte                      (Tier-1 leakage on splash/header chrome only — see Task 5)
- apps/frontend-c1/src/lib/components/template/AlphaBanner.svelte
- apps/frontend-c1/src/lib/components/template/ReputationCommunityBanner.svelte
- apps/frontend-c1/src/lib/components/template/Footer.svelte

Forbidden:
- Any edit outside the files above.
- ANY edit to Svelte <script> blocks that own state, stores, $effect, $derived, onMount, SDK calls, API calls, routing, event handlers. Markup + classes ONLY.
- New dependencies.
- DaisyUI utilities.
- Tier-1 palette utilities anywhere (gray-*, zinc-*, slate-*, orange-500, red-700, green-50, etc.). Use tokens.
- Arbitrary values: no text-[Npx], no bg-[#abc], no shadow-[0_6px_...], no ring-[3px]. Use the token or the existing Tailwind utility.
- Hex / rgb literals in components (except in app.html splash, which we ARE migrating).
- Binding `price-down` to the `destructive` name. Use `price-down`.
- The `¢` glyph. Use `%` for chance and `$` for amounts.

If a visual change requires a logic change, STOP and flag it in the PR — do not refactor silently.
```

---

## Required reading (read fully BEFORE editing; nothing else)

1. `docs-v2/tokens-and-rules.lock.md` — values + numeric rules + motion + a11y.
2. `docs-v2/current-vs-target.md` §3 Gap 1 (market cards), §3 Gap 3 (numbers), §3 Gap 6 (live data).
3. `docs-v2/design/design-philosophy.md` §4 (professional but approachable table), §6 (do/don't).
4. `docs-v2/design/polymarket-analysis.md` §2.1 (app shell), §2.2 (hero card variants).
5. `packages/bm-market-homepage/src/lib/components/markets/MarketEntry.svelte` — full file.
6. `apps/frontend-c1/src/routes/+page.svelte` — full file.
7. `packages/bm-ui/src/lib/components/ui/card/card.svelte` — lines 1–50 (the Tier-1 leakage you must fix).
8. `packages/bm-ui/src/lib/components/ui/button/button-variants.ts` — lines 30–45 (the `outline` Tier-1 leakage).

Reference screenshots (cite the filename, don't open unless needed): `docs/design/assets/polymarket/{homepage LIGHT.png, homepage DARK.png, homepage hero binary.png, homepage hero categorical.png, homepage hero Sports.png, homepage hero PriceUP:DOWN.png}`.

Do NOT open other files. If you think you need to, stop and flag.

---

## Task 1 — Add `packages/bm-utilities/src/lib/format-extras.ts` (NEW)

Tiny, pure-functions file. No store reads, no API calls. Export:

```ts
/**
 * format-extras — formatters used by the homepage + market detail.
 * Lock: docs-v2/tokens-and-rules.lock.md §2.
 */

export type SignedDelta = { text: string; sign: 'up' | 'down' | 'flat' };

export function fmtProbability(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '<1% chance';
  if (value >= 99.5) return '>99% chance';
  return `${Math.round(value)}% chance`;
}

export function fmtSignedPercent(value: number, decimals = 1): SignedDelta {
  if (!Number.isFinite(value) || Math.abs(value) < 0.05) {
    return { text: '0.0%', sign: 'flat' };
  }
  const sign = value > 0 ? 'up' : 'down';
  const triangle = sign === 'up' ? '▲' : '▼';
  const plus = sign === 'up' ? '+' : '−';
  const abs = Math.abs(value).toFixed(decimals);
  return { text: `${triangle} ${plus}${abs}%`, sign };
}

export function fmtCompact(value: number, currency: string = 'USD'): string {
  if (!Number.isFinite(value)) return '–';
  if (Math.abs(value) < 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function fmtAddressShort(address: string, head = 4, tail = 4): string {
  if (!address || address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

export function fmtCountdownSeconds(secondsRemaining: number): string {
  if (!Number.isFinite(secondsRemaining) || secondsRemaining <= 0) return '0:00';
  if (secondsRemaining < 3600) {
    const m = Math.floor(secondsRemaining / 60);
    const s = Math.floor(secondsRemaining % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
  const days = Math.floor(secondsRemaining / 86400);
  const hours = Math.floor((secondsRemaining % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${Math.floor((secondsRemaining % 3600) / 60)}m`;
}
```

Re-export from `packages/bm-utilities/src/lib/index.ts`:

```ts
export * from './format-extras';
```

(If `index.ts` doesn't exist, search for the existing barrel — typically `packages/bm-utilities/src/index.ts` — and add the re-export there using the right relative path.)

Verify `pnpm --filter @bigmarket/bm-utilities build` passes.

---

## Task 2 — Fix `bm-ui` Tier-1 leakage (blocks card migration)

### 2a. `packages/bm-ui/src/lib/components/ui/card/card.svelte`

Replace every Tier-1 utility in the card root element's class list with semantic tokens. The current class string contains things like `border-zinc-100/70 dark:bg-gray-900 hover:border-zinc-300 bg-zinc-100 dark:hover:border-zinc-700`. Replace with:

```svelte
class="rounded-md bg-card text-card-foreground border border-border
       hover:border-border/60 transition-colors
       p-4 md:p-5"
```

Remove the arbitrary `shadow-[0_6px_20px_rgba(0,0,0,0.06)]` and `hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)]` and the dark variants. Replace with **no shadow** at the root (cards rely on `border-border` for definition); add `shadow-sm` only if a visual regression appears in the PR review.

Preserve all props, slots, and the existing `<script>` block exactly. Markup + class only.

### 2b. `packages/bm-ui/src/lib/components/ui/button/button-variants.ts`

In the `outline` variant only, replace `text-gray-300`, `text-gray-100`, `dark:text-gray-300` with:

```ts
'text-muted-foreground hover:text-foreground'
```

Replace the arbitrary `shadow-[0_6px_18px_rgba(0,0,0,0.08)]` (and its dark twin) on the `default` variant with `shadow-sm`. Touch no other variant. No prop / API change.

---

## Task 3 — Migrate `MarketEntry.svelte` (the homepage card)

This is the heart of the homepage. Read the existing file first; the migration is class-only — every `<script>` line is preserved.

### Replace these Tier-1 classes (exhaustive list — search and replace; verify by eye after):

| Tier-1 (today) | Token (target) |
|---|---|
| `bg-gray-100 dark:bg-gray-800` (logo wrap) | `bg-muted` |
| `text-gray-900 dark:text-gray-100` (title) | `text-foreground` |
| `hover:text-orange-600 dark:hover:text-orange-400` | `hover:text-accent` |
| `focus-visible:ring-orange-500` | `focus-visible:ring-ring` |
| `focus-visible:ring-offset-1` | `focus-visible:ring-offset-2 focus-visible:ring-offset-background` |
| `border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-900/50 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/40` (Yes button) | `border-price-up-soft bg-price-up-soft text-price-up hover:bg-price-up/15` |
| `focus-visible:ring-green-500` | `focus-visible:ring-ring` |
| `border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/40` (No button) | `border-price-down-soft bg-price-down-soft text-price-down hover:bg-price-down/15` |
| `focus-visible:ring-red-500` | `focus-visible:ring-ring` |
| `hover:bg-gray-50 dark:hover:bg-gray-800` (categorical row hover) | `hover:bg-muted` |
| `text-gray-900 dark:text-gray-100` (cat label) | `text-foreground` |
| `text-gray-600 dark:text-gray-400` (cat percent) | `text-muted-foreground` |
| `bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700` (Trade chip) | `bg-muted text-foreground hover:bg-muted/70` |

### Forbidden arbitrary classes to remove

- `text-[12px]` → `text-xs`
- `text-[11px]` → `text-xs`
- `text-[10px]` → `text-xs` (and bump up — `text-[10px]` is too small; never below 12 px in product UI)
- Any `text-[Npx]` instance.

### Numeric formatting changes (must use new helpers)

Current line `MarketEntry.svelte:41-46`:

```ts
const optionChance = (i: number) => {
  if (!totalStakesAll) return '0%';
  const v = ((market.marketData.stakes[i] || 0) / totalStakesAll) * 100;
  if (v > 0 && v < 1) return '<1%';
  return `${v.toFixed(0)}%`;
};
```

You **may** change this `<script>` line ONLY to import and use `fmtProbability` for consistent text:

```ts
import { fmtProbability } from '@bigmarket/bm-utilities';
// ...
const optionChance = (i: number) => {
  if (!totalStakesAll) return '0% chance';
  const v = ((market.marketData.stakes[i] || 0) / totalStakesAll) * 100;
  return fmtProbability(v);
};
```

This is the only script change authorized in this file. Do not touch any `$state`, `$derived`, `$effect`, or `onMount`.

### Tabular-nums

Add `tabular-nums` to every element that renders a number (chance %, vol, countdown):

```svelte
<span class="text-right font-medium text-muted-foreground tabular-nums">
  {optionChance(i)}
</span>
```

### Hover / focus states on the card

Add to the card root (you don't own the `Card` markup directly — but the wrapping `<Card>` import from `@bigmarket/bm-ui` now applies the fix from Task 2 automatically). Ensure the title `<a>` has the standard focus ring (already updated above).

---

## Task 4 — Migrate the rest of `bm-market-homepage/`

Apply the same Tier-1 → token sweep to:

- `FilteredMarketView.svelte`
- `CategoryButton.svelte` (use `bg-muted text-foreground hover:bg-muted/70 data-[active=true]:bg-accent data-[active=true]:text-accent-foreground` for the chip-style category buttons; pick the right `data-*` attribute by reading the current file)
- `InfoPanelContainer.svelte`
- `Gauge.svelte` (replace any hex / Tier-1 with token CSS-vars; the gauge color = `price-up` when ≥50%, else `price-down`)
- `MarketResolutionData.svelte`
- `CommentsHomepage.svelte`
- `leader-board/LeaderBoardDisplay.svelte` (heavier — ~123 Tier-1 matches. Do this one last; it's mechanical.)

For each: no `<script>` body changes. Class-only.

---

## Task 5 — Migrate the chrome (header / banners / footer / splash)

Mechanical sweep, same rules. From the file scope list:

- `apps/frontend-c1/src/lib/components/template/HeaderMenuTailwind.svelte` — Tier-1 sweep.
- `AlphaBanner.svelte` — Tier-1 sweep; the warning tone goes to `bg-warning-soft text-warning border-warning-border`.
- `ReputationCommunityBanner.svelte` — `bg-community-soft text-community border-community-border`.
- `Footer.svelte` — Tier-1 sweep.
- `apps/frontend-c1/src/routes/+page.svelte` — Tier-1 sweep on the homepage layout (column container, section padding, grid gap).
- `apps/frontend-c1/src/app.html` — in the inline `<style>` for the FOUC splash:
  - `background: var(--color-gray-900);` → `background: var(--color-background);`
  - `color: #667085;` → `color: var(--color-muted-foreground);`
  - Any other Tier-1 vars in the splash → use semantic vars from `theme.css`.

---

## Task 6 — Live indicator (homepage shows "Hot topics" but no per-card live yet)

The homepage today does not show a live dot per card; do not add one in this PR. **Reserved for market detail (Build Prompt C).** If you see an existing pulse animation that uses `animate-pulse` on the homepage, ensure it honors `prefers-reduced-motion` (the global guard from Build Prompt A handles this).

---

## Verification (in your PR summary, paste actual output / screenshots)

```bash
# 1. Type check
pnpm --filter @bigmarket/bm-utilities build
pnpm --filter @bigmarket/bm-design typecheck
pnpm --filter frontend-c1 check

# 2. Tier-1 leakage in the migrated files (MUST RETURN ZERO)
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  apps/frontend-c1/src/routes/+page.svelte \
  apps/frontend-c1/src/app.html \
  apps/frontend-c1/src/lib/components/template/HeaderMenuTailwind.svelte \
  apps/frontend-c1/src/lib/components/template/AlphaBanner.svelte \
  apps/frontend-c1/src/lib/components/template/ReputationCommunityBanner.svelte \
  apps/frontend-c1/src/lib/components/template/Footer.svelte \
  packages/bm-market-homepage/src/

# 3. Arbitrary values in the migrated files (MUST RETURN ZERO)
rg -n '(bg|text|border|ring|fill|stroke)-\[' apps/frontend-c1/src/routes/+page.svelte packages/bm-market-homepage/src/

# 4. Lint (any new errors must be fixed; pre-existing errors are out of scope)
pnpm --filter frontend-c1 lint

# 5. Dev server
pnpm dev
# → open http://localhost:8081 in light and dark modes; visually confirm:
#    a. Header / banners / footer look consistent in both themes.
#    b. Market cards have token-based Yes/No coloring, hover and focus rings visible.
#    c. Numbers are tabular (digits don't jitter when scrolling/refreshing).
#    d. The splash (refresh + Cmd-Shift-R) uses the background token, not gray-900.
#    e. Toggle macOS "Reduce motion" — no infinite pulse / shimmer.
```

If grep 2 or grep 3 returns any line, **fix before commit**. They are the hard gates.

---

## PR summary template

```
Homepage migration to Tier-2 tokens

What changed:
- bm-utilities: +format-extras.ts (fmtProbability / fmtSignedPercent / fmtCompact / fmtAddressShort / fmtCountdownSeconds).
- bm-ui Card + Button: fixed internal Tier-1 leakage (audit-report.md §I).
- bm-market-homepage: 8 components migrated to tokens; Yes/No use price-up/price-down.
- apps/frontend-c1 chrome + splash: migrated; app.html splash uses background token.

What did NOT change:
- No <script> logic (except a single import + helper swap in MarketEntry.svelte).
- No SDK / API / store / route / contract change.
- No new deps.

Verification:
- Tier-1 grep across migrated files: 0 hits.
- Arbitrary-values grep across migrated files: 0 hits.
- Typecheck: ok. Lint: ok (no new errors). Build: ok.
- Visual: light + dark parity confirmed (screenshots attached).
- Reduced motion: confirmed (screenshot attached).
```

---

## What this prompt does NOT do (and is fine to defer)

- Trade widget redesign — that's a separate effort.
- Order book — collapsed by default already in market detail; not present on homepage.
- Comments full redesign — class-only sweep here, not a redesign.
- Chart token wiring — `outcome-1..4` ready but `StakeChart.svelte` still uses hex. Tracked as tech debt. Migrate in a later prompt.
- Replacing the `Card` shadow — left for a visual regression pass in review.
- New `<Skeleton />` primitive — homepage uses existing per-card loading state.

If anything else feels missing, **STOP and ask**, do not improvise.
