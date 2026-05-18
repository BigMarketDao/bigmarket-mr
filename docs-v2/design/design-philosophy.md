# BigMarket — design philosophy

**Purpose.** Settle, in one place, **what BigMarket is trying to feel like** and **how that differs from Polymarket/Kalshi**. Every later doc (component specs, motion, formatting, accessibility) can point here when a decision is ambiguous.

**Status:** canonical for product positioning and visual register. If a token wave or component proposal conflicts with this doc, this doc wins on direction; values still come from [`bm-semantic-tokens-proposal.md`](./bm-semantic-tokens-proposal.md) + [`theme.css`](../../packages/bm-design/src/theme.css).

---

## 1. One-paragraph positioning

BigMarket is a **DAO-governed prediction market on Stacks**. Polymarket is our **best-case reference for prediction-market interface patterns** — what a card looks like, how a trade widget composes, what an order book row says — but it is built **for crypto-native traders**, and it shows. BigMarket is for **people who would never call themselves traders**: someone betting a few dollars on a community question, a hackathon prize pool, a forum poll-with-stakes. Our UI must feel like a **friendly, opinionated, slightly playful product** built on a **professional, calm, tabular** foundation. We use Skeleton's `nouveau` theme (warm yellow-gold brand, condensed Bahnschrift headings) precisely so we do **not** look like another blue-cobalt DeFi terminal.

## 2. The three audiences (in priority order)

1. **The curious newcomer.** Has never traded an asset; has read about "prediction markets" once; clicked on our site because a friend shared a market link. **Must** be able to understand "what does this market resolve to?", "what does putting in $5 mean?", "is this real money?", and finish a trade in <60 s without a wallet jargon dictionary.
2. **The engaged community member.** Has used Stacks; comfortable with wallet UX; participates in DAO governance, forum, reputation. Wants tabular density when they want it, plain language when they don't.
3. **The trader.** Crypto-native; runs multiple positions; expects order books, slippage controls, hash chips, leaderboards. Should not feel that we removed their tools — only that the defaults serve audience 1 and the dense affordances live one tap away.

If a decision helps audience 3 but breaks audience 1, the decision is **wrong by default**.

## 3. Why Skeleton `nouveau`, not "Polymarket dark"

Polymarket is a slate / cobalt-blue / Inter / Geist-Mono product. It signals "fintech terminal". If we copy the surface, we copy the audience signal.

Skeleton `nouveau` is **warm and condensed**:

- **Primary** is yellow-gold (Skeleton `primary-*`), not blue. Yellow reads "highlight" and "earnest", not "execute trade".
- **Headings** are condensed Bahnschrift / DIN Alternate. Reads "magazine confident" rather than "Bloomberg terminal".
- **Body** is `system-ui` (San Francisco / Segoe / Roboto). Local, familiar, no webfont wait.
- **Surface** is OKLCH-tuned `surface-*` with a slight warm cast, not pure-cold gray.

We **lean into** that difference. The "this site is not a Bloomberg clone" feel is a feature, not a bug.

## 4. "Professional but approachable" — what those two words mean for us

These two words pull in opposite directions; document the resolution explicitly.

| Decision axis | "Professional" pulls toward… | "Approachable" pulls toward… | **BigMarket choice** |
|---|---|---|---|
| Numeric density | tabular, monospaced, 8–10 numbers per card | one big chance % + one delta | **Tabular for everything that scrolls; one big chance + delta for the card hero.** Tabular-nums everywhere prices, percents, balances, countdowns appear (cf. `polymarket-analysis.md` §2.7). |
| Probability label | "67¢" (share price) | "67% chance" (plain English) | **"67% chance"** universally. Never `¢`. The phrase "chance" is in the visible label on cards. |
| Color of "Yes" | green (universal trading convention) | green that is **friendly**, not neon | **`price-up`** (own token, may share value with `success`); foreground stays high-contrast on a soft tint rather than pure saturation. |
| Color of "No" | red | red that is **not** alarm-red | **`price-down`** (own token; may share value with `destructive`). The pair lives in the prediction-domain wave (PROMPTS.md Step 5). |
| Default density | tight rows, dense tables | airy, generous padding | **Comfortable.** 16 px card padding, 12 px row gap. Defer "compact mode" to a later wave. |
| Order book visibility on market detail | first-tab visible | hidden under "Advanced" | **Collapsed by default**, expandable inline. Audience 1 should not have to interpret an order book to vote on a market. |
| Slippage controls | always-visible slider | hidden in "Advanced" | **Hidden in "Advanced"** with a sensible default (e.g. 1%). Show inline only after the user expands or the order would exceed slippage. |
| Confirmation modal before signing | yes (trader expectation) | yes (novice safety) | **Yes, always.** Show estimated cost, estimated fee, slippage, and the wallet that will sign — *in plain English*. |
| Live ticker / pulse | always on | only when something is actually moving | **Active only on live-game variants** (price-up-down, sports near tipoff). Otherwise show a static "Updated 4s ago" timestamp. |
| Countdown color | red ("urgency") | neutral ("time remaining") | **Neutral text until <30 s remaining**, then `live-indicator` for the last 30 s. Audience 1 should not feel rushed by a 6-day market. |
| Wallet onboarding | full grid of every wallet | one obvious path + the rest behind "More wallets" | **Lifted from Polymarket's wallet modal pattern** (`polymarket-analysis.md` §2.5), top primary lane + secondary tiles. |
| Empty state | small text | illustrated, warm | **Illustrated for top-level surfaces** (empty markets list, no positions yet) using `community` violet or `primary` yellow tone; small text for inline empties (no comments yet). |
| Microcopy tone | terse trader voice ("Confirm trade") | plain-English coaching ("Place your $5 on Yes — final step before signing") | **Coaching, never condescending.** Use the second person ("you"), prefer verbs over nouns ("Place your $5" not "Order amount: $5"), name the wallet that will sign. |
| Error tone | technical (`Error: insufficient balance for tx 0x…`) | human (`You don't have enough STX for this trade. Add $10 or pick a smaller amount.`) | **Human.** Always two lines: what went wrong + what the user can do next. |

This table **does not** rule out trader affordances — it ranks defaults. Trader features (limit orders, hash chips, position tables, full order book) are first-class but live one expand-tap away or in dedicated routes.

## 5. The four product personalities

Different parts of the app have different appropriate registers. Document each:

| Surface | Personality | Visual cues |
|---|---|---|
| **Homepage / market grid** | Magazine-front. Confident. Generous. | Big hero card; readable typography; relaxed spacing; warm tones. Brand-yellow used sparingly (header CTA, "Create market" button). |
| **Market detail** | Stadium scoreboard. Live without being noisy. | Tabular numerics in the KPI strip; sparkline with single `accent` line; trade widget that calmly says "you are about to do a thing". |
| **Trade widget** | Pocket-sized helper. Friendly, never urgent. | Big readable buttons; preset chips; copy-led ("Place $5 on Yes"); confirmation modal with plain-English breakdown. |
| **Order book / advanced** | Terminal, opt-in. | Tabular, dense, monospace numerics; small captions; can be hidden entirely. |

When in doubt, ask: *which of these four surfaces is this?* The visual register follows.

## 6. Concrete "do / don't" list (the part agents need)

### Do

- Use **`%`** for chance / probability everywhere a market is binary or categorical.
- Use **`$`** (or our settlement asset abbreviation) for amounts; never **`¢`**.
- Use **`▲ +X.X%` (`price-up`)** and **`▼ X.X%` (`price-down`)** for signed deltas. Never `▲` without color, never color without `▲`.
- Use **`tabular-nums`** on every numeric display: prices, percents, balances, countdowns, addresses.
- Use **`bg-primary` (yellow-gold)** only for the highest-priority CTA per page (e.g. "Create market", "Sign in"). Trade CTAs use **`bg-accent` (cobalt)** consistently across the app.
- Use **`accent` (cobalt)** for active tab underlines, link text, focus rings.
- Use **`muted-foreground`** for meta labels (vol, ends-on, source attribution).
- Use **plain English** in microcopy. Use the user's number ("your $5") not the row's ("amount: 5").
- **Always show a pre-flight confirmation** before any on-chain transaction. List: token, amount, est. fee, slippage, wallet that will sign.
- **Always honor `prefers-reduced-motion`** for any infinite animation (live dot pulse, ticker scroll). Replace with a static "Live" badge when motion is reduced.

### Don't

- Don't use **`¢`** anywhere; we do not denominate in cents per share.
- Don't bind **`price-down`** to the `destructive` *token name* even if the *value* is the same. A red price drop is not an error.
- Don't bind **`live-indicator`** (red) to a countdown timer that has >30 s remaining. Use neutral text first.
- Don't introduce **arbitrary classes** (`text-[13px]`, `bg-[#abc]`, `shadow-[0_6px_18px_rgba(...)]`) in feature code or `bm-ui`. The styling contract forbids this.
- Don't introduce **Tier-1 palette utilities** (`gray-*`, `zinc-*`, `orange-500`) outside `packages/bm-design`. After migration, gate this in CI.
- Don't borrow Polymarket's **`--tier-lean-d/r` / `--tier-likely-d/r`** politics palette. We are not a US-elections product.
- Don't pin slippage controls in the trade widget by default. Default to 1%; expose under "Advanced".
- Don't add a webfont in wave 1. Stick with Skeleton's `system-ui` body + condensed Bahnschrift heading stack. Webfont decision belongs to a later, dedicated ticket.
- Don't add **decorative infinite animations** (no aurora gradients, no shimmer-on-load); only purposeful motion (pulse on a live data dot, slide-in on a popover).

## 7. Anti-patterns we explicitly disavow

These are common DeFi UI patterns we are choosing **not** to adopt:

1. **Cobalt-on-cobalt brand mass.** Polymarket / Aave / Uniswap all converge on saturated-blue. We use Skeleton's warm yellow-gold as the brand differentiator, with cobalt strictly as a secondary action color.
2. **`¢` as a chance display.** Forces the reader to translate "shares between 0 and 100" into "probability between 0 and 1". Audience 1 should never see this.
3. **Red countdown timers everywhere.** Implies urgency that is rarely real. Reserve red for "the last 30 s of a sub-minute window" and for errors.
4. **Order book on every market detail by default.** Audience 1 should not need to understand bid/ask depth to vote on a community question.
5. **Wallet jargon in microcopy.** No "Approve token", "Sign transaction with EIP-1271", "Network mismatch error". Translate every wallet event into a one-sentence English explanation + a next action.
6. **Trader-tier numeric density on home / market list.** Cards display one chance %, one delta, one volume label. Audience 3 already knows where to find the table view.
7. **DEX-style "Maker rebate / LP rewards" copy** in places that are not specifically about being a maker / LP. Reserved for dedicated LP pages.
8. **Infinite decorative animations.** Aurora gradients, glow pulses, page-level shimmer-loading. We use motion as **affordance**, not decoration.

## 8. Patterns we **do** lift from Polymarket (without copying the look)

Cross-reference: [`polymarket-analysis.md`](./polymarket-analysis.md) §3 is the full table. Headline list:

1. **Two-column market detail layout** (main + sticky sidebar with trade widget).
2. **Hero card variants** for binary / categorical / scalar / sports market types.
3. **Quick-chip presets** in the trade widget (`+$1 / +$5 / +$10 / +$100`) — the single best novice-friendly pattern in the whole reference.
4. **Welcome-style wallet modal** (`Welcome to BigMarket`, one primary lane, divider, secondary lanes, tiles, terms footer).
5. **Three-column order book** (`PRICE / SIZE / TOTAL`) with last + spread footer.
6. **Time-range tab strip** above the chart (`5m 1H 6H 1D 1W 1M All`).
7. **Outcomes table** below the chart for categorical markets (row = name + percent + Yes / No buttons).
8. **`▲ / ▼` signed-change triangles** prefix style with consistent color rules.
9. **"Last updated" / "Live" pill** as the price-staleness affordance.
10. **Six-variant button system** (`primary / secondary / tertiary / ghost / outline / link`).

Adopt the **structure**; render in Nouveau values.

## 9. Decision protocol when a component spec disagrees

If a future `components/<thing>.md` says one thing and this doc says another:

1. If the disagreement is on **product personality / register / microcopy tone** → this doc wins.
2. If the disagreement is on **a token role name** → [`bm-semantic-tokens-proposal.md`](./bm-semantic-tokens-proposal.md) wins.
3. If the disagreement is on **a token value** → [`packages/bm-design/src/theme.css`](../../packages/bm-design/src/theme.css) wins (and the doc must be updated).
4. If the disagreement is on **a usage rule (no `¢`, dark parity required, …)** → [`styling-contract.md`](./styling-contract.md) wins.

In all cases, the agent **stops and surfaces the conflict** in the PR description rather than picking silently.

---

## Appendix A. Constraints inherited from the codebase

These are not optional and shape every philosophy decision above.

- **We cannot change BigMarket functionality** as part of a UI refactor. (See `PROMPTS.md` guardrails: no `.ts` business-logic edits, no store / SDK / API / contract / routing changes.)
- **The vault model is real-money custody.** Funds are always conserved (CLAUDE.md "Critical Invariants"). A "place a $5 trade" CTA is not metaphorical; the modal must communicate that clearly.
- **CLOB + FPMM hybrid execution.** We have to render two execution paths at the same surface (order book and AMM curve) without confusing audience 1. The trade widget defaults to AMM-only ("Market"); CLOB ("Limit") is opt-in.
- **DAO governance lives in the same product.** A trade widget and a vote ballot must use the same visual vocabulary. Don't invent governance-specific colors; use `community` (violet, Skeleton `tertiary-*`) consistently across DAO surfaces.
- **Skeleton `nouveau` is the brand.** Do not propose a brand-color change as part of this refactor; that is a separate strategic decision.

## Appendix B. What we will measure to know this is working

When the refactor lands enough surface to test (post-PROMPTS Step 6 / 7), we should verify:

1. A first-time user can complete a $5 binary trade in under 60 s without external help (think-aloud test, n=5).
2. Lighthouse a11y score ≥ 95 on home + one market detail page in light + dark.
3. WCAG AA contrast on every text/background pair in both themes (sampled at 10 places).
4. No raw palette utilities (`gray-*`, `zinc-*`, `#abc`) in `apps/` or `packages/` outside `bm-design` (CI grep, audit §H "CI guard").
5. No arbitrary `shadow-[...]` or `text-[Npx]` in `apps/` or `packages/` outside `bm-design`.

This is the bar; missing any of these means we did not deliver "professional but approachable", just "tokenized".
