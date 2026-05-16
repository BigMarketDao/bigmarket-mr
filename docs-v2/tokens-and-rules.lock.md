# tokens-and-rules.lock — what we use to ship homepage + market detail

**Status:** **Locked decisions** for the homepage and market-detail build. This file is the single doc the build prompts in [`build-prompts/`](./build-prompts/) cite. It supersedes "Next wave" entries in [`design/bm-semantic-tokens-proposal.md`](./design/bm-semantic-tokens-proposal.md) **only** for the tokens listed here.

Everything not in this file follows existing canonical docs:

- [`design/styling-contract.md`](./design/styling-contract.md) — rules
- [`design/skeleton-theme-nouveau.md`](./design/skeleton-theme-nouveau.md) — palette baseline
- [`design/design-philosophy.md`](./design/design-philosophy.md) — voice / personality
- [`design/polymarket-analysis.md`](./design/polymarket-analysis.md) — measured reference
- [`current-vs-target.md`](./current-vs-target.md) — plain-English target

If a build prompt or a future doc disagrees with this file, **this file wins for the listed tokens / rules**. Update both this file and `theme.css` + `tokens.ts` in lock-step.

---

## 1. Tokens we land NOW (and the only ones the build prompts may use beyond existing semantics)

All values are aliases to existing Skeleton `nouveau` primitives in `packages/bm-design/src/vendor/skeleton-nouveau.css`. No new primitives. No hex literals in `theme.css` except `overlay`.

### 1.1 Surfaces (Wave 1)

| Token | Light value | Dark value |
|---|---|---|
| `--color-card` | `var(--color-surface-50)` | `var(--color-surface-900)` |
| `--color-card-foreground` | `var(--color-surface-950)` | `var(--color-surface-50)` |
| `--color-popover` | `#fff` (literal — popover always opaque white in light) | `var(--color-surface-900)` |
| `--color-popover-foreground` | `var(--color-surface-950)` | `var(--color-surface-50)` |
| `--color-input` | `var(--color-surface-200)` | `var(--color-surface-800)` |
| `--color-overlay` | `rgba(0, 0, 0, 0.4)` | `rgba(0, 0, 0, 0.65)` |

**Tailwind utility names emitted:** `bg-card`, `text-card-foreground`, `bg-popover`, `text-popover-foreground`, `border-input`, `bg-overlay`.

> **`--color-input` is the BORDER color, not the input background.** This matches the shadcn convention (`--input` = border) and the existing `bm-ui` primitives (`packages/bm-ui/src/lib/components/ui/input/input.svelte`, `popover-content.svelte`, `select-trigger.svelte`, `checkbox.svelte`, `switch.svelte`, `badge-variants.ts`, `button-variants.ts`, `tabs-trigger.svelte`) which already use `border-input`. The input *background* is the page background or `bg-card` — no separate token is needed today.

### 1.2 Status quad (Wave 2 minimum — needed for badges, deltas, banners)

For each of `success`, `warning`, `info`, `destructive`, `accent`:

| Suffix | Light value | Dark value |
|---|---|---|
| `--color-{role}` | `var(--color-{primitive}-500)` | `var(--color-{primitive}-400)` |
| `--color-{role}-foreground` | `var(--color-{primitive}-contrast-500)` | `var(--color-{primitive}-contrast-400)` |
| `--color-{role}-soft` | `color-mix(in oklab, var(--color-{primitive}-500) 12%, transparent)` | `color-mix(in oklab, var(--color-{primitive}-400) 18%, transparent)` |
| `--color-{role}-border` | `var(--color-{primitive}-300)` | `var(--color-{primitive}-700)` |

Primitive mapping:

- `success` → `success` (Skeleton green family)
- `warning` → `warning` (Skeleton amber family)
- `info` → `secondary` (Skeleton cobalt family — same primitives as `accent`; intentional alias)
- `destructive` → `error` (Skeleton red family) — `destructive` itself already exists; add `-soft` + `-border` only
- `accent` → `secondary` (cobalt; same as `info`) — `accent` itself already exists; add `-soft` + `-border` only

### 1.3 Community

| Token | Light | Dark |
|---|---|---|
| `--color-community` | `var(--color-tertiary-500)` | `var(--color-tertiary-400)` |
| `--color-community-foreground` | `var(--color-tertiary-contrast-500)` | `var(--color-tertiary-contrast-400)` |
| `--color-community-soft` | `color-mix(in oklab, var(--color-tertiary-500) 12%, transparent)` | `color-mix(in oklab, var(--color-tertiary-400) 18%, transparent)` |
| `--color-community-border` | `var(--color-tertiary-300)` | `var(--color-tertiary-700)` |

### 1.4 Prediction domain

| Token | Light | Dark | Notes |
|---|---|---|---|
| `--color-price-up` | `var(--color-success-500)` | `var(--color-success-400)` | aliases `success` value but **never share the name** |
| `--color-price-up-foreground` | `var(--color-success-contrast-500)` | `var(--color-success-contrast-400)` | |
| `--color-price-up-soft` | `color-mix(in oklab, var(--color-success-500) 12%, transparent)` | `color-mix(in oklab, var(--color-success-400) 18%, transparent)` | |
| `--color-price-down` | `var(--color-error-500)` | `var(--color-error-400)` | aliases `destructive` value but **never share the name** |
| `--color-price-down-foreground` | `var(--color-error-contrast-500)` | `var(--color-error-contrast-400)` | |
| `--color-price-down-soft` | `color-mix(in oklab, var(--color-error-500) 12%, transparent)` | `color-mix(in oklab, var(--color-error-400) 18%, transparent)` | |
| `--color-price-neutral` | `var(--color-muted-foreground)` | `var(--color-muted-foreground)` | re-uses muted foreground |
| `--color-live-indicator` | `var(--color-error-500)` | `var(--color-error-400)` | red dot — pulse only when actually live (see §3) |
| `--color-selected` | `var(--color-secondary-500)` | `var(--color-secondary-400)` | cobalt — used as a ring on colored cards |

### 1.5 Outcome series (starter 1..4 only)

| Token | Light | Dark |
|---|---|---|
| `--color-outcome-1` | `var(--color-warning-500)` | `var(--color-warning-400)` |
| `--color-outcome-2` | `var(--color-success-500)` | `var(--color-success-400)` |
| `--color-outcome-3` | `var(--color-secondary-500)` | `var(--color-secondary-400)` |
| `--color-outcome-4` | `var(--color-tertiary-500)` | `var(--color-tertiary-400)` |

**For 5+ outcomes today:** display the top 4 outcomes with these tokens and a "+N more" pill in `muted-foreground`. Algorithmic generation is deferred to a later wave.

---

## 2. Numeric formatting (inline rules — no separate helper file required today)

The homepage build prompt MAY add **one** helper file (`packages/bm-utilities/src/lib/format-extras.ts`) that wraps these rules — but it is not required. If the prompt inlines the formatters, that is fine for v1.

| Surface | Rule | Example |
|---|---|---|
| Probability (binary / categorical / scalar) | `XX% chance` for whole numbers; `<1% chance` and `>99% chance` at extremes | `42% chance` |
| Signed change | `▲ +X.X%` (`price-up`) or `▼ X.X%` (`price-down`) — always colored; `flat` returns `0.0%` muted | `▲ +3.4%` |
| Compact currency | ≤999 = full digits with locale separators; ≥1,000 = compact (`$1.5K`, `$1.2M`, `$3.4B`) | `$1.5K` |
| Crypto amount | `X.XXXX sBTC` max 4 decimals, trailing zeros trimmed (use existing `trimTrailingZeros`) | `0.012 sBTC` |
| Time / countdown | Relative `Ends in 2:34` under 1h; `Ends in Xd Yh` over 1h; absolute UTC for resolved | `Ends in 6d 4h` |
| Address | `0xABCD…WXYZ` (4 + 4 chars, ellipsis between), `font-mono tabular-nums`, copy on click | `ST1H…QXY8` |

**Mandatory CSS rule:** every element rendering a price / percent / balance / countdown / address wraps in `tabular-nums`. Crypto addresses additionally use `font-mono`.

**Never:** `¢` (cents-per-share) anywhere. We use `%` for chance and `$` (or our token symbol) for amounts.

---

## 3. Interaction rules (inline)

### Motion

- Three durations: `120ms` (state), `200ms` (enter/exit), `320ms` (page).
- Two easings: `cubic-bezier(.16, 1, .3, 1)` for enter/exit; `cubic-bezier(.4, 0, .2, 1)` for state transitions.
- Live dot: `animation: pulse 2s cubic-bezier(.4, 0, .6, 1) infinite`.
- **Mandatory reduced-motion CSS** in `apps/frontend-c1/src/routes/layout.css` or `theme.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Focus

- All interactive controls: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none`.
- Ring offset color = `bg-background` (so the ring sits on the page background).

### Hit target

- `≥36px` desktop, `≥44px` mobile. Use `min-h-9 md:min-h-9` for buttons; `min-h-11 md:min-h-9` for primary CTAs (44 px on touch).

### Live regions

- Price / chance values that update: wrap in `<span aria-live="polite">{value}</span>`.
- TX status changes (in `TxModal.svelte`): `aria-live="assertive"`.

### Errors

- Tone: one sentence what + one sentence what next. Never start with "Error:". See [`current-vs-target.md`](./current-vs-target.md) §3 Gap 5 examples.

---

## 4. Forbidden, project-wide (re-stated for build agents)

- ❌ Tier-1 palette utilities (`gray-*`, `zinc-*`, `slate-*`, `orange-500`, …) in feature code. Token, or it doesn't ship.
- ❌ Arbitrary values: `text-[13px]`, `bg-[#abc]`, `shadow-[0_6px_18px_rgba(...)]`, `ring-[3px]`. Add a token, or use an existing one.
- ❌ `¢` numeric format. Anywhere.
- ❌ `dark:bg-*` on Tier-1 utilities — use a token whose `.dark` override does the work.
- ❌ Decorative infinite animations (aurora, shimmer skeletons over 600 ms). Motion is affordance, not decoration.
- ❌ Binding `price-down` to the `destructive` *name*. Values may match; names never collide.
- ❌ Touching `<script>` blocks that own state / stores / SDK / API / events. Behavior preservation per `PROMPTS.md` guardrails.

---

## 5. What this file does NOT cover (and the doc that does, when you need it)

| Concern | Owner doc |
|---|---|
| Trade widget anatomy / pre-flight modal | (deferred; not needed for homepage or market-detail-view-only) |
| Order book real-vs-recent-trades decision | (deferred; defaults to **collapsed** on market detail) |
| Wallet modal welcome shape | (deferred; existing `ConnectLanes.svelte` keeps working) |
| Charts library (ApexCharts) | [`design/skeleton-theme-nouveau.md`](./design/skeleton-theme-nouveau.md) §Charts |
| Chart-structure tokens (`chart-grid`, etc.) | deferred; charts render with existing ad-hoc colors for v1; tracked as tech debt |
| Six-variant Button (adding `tertiary` + `soft`) | deferred — current 5 variants are enough for homepage + market detail |
| Toasts / notifications | (deferred — `TxModal.svelte` keeps working) |
| Skeletons / empty states beyond inline muted text | (deferred — splash + small per-card loading is enough) |

When you need any of the deferred surfaces, write a 30-minute spec doc against the working code, **then** rebuild — do not improvise.
