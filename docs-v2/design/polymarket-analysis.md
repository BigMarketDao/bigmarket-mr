# Polymarket — design-pattern analysis (reference, not template)

**Status:** Result document. Combines (a) measured CSS variables fetched live from polymarket.com (see [`polymarket-research/`](./polymarket-research/)) with (b) annotated readings of the 15 screenshots in `docs/design/assets/polymarket/`. This **closes the audit gap** flagged at `audit-report.md` §G ("the empty Polymarket method template — no measured anchor").

> This doc informs BigMarket component design. It is **not** a list of values to copy. BigMarket runs on Skeleton `nouveau` (yellow-gold brand, condensed Bahnschrift headings) and explicitly aims for a **more approachable**, less intimidating prediction-market UI. The mapping rule is at the end of every section ("Polymarket pattern → BigMarket adaptation"), and the philosophy is in [`design-philosophy.md`](./design-philosophy.md).

> Single-source-rule check: this doc is **supporting**, not canonical. If anything here conflicts with [`styling-contract.md`](./styling-contract.md) or [`bm-semantic-tokens-proposal.md`](./bm-semantic-tokens-proposal.md), those win.

---

## 0. How this doc was produced (so it is reproducible)

1. `curl -sSL -A "<Chrome UA>" https://polymarket.com/` → `polymarket-research/raw/homepage.html` (HTTP 200, 1.5 MB).
2. Extracted four `<link rel="stylesheet">` hrefs (`/_next/static/chunks/*.css`); fetched each with the same UA → `polymarket-research/raw/*.css` (4 files, total ~500 KB).
3. `rg -oN -- '--[a-zA-Z0-9-]+\s*:[^;}]+' polymarket-research/raw/*.css | sort -u` → `polymarket-research/extracted/all-css-variables.txt` (1,449 unique `--var: value` pairs across light + dark).
4. Filtered into themed extracts under `polymarket-research/extracted/` (shadcn-style aliases, brand/neutral scales, status scales, election tier tokens, typography/radius/spacing, animations).
5. Read every screenshot in `docs/design/assets/polymarket/` with image vision; cross-referenced visual claims against the measured tokens.

Each numbered claim below cites either an `extracted/*.txt` line or a screenshot file name.

---

## 1. Headline measured values (what we now know)

### 1.1 Color foundation

| Role | Light | Dark | Source |
|---|---|---|---|
| `--background` (page) | `#fff` (= `--color-neutral-0`) | `#0a0b10` (near-black, slight blue tint) | `extracted/shadcn-style-tokens.txt` |
| `--card` | `#fff` | `#030712` | `extracted/shadcn-style-tokens.txt` |
| `--popover` | `#fff` | `#030712` | same |
| `--border` | `#e5e7eb` | `#1f2937` | same |
| `--muted` | `#f3f4f6` | `#1f2937` | same |
| `--muted-foreground` | `#6b7280` | `#9ca3af` | same |
| `--input` | `#e5e7eb` | `#1f2937` | same |
| `--ring` | `#d1d5db` | `#030712` | same |
| `--accent` (their token name) | `#f3f4f6` (subtle gray, not their brand cobalt) | `#1f2937` | same |
| `--destructive` | `#ef4444` | `#7f1d1d` | same |

**Plus two shadow scales of design-token-as-color-mix that we do not use:** they expose `--alpha-100..950` and split them into `--alpha-black-*` / `--alpha-white-*` so semi-transparent surfaces compose cleanly in both themes (`extracted/all-css-variables.txt`).

### 1.2 Brand and neutral scales

Polymarket ships **its own** `--brand-*` and `--neutral-*` 50→900 scales — they did not adopt a standard palette (Tailwind/Material/Skeleton).

| Token | Light | Dark | Notes |
|---|---|---|---|
| `--brand-500` | `#1452f0` (saturated cobalt blue) | `#0093fd` (brighter cyan-blue for dark) | their **primary CTA color** |
| `--brand-50..900` | warm-tinted blues, 10-step OKLCH-ish | inverted/darker blues | full ramp in `extracted/brand-and-neutral-scales.txt` |
| `--neutral-0` | `#fff` | `#15191d` | the "page" surface, NOT pure black in dark |
| `--neutral-500` | `#7b8996` (slate-500-ish) | `#77808d` | secondary text |
| `--neutral-950` | `#dee3e7` (≈ surface-100) | `#0e0f11` | inverted; this is **primary text on dark**, page bg on light |

**Note the dark-mode inversion.** `--neutral-950` is dark-ink in light mode (text) and **light-ink in dark mode** (still text). They use a single semantic name for "max-contrast text" and let the scale flip — *they do not have a separate `--text` token that points elsewhere in dark mode*. We do the same with Skeleton `surface-*` because that is the standard OKLCH convention.

### 1.3 Status colors via scales (no `--success` / `--warning` / `--info` semantic name)

Polymarket does **not** expose a `--success-*` semantic. Instead, status surfaces are composed at the consumption site:

```
--color-badge-success-bg:  var(--color-green-50)
--color-badge-success-text: var(--color-green-600)
--color-badge-error-bg:    var(--color-red-50)
--color-badge-error-text:  var(--color-red-600)
--color-badge-warning-bg:  var(--color-yellow-50)
--color-badge-warning-text: var(--color-yellow-600)
--color-badge-info-bg:     var(--color-blue-50)
--color-badge-info-text:   var(--color-blue-600)
```

Source: `extracted/semantic-roles.txt` (`--color-badge-*`).

**Implication for BigMarket.** Our proposal (`bm-semantic-tokens-proposal.md`) is *more* ambitious — it names `success / warning / info / destructive / accent` and adds a `* / *-foreground / *-soft / *-border` **quad**. That is fine and idiomatic to shadcn. Polymarket's approach is one valid alternative; we are choosing the more structured one, and we do not need to follow them here.

### 1.4 Buttons (the spine of the trade widget)

```
--color-button-primary-bg:        var(--color-bg-brand)         // = --brand-500
--color-button-primary-bg-hover:  var(--color-bg-brand-hover)   // = --brand-600
--color-button-primary-text:      var(--color-white)
--color-button-secondary-bg:      var(--color-neutral-100)
--color-button-secondary-bg-hover:var(--color-neutral-200)
--color-button-secondary-text:    var(--color-text-primary)
--color-button-tertiary-bg:       var(--color-neutral-50)
--color-button-tertiary-bg-hover: var(--color-neutral-100)
--color-button-ghost-bg:          var(--color-transparent)
--color-button-ghost-bg-hover:    var(--color-neutral-50)
--color-button-outline-border:    var(--color-border)
--color-button-link-text:         var(--color-text-brand)
```

Source: `extracted/semantic-roles.txt`. Note: **`primary`, `secondary`, `tertiary`, `ghost`, `outline`, `link`** — that's six variants. Our `bm-ui` Button has five (`default / secondary / outline / ghost / link / destructive`), missing **tertiary** (a soft mid-emphasis button) and missing **soft** variants for status badges. The audit (`audit-report.md` §B "Buttons") already flagged this.

Plus a **tactile press shadow**:

```
--btn-shadow:  0px calc(var(--btn-shadow-height) * -1) 0px 0px #0000004d inset
--btn-shadow-hover: 0px calc(var(--btn-shadow-height) * -1) 0px 0px #0000001a inset
--btn-transition: transform .12s cubic-bezier(.4,0,.2,1), box-shadow .1s ease-in-out, opacity .1s ease-in-out, background-color .1s ease-in-out
```

This is the inset-shadow trick that makes buttons feel like physical chips — when pressed the inset darkens.

### 1.5 Radius

```
--radius:    0.7rem      // ≈11.2px — the base
--radius-xs: calc(var(--radius) - 6px)  // ≈5.2px
--radius-sm: calc(var(--radius) - 4px)  // ≈7.2px
--radius-md: calc(var(--radius) - 2px)  // ≈9.2px
--radius-lg: var(--radius)              // ≈11.2px
--radius-xl: calc(var(--radius) + 4px)  // ≈15.2px
--radius-2xl: 1rem                       // 16px
--radius-3xl: 1.5rem                     // 24px
```

Source: `extracted/typography-radius-spacing.txt`.

**BigMarket today:** `--radius-base: 0.375rem` (= 6px) and `--radius-container: 0.75rem` (= 12px), aliased to `--radius-md` and `--radius-lg`. Our cards and buttons today are noticeably more squared-off than Polymarket's. *This is a deliberate look-and-feel choice we should explicitly make.* See [`design-philosophy.md`](./design-philosophy.md).

### 1.6 Typography

```
--font-inter: "Inter", sans-serif       // body
--font-sauce: "Open Sauce One", sans-serif  // headings (custom webfont)
--font-mono:  "Geist Mono", monospace   // tabular numerics

--text-xs:   0.75rem   line-height 1
--text-sm:   0.875rem  line-height 1.428
--text-base: 1rem      line-height 1.5
--text-lg:   1.125rem  line-height 1.555
--text-xl:   1.25rem   line-height 1.4
--text-2xl:  1.5rem    line-height 1.333
--text-3xl:  1.875rem  line-height 1.2
--text-4xl:  2.25rem   line-height 1.111
--text-5xl:  3rem      line-height 1
--text-6xl:  3.75rem   line-height 1

--font-weight-{light,normal,medium,semibold,bold,extrabold,black} = 300/400/500/600/700/800/900
```

Source: `extracted/typography-radius-spacing.txt`.

**Inter for body + Geist Mono for prices** is a *visible* part of the Polymarket "competent trading product" signal. Our current Skeleton stack (`system-ui, sans-serif`) plus no monospace policy is fine for v1, but the audit flags we have **no `tabular-nums` rule for prices/odds/balances**. Polymarket gets this for free because `Geist Mono` is monospace by definition.

### 1.7 Motion vocabulary

Polymarket exposes **named, role-specific animations** (sample):

```
--animate-spin:         spin 1s linear infinite
--animate-ping:         ping 1.5s cubic-bezier(0,0,.2,1) infinite
--animate-pulse:        pulse 2s cubic-bezier(.4,0,.6,1) infinite
--animate-fadeIn:       fadeIn .8s ease-in-out
--animate-popoverSlideDownAndFadeIn: ... .2s cubic-bezier(.16, 1, .3, 1) forwards
--animate-accordionSlideDown: ... .2s cubic-bezier(.26, .08, .25, 1) forwards
--animate-rotateOnce:   rotateOnce .3s ease-out both
--animate-slightBounce: slightBounce 2s ease-in-out infinite
--animate-verticalSlide: verticalSlide 2s linear infinite     // ← live ticker
--animate-aurora:       aurora 60s linear infinite            // ← decorative
--animate-like:         like .3s ease-in-out forwards
```

Source: `extracted/animations.txt`.

Two patterns to learn:

1. **Most durations are 100–300 ms** with a flick of cubic-bezier (the `(.16, 1, .3, 1)` curve is iOS-y, fast-out / slow-in — used for popovers).
2. **Infinite animations exist** for live data: `--animate-pulse` for the live dot, `--animate-verticalSlide` for the price ticker. They almost certainly honor `prefers-reduced-motion` but we did not verify the CSS predicate.

The audit (`audit-report.md` §A "Motion") flagged we have **zero motion policy** in `docs-v2/`. Polymarket gives us a concrete starter set to consider.

### 1.8 Election tiers (very specific, very niche)

```
--tier-tossup:   #9445d9   (violet — neither D nor R is winning)
--tier-lean-d:   #85a0ff (light) / #a8bbff (dark)
--tier-lean-r:   #f98183 (light) / #ffa8aa (dark)
--tier-likely-d: #3059e8 / #5c7fff
--tier-likely-r: #d10a0f / #f5474a
--tier-safe-d:   #0034eb / #1231a0
--tier-safe-r:   #83070a / #a80004
```

Source: `extracted/election-tier-tokens.txt`.

These are **not generic prediction tokens** — they are explicitly for US-election lean/likely/safe coloring (Democrat blue family, Republican red family). **BigMarket should not adopt these.** If we ever model election sentiment we can revisit, but the rest of the planet does not vote D/R, and our community markets (Bitcoin, BTC up/down, sports, crypto launches) need a different palette anyway.

---

## 2. Visual patterns from the screenshots

Each row cites the screenshot. **"Adapt"** = take the pattern, with our Nouveau tokens. **"Adapt-with-change"** = take the pattern but soften / change the visual register for the approachable-novice goal (see [`design-philosophy.md`](./design-philosophy.md)). **"Skip"** = explicitly not for us.

### 2.1 App shell (`homepage LIGHT.png`, `homepage DARK.png`)

| Pattern | Polymarket | BigMarket adaptation |
|---|---|---|
| Top nav | Logo (left) · horizontal-scroll category tabs · global search · "How it works" pill · Log in · Sign Up (blue solid) | **Adapt.** Header layout is fine; replace blue Sign Up with our `bg-primary` (yellow-gold) only if we keep "Sign Up" as the absolute primary CTA. Otherwise use `bg-accent` (cobalt) so it reads as a colored action without competing with our brand-yellow elsewhere. |
| Category nav style | Underlined active tab with brand-blue underline; chip-styled inactive tabs | **Adapt-with-change.** Underline-active is good; use `accent` for the underline (not `primary`) — primary yellow on a busy nav strip will look noisy. |
| Density | Comfortable; cards have 12–16 px padding, ~24 px row gap | **Adopt the rhythm**, in our 4/8/16/24 spacing scale. |
| Sidebar widgets | Right column on desktop: "Breaking news" with up/down deltas, "Hot topics" with flame icons + $ volume | **Adapt-with-change.** Same widget pattern (we already have `MarketEntry` + reputation widgets in code). Replace flame red with our `accent` cobalt or a deliberate `community` violet — flame red implies destructive in our token set. |
| Footer | Centered logo + condensed link grid (5 columns); locale picker bottom-right | **Adapt.** Standard. |

### 2.2 Hero cards (`homepage hero binary.png`, `categorical.png`, `PriceUP:DOWN.png`, `Sports.png`)

A **hero card is a wide, single-market featured card** that sits above the grid and uses a sparkline chart on the right. There are four visual variants in the screenshots.

| Variant | Left (info) | Right (chart) | Key telltale |
|---|---|---|---|
| **Binary** (Hantavirus) | Icon · title · big `7% chance` + `▼ 28%` delta (red, signed) · Yes / No buttons (full-width, side-by-side, green/red soft fills) · 3 news items with source logos | Single-series line chart (cyan), y-axis 0–30%, x-axis last 6 days | One line; one color. |
| **Categorical** (US x Iran) | Category breadcrumb · title · 4 outcome rows (date + percent, right-aligned) · news source | 4-color line chart, each line color-coded matching the percent label (cobalt, blue, yellow, orange) | Multi-line; legend with same colors. |
| **Scalar / Price-up-down** (BTC Up or Down) | Icon · title · time window (`May 10, 6:40AM–6:45AM ET`) · `Price To Beat $80,785` · `Current Price $80,772` (orange, with `▼ $13` delta) · `Ends in 2:34` (red, countdown) · **UP 1.77x / DOWN 2.3x** buttons (orange brand fill / dark neutral fill) · live comment ticker | Live tick chart (orange line) with $ axis on right; **LIVE pulse pill** bottom-right; left-rail price deltas (`+$2`, `+$27`, `+$1`) scrolling up | Live ticking + countdown + scrolling left rail. The most active variant. |
| **Sports** (West Ham vs Arsenal) | Category breadcrumb (`Sports · Soccer · EPL`) · title · 3 outcome buttons (Team / Draw / Team, soft-red fill matching team colors) · Spread (`WHU -1.5 / ARS +1.5`) · Total (over/under) · live status | 2-line chart (Arsenal red 65% / Draw gray 22%) with team logos at right margin · time below | Team-color outcome buttons. |

**Key takeaways for BigMarket:**

- **Adapt** the hero-card shape (left-info / right-chart split, ~16:9 aspect, big title at top, KPI strip with chance % + signed delta).
- **Adapt-with-change** the "binary" Yes/No: Polymarket uses a *very* muted green / red fill (low-saturation in dark mode); we should land on **explicit `price-up` / `price-down` tokens** that can ALIAS `success` / `destructive` values but live under their own name (see `bm-semantic-tokens-proposal.md` §"Prediction domain").
- **Adapt** the categorical multi-line chart with the **legend dot colored to match the line**. This is a hard requirement for our `outcome-1..6` token wave.
- **Adapt** the "price-up-down" live variant carefully: the countdown timer (`Ends in 2:34` in red) and the LIVE pulse pill are doing a lot of work — for novices, the red countdown can look like "everything is on fire". Consider neutral text + small `live-indicator` dot for the countdown until <30 s remaining.
- **Skip** the team-colored outcome buttons for now; bind sports-specific palette to `outcome-1..6` and let our `community` token color the league badge — do not invent `team-color-arsenal-red`.

### 2.3 Trade widget (`widget buying.png`)

This is the conversion-critical surface. Anatomy:

```
┌─────────────────────────────────────────────┐
│  [icon]  Hantavirus pandemic in 2026?       │  ← title row (icon + truncated title)
│                                             │
│  Buy  Sell                          Market ▾ │  ← side tabs + order-type dropdown
│  ──                                         │     (underline active)
│                                             │
│  ┌────────────┐  ┌────────────┐             │
│  │ Yes  7.3¢  │  │ No  92.8¢  │             │  ← outcome chips
│  └────────────┘  └────────────┘             │     (active = filled green; inactive = neutral dark)
│                                             │
│  Amount                              $0     │  ← label + amount (huge, right-aligned)
│                       [+$1] [+$5] [+$10]    │  ← quick chips (4 presets)
│                       [+$100]               │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │            Trade (blue CTA)         │    │  ← full-width primary
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

Eight things to learn:

1. **Two side-tabs ("Buy" / "Sell") + dropdown for order type ("Market" / "Limit")** is denser than two top-level tab rows. Adapt.
2. **Outcome chips show the price in ¢** (cents per share), not %. Polymarket markets are denominated in shares that trade between 0¢ and 100¢. **BigMarket does not have this denomination** (we use FPMM + CLOB with STX/sBTC notional). **Do not copy the `¢` glyph** — see `formatting.md` (proposed). Use `%` for chance, `$` (or our settlement asset) for amounts.
3. **The active outcome chip is filled (high-emphasis green), the inactive is dark neutral with low-emphasis text.** Adapt directly — this maps to `price-up` filled + `muted` ghost.
4. **The "$0" empty-state amount is *huge* and *muted gray* on the right** — communicates "nothing entered yet" without an error feel. Adapt.
5. **Quick chips for `+$1 / +$5 / +$10 / +$100`** are the single best novice-onboarding pattern in this whole UI. Adapt aggressively — these are dramatically less intimidating than a freeform input. Suggest **two preset rows**: `+1 +5 +10 +100` for amount, and `25% 50% 75% MAX` for share/percent allocation.
6. **Primary CTA "Trade" is full-width blue** — not green (Yes), not red (No). They deliberately do not color the CTA by outcome because that would imply the action is "buy Yes" forever. Adapt: BigMarket CTA = `bg-accent` cobalt or `bg-primary` (decide once, document, never flip).
7. **No slippage UI is visible** here — they must hide it behind the "Market ▾" dropdown or under an advanced toggle. For us, slippage is already prominent in `MarketStaking.svelte` via `SlippageSlider.svelte` — consider **hiding behind an "Advanced" expander** as part of the approachable-novice push.
8. **No "are you sure" confirmation modal** is shown — Polymarket commits on the single "Trade" click. **We must keep ours** (the audit §J explicitly recommends a pre-flight confirmation pattern, especially for on-chain irrevocable actions).

### 2.4 Order book (`order book.png`)

| Element | Polymarket | BigMarket adaptation |
|---|---|---|
| Header | "Order Book" + info icon + collapse caret | **Adapt.** |
| Sub-tabs | "Trade Yes" (active, underlined) / "Trade No" (inactive) | **Adapt.** |
| Right-side actions | "Maker Rebate" link (yellow text) + "Rewards" pill (purple bg) + refresh + min-tick `0.1¢` | **Skip the rebate/rewards specifics**; they are Polymarket loyalty mechanics, not in our use cases. |
| Columns | `PRICE` / `SHARES` / `TOTAL` (all-caps, small-gray, tabular-num right-aligned) | **Adapt.** Replace "shares" with our notional. |
| Row prices | All red (sell-side of "Trade Yes" = asks) — `8.8¢ 8.7¢ 8.6¢ ...` | **Adapt-with-change.** **Do not bind to `destructive`** — bind to `price-down` so semantics ("this is the ask of Yes, you'd pay these") doesn't collide with "error". The contract (`styling-contract.md` §4.7) already forbids this collision. |
| Heat indicator | Faint dark-red left-margin bar that fades as you scroll down (liquidity depth visualization) | **Adapt** as a small enhancement; a 4 px wide left bar at low opacity is cheap and useful. |
| Footer | `Last: 7.3¢` · `Spread: 0.1¢` (both right-aligned, tabular) | **Adapt.** |

**Open question for BigMarket:** as the audit notes (`audit-report.md` §B), our `OrderBook.svelte` is **currently a recent-trades simulation, not a real order book**. The visual spec here applies to whichever direction we go — but the doc owner needs to decide first. See [`components/order-book.md`](./components/order-book.md) (proposed).

### 2.5 Wallet / sign-up modal (`sign up and connect wallet popup.png`)

This is the most novice-friendly part of Polymarket and we should **lift the pattern wholesale** (adapted to our wallets):

```
┌────────────────────────────────────┐
│        Welcome to Polymarket       │ ← centered heading
│                                    │
│  ┌──────────────────────────────┐  │
│  │  G  Continue with Google     │  │ ← solid blue primary (full-width)
│  └──────────────────────────────┘  │
│                                    │
│    ───────── OR ─────────          │
│                                    │
│  ┌──────────────────────┬───────┐  │
│  │ Email address        │Continue│  │ ← inline submit; muted bg, blue solid
│  └──────────────────────┴───────┘  │
│                                    │
│  [tg] [steam] [meta] [unknown]     │ ← wallet icon grid (4 per row, 2 rows)
│  [phantom] [coinbase] [ascii] [...] │
│                                    │
│        Terms · Privacy              │ ← footer text
└────────────────────────────────────┘
```

Things to learn:

1. **"Welcome to" + product name** as the heading. We have `ConnectLanes.svelte` but no headline. Adapt.
2. **Continue with Google as the top option** — sets the expectation that you don't need a crypto wallet to start. For BigMarket on Stacks we likely cannot do this without a custodial bridge (Hiro / Xverse / Leather are the wallets). But we can replicate the **shape** — top "lane" is the smoothest path; below it is the "advanced" wallet grid.
3. **Wallet icon tiles use brand colors as accents** (Phantom purple, MetaMask orange, etc.) on neutral surfaces. Adapt.
4. **Footer is `Terms · Privacy`** — minimum trust signal. Adapt.

We already have `ConnectLanes.svelte` and `ConnectMenuDropdown.svelte` (audit §B "Wallet-connect modal"); they just need this **structure and the welcome-friendly headline** to feel less crypto-native.

### 2.6 Market detail (binary BTC; categorical Hantavirus + Iran; sports West Ham vs Arsenal)

Common layout across all four market-detail screenshots:

```
┌─────────────────────────────────────────────────────────────────┐
│ [Header / category breadcrumb]                                  │
│ [icon] Market title                                             │
│ Chance % + delta · Vol · Ends · share / bookmark icons          │
│                                                                  │
│ ┌─────────────────────────────────────────┐ ┌─────────────────┐ │
│ │ Sparkline chart (wide)                  │ │  Trade widget   │ │
│ │ Time-range tabs: 5m 1H 6H 1D 1W 1M All  │ │   (sticky)      │ │
│ │ Bottom-right: Live · Polymarket logo    │ │                 │ │
│ └─────────────────────────────────────────┘ │                 │ │
│                                              │                 │ │
│ ┌─────────────────────────────────────────┐ │                 │ │
│ │ Outcomes / Order Book / Activity tabs   │ │                 │ │
│ │ … list of outcome rows with Yes/No btns │ └─────────────────┘ │
│ └─────────────────────────────────────────┘   Related markets   │
│                                                 list             │
│ ┌─────────────────────────────────────────┐                     │
│ │ Rules · Market Context                  │                     │
│ │ (long-form description)                 │                     │
│ └─────────────────────────────────────────┘                     │
│                                                                  │
│ Comments tabs: Comments (N) / Top Holders / Positions / Activity │
│ Avatar · username · time · body · reply count · like           │
│                                                                  │
│ FAQ accordion                                                    │
└─────────────────────────────────────────────────────────────────┘
```

This is **the layout doc the audit (`audit-report.md` §B "Market detail layout") asks for**. It maps almost cleanly onto our existing `MarketHeader.svelte` + `MarketStatsBar.svelte` + `MarketCharts.svelte` + `MarketStaking.svelte` + `OrderBook.svelte` + `MarketComments.svelte` files. The remaining specwork:

- **Two-column grid** at `md+`: ~64% main / ~36% sidebar. Below `md`: stacked, trade widget pinned-to-bottom via portal or fixed footer.
- **Sticky trade widget** in the desktop sidebar (`position: sticky` with top offset = header height).
- **Time-range tabs** above the chart: minimum set `5m / 1H / 6H / 1D / 1W / 1M / All`. Active tab = underline accent.
- **Outcomes table** below the chart for categorical markets — rows show outcome name + percent + Yes / No buttons. Identical row treatment to the homepage grid card body.
- **Related markets** in the sidebar below the trade widget — a compact 3-row list with thumbnail + title + chance + Yes / No buttons.
- **Comments thread** is rich (replies, likes, position-holder badges); ours has the markup but the styling needs the avatar/badge polish.

### 2.7 Numeric formatting (cross-cutting, observed everywhere)

| Surface | Polymarket | BigMarket today | BigMarket recommendation |
|---|---|---|---|
| Probability (binary market) | `7% chance`, `13% chance` (label "chance"), color-neutral; some places `7.3¢` | mixed: `${v.toFixed(0)}%` in `MarketEntry.svelte:41` | **Decide once.** `formatting.md` (proposed) should pick: `%` for category/scalar and `$` for binary settlement; **never `¢`** unless we adopt cents-per-share denomination. |
| Signed change | `▼ 28%` (red, triangle prefix); `▲ +3.4%` (green, triangle prefix) | no `fmtSignedPercent` in `bm-utilities/format.ts` | **Add `fmtSignedPercent(value)`** that returns `▲ +X.X%` or `▼ X.X%`. Color via `price-up` / `price-down` tokens; **never `success` / `destructive`** per the styling contract. |
| Big amounts | `$95M Vol`, `$1.2K`, `$273M` (compact) | `Intl.NumberFormat('en-US', { currency:'USD' })` (no compact) | **Add `fmtCompact(value, opts)`** with rule "compact above 999". |
| Crypto / large numerics | `Geist Mono`, tabular | `font-mono tabular-nums` on wallet address only, inconsistent | **Rule:** all price / odds / balance / countdown / address values use `tabular-nums`. |
| Time | `Ends Dec 31, 2026`, `Ends in 2:34` (countdown), `2d ago` (relative) | `dateOfResolution` helper, ad hoc | **Rule:** countdown = relative (`Ends in 2d 4h` → `2:34` under 1h); absolute UTC for resolved. |
| Addresses | `0x1234…5678` truncation, copy on click | `truncate` 3 chars in `HeaderMenuTailwind.svelte:323` | **Rule:** `0xABCD…WXYZ` 4+4 truncation, copy-on-click, font-mono. |

This rolls into the proposed `formatting.md` doc.

### 2.8 "Approachable vs intimidating" observations (preview for §3)

Polymarket is **already fairly approachable** for a crypto-native trading product, but compared to a "first-time prediction user" bar, there are several signals that read as "for traders, not for newcomers":

| Polymarket pattern | Intimidates because | What BigMarket should do |
|---|---|---|
| Order book sub-tabs prominent on market detail | Implies "you need to know what an order book is" before you can play | **Collapse by default** below the chart; show "Order Book ▾" as expandable. (Our audit's recommendation §B aligns.) |
| Prices in `¢` (cents per share) | Requires understanding of share-based market math | Use `%` (chance) and `$` (amount) consistently; never `¢`. |
| Countdown timer in red (`Ends in 2:34`) | Red = error in normal UI language | Use neutral text for `>30s` countdowns; turn `live-indicator` (red) only inside the last 30 s. |
| Live ticker scrolling vertically with $ amounts | Looks fast, looks like the price is moving against you | Keep for the live-game variant only (price-up-down market type); suppress on slow categorical markets. |
| Big "$0" empty state | The huge zero looks like a balance, not a prompt | Replace with small placeholder text ("Enter amount") + the same big size *after* user types. |
| "Maker rebate / Rewards / pp" | DEX trading lingo | Hide behind "Advanced" or remove until we have a comparable loyalty program. |

Cross-reference: [`design-philosophy.md`](./design-philosophy.md) lists the full "approachable vs Polymarket" decisions; [`current-vs-target.md`](../current-vs-target.md) translates them into plain English with examples.

---

## 3. What we keep, soften, and skip — one-row summary

| Polymarket asset | Verdict | Reason |
|---|---|---|
| Two-column market detail layout | **Keep** | Industry standard; we already have the components. |
| Hero card variants (binary / categorical / price-up-down / sports) | **Keep** | Maps to our four use cases; need explicit specs (`components/market-card.md`). |
| Trade widget anatomy (Buy/Sell tabs + outcome chips + amount + presets + CTA) | **Keep** | Conversion-critical. Adopt quick-chip presets aggressively. |
| Order book three-column layout (`PRICE / SHARES / TOTAL`) | **Keep** | Standard finance pattern; bind colors to `price-up` / `price-down`, not `success` / `destructive`. |
| Wallet modal shape (Welcome heading → primary lane → divider → secondary lanes → tiles → terms) | **Keep** | Best-in-class novice onboarding; we already have `ConnectLanes.svelte`. |
| `--alpha-100..950` and `--alpha-black/white-*` token scales | **Keep (different name)** | Useful for translucent surfaces (toasts, badges); reframe as `--surface-overlay-*` in our `theme.css`. |
| Six button variants (`primary / secondary / tertiary / ghost / outline / link`) | **Keep** | Our `bm-ui` Button is missing `tertiary` and the soft state; the audit (§B "Buttons") flags this. |
| Tactile press `--btn-shadow` (inset down on active) | **Keep** | Cheap touch-feel improvement. |
| Named animation tokens (`--animate-pulse / popoverSlideDown* / accordionSlideDown / verticalSlide`) | **Keep (subset)** | Use as the spine of `motion.md` (proposed). Three durations: 120 / 200 / 320 ms; honor `prefers-reduced-motion`. |
| Inter body + Geist Mono numerics | **Keep direction, defer decision** | Skeleton `nouveau` already provides Bahnschrift headings; we are not committed to a webfont in wave 1. Add `tabular-nums` rule now; webfont decision is a separate ticket. |
| Tailwind v4 + shadcn-style tokens (`--card`, `--popover`, `--input`, `--ring`, `--muted`) | **Keep** | Already our path. The audit's blocker #1 (wire wave-1 tokens) closes this gap. |
| Quick-chip preset rows (`+$1 +$5 +$10 +$100`) | **Keep (expand)** | Best novice pattern in the whole UI. Add a second row for percent allocation (`25% / 50% / 75% / MAX`). |
| --- soften --- | | |
| Saturated cobalt blue `#1452f0` as the absolute primary CTA | **Soften** | We are committed to Skeleton `primary-*` (warm yellow-gold) as our brand. Use `accent` (cobalt mapping) for "blue actions" so we don't compete with our own brand. |
| Radius 0.7rem on everything | **Soften** | We use 0.375rem / 0.75rem (Skeleton). A larger radius is friendlier; consider bumping cards to `0.5rem` if we want a softer feel, but keep buttons tight. Decision needed; document once. |
| Red countdown timer | **Soften** | Use neutral text + `live-indicator` only inside the last 30 s. |
| Order book prices in red regardless of context | **Soften** | Bind to `price-down` (which may share value with `destructive`), and emphasize **last + spread** numbers over the row colors. |
| Black-leaning `#0a0b10` dark background | **Soften (already done)** | Skeleton `surface-950` is a softer, neutral-warm near-black; keep it. We do not need to chase blue-tinted backgrounds. |
| "Hot topics" red flame icons | **Soften** | Use `accent` cobalt for the leading numeral and a smaller flame in `community` violet, not flame-red (= destructive in our token vocabulary). |
| --- skip --- | | |
| `--tier-lean-d/r`, `--tier-likely-d/r`, `--tier-safe-d/r`, `--tier-tossup` | **Skip** | US-election-specific; our markets are global / sports / crypto / community. If election sentiment becomes a feature we revisit. |
| `¢` (cents-per-share) numeric format | **Skip** | We do not denominate in shares. Confusing to novices. |
| "Maker rebate / Rewards" copy | **Skip** | Polymarket loyalty mechanics; not in our use cases today. |
| Animated decorative gradients (`--animate-aurora` 60 s) | **Skip** | Pretty but cycles forever, harms `prefers-reduced-motion` discipline; we have nothing equivalent and don't need one. |
| `--font-sauce` (custom webfont) | **Skip (for now)** | Decision is deferred; Skeleton-condensed fallback chain is good enough for wave 1. Revisit when typography becomes the bottleneck. |
| Login with Google / Telegram / Steam | **Skip (for now)** | We are wallet-first on Stacks; the custodial-bridge work is not on the roadmap. Adopt the **shape** of the modal (top primary lane + secondary tiles) without the auth providers. |

---

## 4. Concrete additions to our token backlog (driven by this analysis)

These tokens were already flagged "Next wave" in [`bm-semantic-tokens-proposal.md`](./bm-semantic-tokens-proposal.md). This analysis **upgrades them to "ship before market-card / trade-widget / order-book are built"**, because every screen above uses them:

1. `card`, `card-foreground`, `popover`, `popover-foreground`, `overlay` — surfaces (PROMPTS.md Step 3 already scoped).
2. `input` (single token — the **border** color; shadcn convention) — interaction (PROMPTS.md Step 3).
3. `price-up`, `price-down`, `price-neutral`, `live-indicator`, `selected` — prediction domain (PROMPTS.md Step 5).
4. `outcome-1` … `outcome-6` (+ chart `stroke-outcome-N` / `fill-outcome-N`) — categorical (PROMPTS.md Step 8).
5. `chart-grid`, `chart-axis`, `chart-axis-label`, `chart-tooltip-bg`, `chart-cursor`, `chart-area-opacity` — chart structure (PROMPTS.md Step 8).
6. **NEW** `success / warning / info / destructive / accent` quads (`* / *-foreground / *-soft / *-border`) — needed for badges, deltas, banners (PROMPTS.md Step 5).
7. **NEW** `community` + `community-foreground` (+ optional `-soft / -border`) — for KARMA / governance / community surfaces (PROMPTS.md Step 5; maps to Skeleton `tertiary-*`).
8. **NEW** semantic shadow tokens: `shadow-card`, `shadow-popover`, `shadow-modal`, `shadow-button`, `shadow-focus` — closes the `shadow-[...]` arbitrary-values gap flagged in `audit-report.md` §A.
9. **NEW** semantic motion tokens: `motion-fast: 120ms`, `motion-base: 200ms`, `motion-slow: 320ms`, `ease-pop: cubic-bezier(.16,1,.3,1)`, `ease-stand: cubic-bezier(.4,0,.2,1)` — three durations, two easings, plus a `prefers-reduced-motion` recipe.

Each of the above lands in **both** `theme.css` and `tokens.ts` per the contract.

---

## 5. Where to use this doc

- When you are about to spec a new BigMarket component (market card, trade widget, order book, etc.), open [`polymarket-research/extracted/<the-right-file>.txt`](./polymarket-research/extracted/) and cite the exact line — do not memorize.
- When a PR introduces "Polymarket-like" anything, the reviewer should be able to follow the reference chain: PR diff → `components/<thing>.md` → this doc → `polymarket-research/extracted/*.txt`. If any link is missing, the PR is making an opinion-based design decision and should be flagged.
- This doc does **not** override [`styling-contract.md`](./styling-contract.md) or [`bm-semantic-tokens-proposal.md`](./bm-semantic-tokens-proposal.md). If they disagree, those win.
- This doc does **not** introduce code changes on its own. Token waves land via `PROMPTS.md`.
