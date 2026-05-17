# Polymarket UI — audit (screenshots + browser CSS)

**Method + populated result.** Goal: from **screenshots in the repo** and **measured CSS variables fetched live from polymarket.com**, extract **design patterns** before locking BigMarket tokens and components.

> Status: the summary tables at the bottom are **filled** as of 2026-05-11. The measured baseline lives at [`polymarket-research/`](./polymarket-research/) (raw HTML + 4 CSS bundles + curated extracts), and the full reading is at [`polymarket-analysis.md`](./polymarket-analysis.md). **This doc remains the method + a one-screen summary.** When CSS hashes rotate or new screenshots are added, re-run the workflow in §0 and update the summary.

## 0. Workflow with an AI agent that has a browser

1. **Open this repo workspace** so the agent can see local files.
2. Have the agent **read the screenshots** in:

   `docs/design/assets/polymarket/`

3. Have the agent open [polymarket.com](https://polymarket.com) in an embedded browser and visit, where possible, **the same kinds of screens** as the screenshots (home, market detail, connect modal, order book, widgets).
4. For each screen the agent should attempt (as the environment allows):
   - **Elements**: select representative nodes (card, primary button, heading, page background, input border).
   - **Computed**: `color`, `background-color`, `font-family`, `font-size`, `font-weight`, `line-height`, `border-radius`, `border-color`, `box-shadow`, `padding` (or logical `padding-block` / `padding-inline`).
   - **Styles**: look for **`var(--...)`** on `:root` / `html` / `body` (design tokens in CSS).
   - **Network** (or **Sources**): identify the **main CSS / JS bundles**; if readable, extract **repeating values** (same radius, same gray text). *Minified code is fine for sampling — do not unpack the bundle.*
5. If automated CSS extraction is not possible, ask the user to **paste from DevTools** manually:
   - **Computed styles** block for 2–3 key elements, or
   - Output of **`getComputedStyle(document.documentElement)`** for CSS variables (a small console snippet listing `--*` on `:root`).

**Note on file paths:** some filenames have **spaces**; use `%20` in Markdown links or rename to `kebab-case`.

---

## 1. Image inventory in repo (`docs/design/assets/polymarket/`)

| File | Short description |
|------|-------------------|
| `homepage LIGHT.png` | Home, light theme |
| `homepage DARK.png` | Home, dark theme |
| `homepage hero binary.png` | Hero / binary format |
| `homepage hero categorical.png` | Hero / categorical |
| `homepage hero PriceUP:DOWN.png` | Hero / price up–down |
| `homepage hero Sports.png` | Hero / sports |
| `widget - trending by market volume.png` | Trending widget |
| `widget buying.png` | Buy / trade widget |
| `market details - BTC Up or Down 5m ... .png` | Market detail (BTC 5m) |
| `market details - BTC Up or Down 5m ... (1).png` | Variant |
| `market details - West Ham United FC vs. Arsenal FC ... .png` | Sports market detail |
| `market details - Hantavirus pandemic in 2026 ... .png` | Market detail (example) |
| `market details - US x Iran permanent peace deal by... .png` | Market detail (example) |
| `order book.png` | Order book |
| `sign up and connect wallet popup.png` | Modal / wallet |

---

## 2. Prompt for an AI agent (copy the full block)

Attach **all relevant images** from the folder above, *or* point the agent to load them from the repo. Then paste:

```text
You are a senior product designer AND a front-end engineer focused on design systems.

## Inputs
1) Screenshots from our repo path: `docs/design/assets/polymarket/` (Polymarket UI). Analyze every image provided.
2) Live verification: use the browser to open https://polymarket.com (and specific market URLs if you can match the screenshots). Align your findings with what you see live.

## Part A — Per screenshot (repeat for EACH image)
1) **Screen name** — what UI this is.
2) **Layout** — grid/flex, max-width feel, density (airy vs compact), key zones (nav, hero, sidebar, main column).
3) **Visual hierarchy** — 1st / 2nd / 3rd focal points (type scale, weight, color).
4) **Inferred color roles** — page bg, surface/card, primary text, muted text, borders, primary CTA, secondary actions, positive/negative odds coloring if visible.
5) **Components** — cards, tabs, charts, tables, order book, modals, inputs; radius and shadow *as seen*.
6) **Motion / state cues** — live numbers, pills, badges (only if visible).
7) **Accessibility** — contrast and target size guesses; note uncertainty.
8) **Adopt vs avoid** — 2–3 bullets each for a prediction-market product (not generic platitudes).

## Part B — CSS / implementation patterns (from DevTools + page, not guesses)
Using the browser’s developer tools on Polymarket (same or equivalent pages as the screenshots):

9) **CSS variables / tokens** — List `:root` (or `html`/`body`) custom properties you can see (`--*`): name + value. If the build hides them, say “not exposed” and rely on computed styles below.
10) **Typography stack** — `font-family`, typical `font-size` / `font-weight` for: page title, body, label, small meta text, button text (from computed styles on samples).
11) **Radius & elevation** — typical `border-radius` and `box-shadow` patterns (e.g. card vs button vs modal).
12) **Spacing rhythm** — infer a rough spacing scale from repeated padding/margin values on cards, sections, and list rows (e.g. multiples of 4/8px). State confidence (high/medium/low).
13) **Color values** — hex/rgb for: background, card, border, primary text, muted text, primary button (from computed styles). Deduplicate into a small palette table.
14) **Class / framework hints** — From HTML source or class names on nodes: note if patterns look Tailwind-like, CSS-modules-like, or custom. Do not reproduce long minified JS; only patterns.
15) **Correlate** — Short paragraph linking Part A (visual) to Part B (measured): e.g. “muted text in UI matches computed #xxxxxx on secondary labels.”

## Part C — Design patterns summary (cross-cutting)
16) **Recurring patterns** — bullets: navigation, market cards, odds display, buy/sell widget, order book, modals.
17) **Semantic token mapping (for OUR design system)** — Markdown table: `UI role` → `suggested semantic token name` (e.g. background, foreground, surface, surface-elevated, border, primary, primary-foreground, muted, muted-foreground, accent, destructive). This is OUR naming, not Polymarket’s internal names.

## Rules
- If something is not visible in screenshots and cannot be verified in the browser, write **"not visible / not verified"** — do not invent.
- Prefer **measured** values from computed styles over eyeballing when the browser is available.
- Output **valid Markdown** with clear headings so we can paste below.

## Optional console snippet (CSS variables on :root)
If execution is allowed on polymarket.com, something like:
`const css = getComputedStyle(document.documentElement); Array.from(css).filter(p => p.startsWith('--')).forEach(p => console.log(p, css.getPropertyValue(p).trim()));`
Summarize unique `--*` names and values; if CORS or CSP blocks inspection, say so and rely on computed styles from picked elements only.
```

---

## 3. Embed images in this doc (template — edit paths)

*Example with `%20` for spaces in filenames:*

### Home (light)

![Homepage light](../../docs/design/assets/polymarket/homepage%20LIGHT.png)

### Home (dark)

![Homepage dark](../../docs/design/assets/polymarket/homepage%20DARK.png)

### Hero variants

![Hero binary](../../docs/design/assets/polymarket/homepage%20hero%20binary.png)

![Hero categorical](../../docs/design/assets/polymarket/homepage%20hero%20categorical.png)

### Widgets

![Trending widget](../../docs/design/assets/polymarket/widget%20-%20trending%20by%20market%20volume.png)

![Buying widget](../../docs/design/assets/polymarket/widget%20buying.png)

### Modal

![Sign up / wallet](../../docs/design/assets/polymarket/sign%20up%20and%20connect%20wallet%20popup.png)

**AI output (full reading):** [`polymarket-analysis.md`](./polymarket-analysis.md). Citation chain: any claim in the summary below is backed by an `extracted/*.txt` line **or** a screenshot file name in that doc.

---

## 4. Summary after analysis (populated 2026-05-11)

| Theme | Polymarket (visual + measured CSS) | BigMarket decision | Source |
|---|---|---|---|
| Heading hierarchy | `--font-sauce` (custom webfont) for marketing / hero headings; `--font-inter` for body. Title weight ≈ 700 bold; body 400; signed-change deltas at 500–600. 6-step type scale (`--text-xs` 0.75rem → `--text-6xl` 3.75rem) with explicit line-heights. | Keep Skeleton `nouveau` headings (Bahnschrift / DIN-Alternate condensed via `--font-heading`). **Do not** load a webfont in wave 1. Add a documented "labels vs meta vs button vs numeric" recipe in `design/styling-contract.md` §5. | `extracted/typography-radius-spacing.txt`; [`polymarket-analysis.md`](./polymarket-analysis.md) §1.6 |
| Cards / borders | `--card` = `#fff` light / `#030712` dark (shadcn aliasing). `--border` = `#e5e7eb` / `#1f2937`. Radius `--radius: 0.7rem` (~11.2px) base, scales to `--radius-3xl: 1.5rem`. Shadows are subtle, low-opacity, multi-layer (no neon glow). | Use Skeleton `surface-50/950` for card bg via our existing `--color-background`/`--color-card`. Keep `--radius-md: 0.375rem` / `--radius-lg: 0.75rem` (smaller, calmer than Polymarket's 0.7rem default). Introduce semantic `shadow-card / shadow-popover / shadow-modal` tokens to retire arbitrary `shadow-[…]` utilities (`audit-report.md` §A). | `extracted/shadcn-style-tokens.txt`; `extracted/typography-radius-spacing.txt`; screenshots all four hero variants |
| CTA | Primary CTA = saturated cobalt `#1452f0` (`--brand-500`). Used for "Sign Up", "Trade" button, "Continue with Google". Tactile press via inset `--btn-shadow`. Six button variants (`primary / secondary / tertiary / ghost / outline / link`). | Primary CTA in our app = `bg-primary` (Skeleton warm yellow-gold) for the **highest-priority** CTA per page (e.g. "Create market"). Trade CTAs and link-style actions use `bg-accent` (cobalt) consistently. Add **`tertiary`** + **`soft`** variants to `bm-ui/Button` (currently missing). Add the inset tactile shadow as `shadow-button-press`. | `extracted/semantic-roles.txt` (`--color-button-*`); `widget buying.png`; [`polymarket-analysis.md`](./polymarket-analysis.md) §1.4 + §2.3 |
| KPI / numbers | `Geist Mono` for prices and tabular displays. **All** monetary, percentage, countdown, and address values are tabular. Probability shown as `%` for categorical / scalar; as `¢` for binary share price. Big amounts use compact (`$1.5K`, `$273M`). Signed deltas use `▲ +X.X%` / `▼ X.X%` with consistent color (green/red). Countdown timer in red. | Probability is `XX% chance` everywhere — **no `¢`**. Compact above 999 with `fmtCompact()` (to be added to `bm-utilities/format.ts`). Signed deltas use `▲ ▼` + `price-up` / `price-down` tokens (own names, may share values with `success`/`destructive`). **All numeric displays carry `tabular-nums`** — single global rule. Countdown is neutral text until last 30 s. | All screenshots; [`polymarket-analysis.md`](./polymarket-analysis.md) §2.7 |
| Dark vs light | Full parity, single class-based toggle (`html.dark`). Dark `--background: #0a0b10` (near-black with slight blue tint). Light `--background: #fff`. **Same** layout, same density, same component shapes; only colors flip. They also expose `--alpha-black-*` / `--alpha-white-*` scales for translucent surfaces. | Full parity on every change. We use Skeleton `surface-50` / `surface-950` (warm-neutral OKLCH), not the blue-tinted near-black Polymarket uses. Class toggle and FOUC script already live in `app.html`; document in `design/dark-mode.md` (proposed). | `extracted/shadcn-style-tokens.txt`; `homepage LIGHT.png` + `homepage DARK.png` |

### Component-level findings (one-line each)

| Surface | Polymarket pattern | BigMarket adaptation |
|---|---|---|
| Top nav | Logo · scrollable category tabs · global search · "How it works" pill · Log in · Sign Up | Adapt; replace Sign Up cobalt with our `accent` so it stays a secondary action, not competing with yellow `primary`. |
| Hero card | Wide split: title + KPI strip + Yes/No buttons + 3-item news rail (left) // sparkline + Live pill (right) | Adopt the split; four variants (binary / categorical / scalar / sports). See `components/market-card.md` (proposed). |
| Market card | Icon + 2-line clamp title + chance % at top-right + Yes/No buttons + volume + ends | Single `MarketCard` component, four variants, one set of tokens. See `components/market-card.md`. |
| Trade widget | Buy/Sell tabs · Market dropdown · Yes/No outcome chips with ¢ price · big `$0` amount · quick chips `+$1 +$5 +$10 +$100` · full-width blue Trade CTA. No pre-flight modal. | Same anatomy in our voice: chance % (not ¢), plain-English CTA ("Place $5 on Yes"), quick chips + percent-allocation chips, slippage hidden behind "Advanced", **mandatory pre-flight confirmation modal**. See `components/trade-widget.md` + `components/confirmation.md`. |
| Order book | Three columns `PRICE / SHARES / TOTAL`, all-red rows, dark left-margin heat bar, footer `Last:` + `Spread:` | Same anatomy bound to `price-down` token (not `destructive`). **Collapsed by default** on the market-detail page. See `components/order-book.md`. |
| Wallet modal | "Welcome to Polymarket" heading · solid primary lane · "OR" divider · secondary lanes · wallet tiles grid · `Terms · Privacy` | Lift wholesale: "Welcome to BigMarket" + Stacks wallet tiles + a passwordless option if available. See `components/wallet-modal.md`. |
| Live indicator | Red pulse dot + "LIVE" text on active markets; "Updated 4s ago" elsewhere | Same two-tier rule; honor `prefers-reduced-motion`. See `design/motion.md` + `design/a11y.md`. |
| Election tiers | `--tier-lean-d/r`, `--tier-likely-d/r`, `--tier-safe-d/r`, `--tier-tossup` | **Skip.** Our market mix is global / sports / crypto / community — not US elections. |

### Anti-patterns we explicitly disavow

These are Polymarket patterns we are choosing **not** to adopt; see [`design-philosophy.md`](./design-philosophy.md) §7 for the full list with rationale:

1. `¢` (cents-per-share) probability format — confusing to novices.
2. Saturated cobalt blue as the *absolute* primary CTA — competes with our yellow brand.
3. Red countdown timer at all times — implies false urgency.
4. Order book expanded by default on every market detail.
5. Wallet jargon in microcopy ("Approve transaction", "EIP-1271").
6. DEX-style "Maker rebate / LP rewards" copy on non-LP surfaces.
7. Decorative infinite animations (aurora, shimmer).
8. US-election-specific color tiers.

---

## 5. Our tokens

- [`bm-semantic-tokens-proposal.md`](./bm-semantic-tokens-proposal.md) — semantic inventory and wave annotations.
- [`packages/bm-design/src/theme.css`](../../packages/bm-design/src/theme.css) — runtime truth.
- [`packages/bm-design/src/tokens.ts`](../../packages/bm-design/src/tokens.ts) — TS mirror (today drifted; PROMPTS Step 2 closes the gap).
- [`polymarket-research/`](./polymarket-research/) — measured reference material (raw + curated extracts).
- [`polymarket-analysis.md`](./polymarket-analysis.md) — full reading of the measured material against screenshots.
