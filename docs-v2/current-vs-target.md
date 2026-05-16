# Current vs Target — what BigMarket has now, and what we are building toward

**Read this if you only read one doc in `docs-v2/`.** This is plain-English, screenshot-friendly, written for a product-minded reader. It is the answer to: *"what does 'professional but approachable' actually mean for our UI, and where are we today?"*

This doc complements (does not replace):

- The audit report — what is missing technically: [`audit-report.md`](./audit-report.md)
- The design philosophy — why we make these choices: [`design/design-philosophy.md`](./design/design-philosophy.md)
- The Polymarket analysis — what professional looks like in the reference: [`design/polymarket-analysis.md`](./design/polymarket-analysis.md)
- The token contract — how we name things: [`design/styling-contract.md`](./design/styling-contract.md)

---

## 1. The one-sentence gap

> **BigMarket today renders correctly but speaks in a trader's voice and mixes raw color utilities. The target is a calm, scannable, beginner-friendly product that still gives traders every tool, with one consistent visual vocabulary.**

That sentence is the entire delta. Everything below is examples.

## 2. What "professional but approachable" means in concrete terms

| Word | Means (concrete) | Does **not** mean |
|---|---|---|
| **Professional** | Numbers are tabular and consistent. Spacing is regular. Dark / light parity. Tokens, not arbitrary colors. A pre-flight modal before any on-chain action. WCAG-AA contrast. | "Looks like Bloomberg." "Has an order book on every screen." "Uses Polymarket's blue palette." |
| **Approachable** | A first-time user can place a $5 binary trade in under 60 seconds. Microcopy uses "you" and verbs. The hardest concept (slippage, order book, hash chip) is one click away — not on the default screen. The countdown timer is not red until the last 30 seconds. | "Hides power features." "Childish." "Removes the trader's tools." "Has cartoons." |

We are **not** trying to be Polymarket. We **are** trying to learn from how Polymarket lays out a trade widget, then render it in our Skeleton `nouveau` (warm yellow-gold) palette with plainer, friendlier copy.

## 3. The seven gaps — current vs target, plain English

Each gap below has: *what a user sees today*, *what they should see*, *why it matters*, *which doc owns the fix*.

### Gap 1 — Market cards feel hand-coded

**Today.** Cards on the homepage grid are built from raw Tailwind palette utilities like `bg-gray-100`, `border-green-200`, `hover:text-orange-600`. Yes / No buttons use ad-hoc red/green tints with no shared token. See `packages/bm-market-homepage/src/lib/components/markets/MarketEntry.svelte:89, 97, 134, 141, 152, 167` — every color is hand-mixed. Dark mode is patched on with `dark:` overrides instead of inheriting from a token.

**Target.** A single `MarketCard` component, four variants (binary, categorical, scalar, sports), one set of tokens (`bg-card`, `text-card-foreground`, `border-border`, `price-up`, `price-down`, `outcome-1..6`). Dark mode just works — no `dark:` overrides except for explicit deviations. Buttons on the card use the same Yes / No tokens as the trade widget, so the visual language is the same end-to-end.

**Why it matters.** A user scrolling the homepage looks at 20 cards in 5 seconds; if the colors drift slightly between cards, the whole site feels amateur. Tokens are how we keep 20 cards identical without thinking about it.

**Owned by.** `components/market-card.md` (proposed); blocked on Token Wave 1 + Wave 2 from `PROMPTS.md`.

---

### Gap 2 — The trade widget speaks trader, not human

**Today.** `MarketStaking.svelte` is a single 368-line component that mixes the trade logic, the slippage slider, and the layout. The visible labels say things like "Buy YES at 0.42 STX" with no plain-English equivalent. Slippage is exposed by default. There is no pre-flight confirmation modal — once you click "Stake" the transaction is sent. There are no quick-chip preset amounts.

**Target.** Anatomy lifted from Polymarket (because it works) and rendered in our voice:

```
┌─────────────────────────────────────────────┐
│  [icon]  Will Bitcoin reach $100k by Jul?   │
│                                             │
│  Buy  Sell                          Market ▾ │
│                                             │
│  ┌─────────────────┐  ┌─────────────────┐   │
│  │ Yes  42% chance │  │ No  58% chance  │   │ ← outcomes by chance, not ¢
│  └─────────────────┘  └─────────────────┘   │
│                                             │
│  How much do you want to stake?      $5     │ ← plain English label
│                       [+$1] [+$5] [+$10]    │ ← quick chips (novice-friendly)
│                       [+$100]               │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │     Place $5 on "Yes"               │    │ ← CTA copy says the actual action
│  └─────────────────────────────────────┘    │
│                                             │
│  ▸ Advanced (slippage, fees)                │ ← collapsed by default
└─────────────────────────────────────────────┘

   ↓ on click

┌─────────────────────────────────────────────┐
│  About to place $5 on "Yes"                 │ ← pre-flight modal
│                                             │
│  You stake:        $5.00 STX                │
│  Estimated fee:    ~$0.02 STX               │
│  Estimated return: $11.90 STX if Yes wins   │
│  Slippage:         <1%                      │
│                                             │
│  Sign with: Leather Wallet                  │
│                                             │
│  [Cancel]    [Sign and place ▸]             │
└─────────────────────────────────────────────┘
```

**Why it matters.** This is the conversion surface. A first-time user reading "Buy YES at 0.42 STX" doesn't know what 0.42 means (price? amount? probability?). Reading "Place $5 on Yes" leaves no ambiguity. The pre-flight modal is non-negotiable — it is the difference between a user feeling "I see what I'm about to do" and "I think I just lost $5".

**Owned by.** `components/trade-widget.md` + `components/confirmation.md` (both proposed).

---

### Gap 3 — Numbers look like a different app on every screen

**Today.** Probability is shown as `${v.toFixed(0)}%` in `MarketEntry.svelte:45`, as `text-primary text-lg font-semibold` (with no `tabular-nums`) in `MarketStatsBar.svelte:26`, and as raw `${totalStaked}` micro-units in some KPI strips. The wallet address is `font-mono tabular-nums` in `HeaderMenuTailwind.svelte:320` but truncated with 3 chars only. Volume is `Intl.NumberFormat("en-US", { currency: "USD" })` with no compact rule, so a $1.5M market shows as `$1,548,213.27`.

**Target.** One formatter library, one rule per type:

| Surface | Format | Example |
|---|---|---|
| Chance / probability | `XX% chance` (or `<1% chance` / `>99% chance`) | "42% chance" |
| Signed change | `▲ +X.X%` (green, `price-up`) or `▼ X.X%` (red, `price-down`) | "▼ 3.4%" |
| Big amount | Compact above 999 with locale separators below | `$1.5M`, `$12.4K`, `$842` |
| Crypto amount | `0.0123 sBTC` (max 4 decimals, trailing zeros trimmed) | "0.012 sBTC" |
| Countdown | Relative inside 1h (`Ends in 2:34`), block-units beyond | "Ends in 6d 4h" |
| Wallet address | `0xABCD…WXYZ` (4+4 trunc, monospace, tabular, copy-on-click) | "ST1H…QXY8" |
| All of the above | `tabular-nums` on the wrapping element | (no jitter as digits change) |

**Why it matters.** Numbers are the single most-visible thing on every screen. If they jitter, the site feels broken; if they format inconsistently, the site feels untrustworthy. Tabular numbers are a 1-line CSS rule with a huge perceived-polish payoff.

**Owned by.** `design/formatting.md` (proposed); add helpers to `packages/bm-utilities/src/lib/format.ts`.

---

### Gap 4 — The order book stares at the user uninvited

**Today.** `OrderBook.svelte` is a fully-expanded panel on every market detail page, rendering colored rows with hex literals. It is **simulating a recent-trades view, not a real order book** (it uses `usdRate = 0.71` as a hardcoded conversion at `OrderBook.svelte:44`). Audience 1 has no idea what they are looking at; audience 3 can tell at a glance the data is fake.

**Target.** Two decisions:

1. **Visibility.** The order book is **collapsed by default** on the market detail page, behind a "Order Book ▾" affordance. Audience 1 never has to open it. Audience 3 expands it in one click and gets a real (not simulated) live order book.
2. **Implementation.** Decide whether it remains a recent-trades widget (rename it `Recent Trades`) or becomes a real order book backed by the API. Either is fine — what isn't fine is the current "looks-like-order-book-but-isn't".

**Why it matters.** A novice opening the market detail page should see: title, chance %, chart, "Place a trade" widget, comments. They should **not** see eight rows of red prices and ask "am I supposed to understand this?". Order book is the single biggest "scary thing" on Polymarket; we get to choose whether ours is welcoming or scary by **defaulting it collapsed**.

**Owned by.** `components/order-book.md` (proposed); requires a product decision (real or recent-trades).

---

### Gap 5 — The wallet flow leaks crypto vocabulary

**Today.** Connecting a wallet shows the wallet's native error messages straight through. "Sign transaction with EIP-1271", "Network mismatch", "Approve transfer" appear in our UI verbatim from the wallet provider. The `+layout.svelte:124–132` mismatch state is a small banner with Tier-1 utilities — easy to miss.

**Target.** Every wallet event has a one-sentence English translation, plus a next action. Examples:

| Wallet event | Today's text (verbatim from provider) | Target text |
|---|---|---|
| `User rejected request` | "Error: user rejected the request" | "You cancelled the sign. Your $5 is still in your wallet — try again whenever you're ready." |
| Network mismatch | "Network mismatch: expected stacks-testnet" | "Looks like your wallet is on Mainnet, but this market is on Testnet. Switch network and we'll continue." [Switch button] |
| Insufficient funds | "ContractError: PostConditionFailed" | "You don't have enough sBTC for this trade. Lower the amount or top up your wallet." [Pick a smaller amount] [Open my wallet] |
| Pending tx | (silence; user waits) | "Your $5 is being placed. We'll let you know when it's confirmed. (Tx 0xABCD…WXYZ)" [Copy hash] |
| Confirmed | (silence; UI just updates) | "Your trade is in. You now hold 11.9 Yes shares on this market." [View my positions] |

**Why it matters.** Wallets are the single biggest "this is too complicated, I'm leaving" moment. Translating wallet language into plain English is the cheapest possible UX improvement and the highest impact one.

**Owned by.** `components/wallet-modal.md` + `components/confirmation.md` + `components/notifications.md` (all proposed). Builds on existing `ConnectLanes.svelte` + `TxModal.svelte`.

---

### Gap 6 — Live data either pulses constantly or sits silent

**Today.** The site has no formal "live indicator" pattern. Some surfaces (`StakeChart.svelte`) re-render from a polled query with no visible cue that data updated; others (`HeaderMenuTailwind.svelte:234`) use ad-hoc `motion-safe:` classes. No `aria-live` regions; no "last updated" timestamps.

**Target.** A two-tier policy:

1. **Live tier** — used when data refreshes every 1–5 s (market-detail chart on an active market, live-game scoreboard):
   - Small red `live-indicator` pulse dot + the text "LIVE" next to the chart.
   - Honors `prefers-reduced-motion` (static red dot, no pulse).
   - `aria-live="polite"` on the price element.
2. **Stale tier** — used everywhere else (homepage cards, resolved markets, comment counts):
   - Small muted "Updated 4s ago" timestamp.
   - No animation, no `aria-live`.

**Why it matters.** Constant motion exhausts users (audience 1 reads "this site is anxious"). No motion at all makes the data feel dead (audience 3 reads "this site doesn't update"). Picking the right tier per surface is a 10-line policy that we just don't have yet.

**Owned by.** `design/motion.md` + `design/a11y.md` (both proposed).

---

### Gap 7 — Errors and empty states are afterthoughts

**Today.** A few inline error strings exist (`MarketStaking.svelte:46` has `errorMessage` state) but there is no consistent visual treatment. Empty states (no markets, no comments, no positions, no leaderboard) fall back to either nothing or a hand-written one-liner. There is no SvelteKit `+error.svelte` route-level error page.

**Target.**

| Scenario | Pattern |
|---|---|
| **Inline form error** (e.g. amount too large) | `aria-invalid` + `border-destructive` + a one-line plain-English message below the input ("That's more than your $42 sBTC balance. Try $20 or top up.") |
| **Section error** (e.g. API failed loading comments) | Soft `destructive-soft` card with a sentence + "Try again" button. Does not break the rest of the page. |
| **Page error** (e.g. 404 / 500) | Full SvelteKit `+error.svelte` with brand-warm illustration, plain-English headline, primary CTA back to home, secondary "Report this" link. |
| **Empty state (top-level)** (e.g. no positions yet) | Friendly illustration in `community` violet or `primary` yellow, headline ("No positions yet"), one-line description, primary CTA ("Browse markets"). |
| **Empty state (inline)** (e.g. no comments yet) | Small muted text + sometimes a "Be the first to comment" link. No illustration. |

**Why it matters.** Audience 1 will hit at least one error in their first session (rejected wallet sign, network blip, balance too low). If our error screen reads "Error: ContractError: PostConditionFailed" the user leaves. If it reads "You don't have enough sBTC for this trade — try a smaller amount" the user retries.

**Owned by.** `components/error-states.md` + `components/empty-states.md` (proposed).

---

## 4. What is **already good** today (don't undo this)

We have done several things well; this doc is not a "burn it down" call. Things we keep:

1. **Skeleton `nouveau` foundation** — warm yellow-gold brand, condensed Bahnschrift headings, OKLCH surface scale. Differentiated and recognizable.
2. **Three-tier token model** (Tier 1 primitives → Tier 2 semantic → Tier 3 component). Defensible and well-documented in `styling-contract.md`.
3. **Vault model and conservation invariants** in the contracts — UI just needs to surface them in language users understand.
4. **Component split** (`bm-ui` presentation-only, `bm-market` feature, `bm-market-homepage` feature, `bm-create-market` flow). Right boundaries; the migration is per-component, not per-page (`PROMPTS.md` already commits to this).
5. **Dark mode wired** end-to-end with the FOUC-prevention script in `app.html` and the toggle in `HeaderMenuTailwind.svelte`. Just needs documentation (see `design/dark-mode.md`, proposed).
6. **The audit itself** (`audit-report.md`). It is already the right roadmap. This doc is the **plain-English translation** of that audit, not a replacement.

## 5. Where we draw the line vs Polymarket

| Polymarket pattern | We adopt (yes/no) | Reason |
|---|---|---|
| Two-column market detail (chart + sticky trade widget) | **Yes** | Industry standard; users expect it; we have the components. |
| Quick-chip preset amounts | **Yes** | Best single novice pattern in the reference. |
| `▲ ▼` signed-change triangles | **Yes** | Consistent visual cue; works in both themes. |
| Buy/Sell side-tabs + Market/Limit dropdown | **Yes** | Compact; serves both audiences. |
| Welcome-style wallet modal shape | **Yes** | Lifts the structure (top primary lane, secondary tiles, terms footer). |
| `tabular-nums` for all numeric display | **Yes** | One-line CSS rule with huge polish payoff. |
| `¢` (cents-per-share) numeric format | **No** | We do not denominate in cents per share; confusing to novices. We use `% chance` and `$`. |
| `--tier-lean-d/r` political tiers | **No** | US-election-specific; not our market mix. |
| Saturated cobalt as the absolute primary CTA | **No** | We are Skeleton `nouveau` warm yellow-gold; cobalt is our `accent` (secondary). |
| Red countdown timer at all times | **No** | Reserve red for the last 30 s of sub-minute markets and for genuine errors. |
| Order book on every market detail by default | **No** | Collapsed by default; opt-in. |
| Maker rebate / Rewards / loyalty copy | **No** | Not in our use cases today; would be confusing to novices. |
| Always-on slippage slider | **No** | Hide behind "Advanced" with a sensible default. |
| Webfont (Inter / Geist Mono / Open Sauce) | **Not yet** | Skeleton's `system-ui` + Bahnschrift fallback is good enough for wave 1; webfont decision is its own ticket. |
| Decorative infinite animations (aurora) | **No** | Motion is affordance, not decoration. |

## 6. The order we will land this

Each item below maps to a doc or a PROMPTS step. Reading the headlines top to bottom is the user-visible delivery order; reading the doc/step columns is the engineering order.

| Step | What the user notices first | Doc owns the spec | PROMPTS step |
|---|---|---|---|
| 1. App chrome is on tokens, dark parity is real | Header / footer / banners look consistent in light + dark | (existing `PROMPTS.md` Step 4) | Step 4 |
| 2. Tokens for cards, popovers, inputs land | Inputs and popovers stop looking broken | (existing `PROMPTS.md` Step 3) | Step 3 |
| 3. `bm-ui` Card and Button stop using Tier-1 internally | Cards and buttons look identical everywhere | Step 6 of `PROMPTS.md` | Step 6 |
| 4. Domain tokens (`price-up`, `price-down`, `live-indicator`, `outcome-*`) land | Yes/No, signed deltas, live pills all use the same colors | `design/tokens-domain.md` (proposed) | Step 5 + 8 |
| 5. Market card four-variant spec | Cards on the homepage finally look polished and consistent | `components/market-card.md` (proposed) | — |
| 6. Trade widget redesign with quick chips + plain copy + confirmation modal | Placing a trade feels easy and safe | `components/trade-widget.md` + `components/confirmation.md` (proposed) | — |
| 7. Numbers / signed deltas / compact currency / address pill | Every number reads the same way on every screen | `design/formatting.md` (proposed) | — |
| 8. Order book collapsed by default | Market detail page becomes welcoming | `components/order-book.md` (proposed) | — |
| 9. Plain-English wallet / error / empty states | First-time user friction drops sharply | `components/wallet-modal.md` + `components/error-states.md` + `components/empty-states.md` + `components/notifications.md` (proposed) | — |
| 10. Motion + a11y policies | Live data feels alive without being noisy; keyboard + screen reader users can trade | `design/motion.md` + `design/a11y.md` (proposed) | — |

## 7. The promise we are not making

We are **not** promising to:

- Match Polymarket pixel-for-pixel (we explicitly aren't).
- Drop trader features (limit orders, hash chips, order book stay, just one click away).
- Replace Skeleton `nouveau` with a custom palette (the brand decision is settled).
- Ship a Figma library (later, maybe).
- Run a visual regression suite (later, maybe).
- Change wallet logic, contract logic, API logic, or data shapes (`PROMPTS.md` guardrails are absolute).

We **are** promising to:

- Replace every raw palette utility in feature code with a semantic token.
- Land one consistent numeric formatting policy.
- Land one confirmation modal pattern before any on-chain action.
- Land plain-English microcopy for wallet events and errors.
- Default the order book collapsed.
- Land four market-card variants with one spec.
- Honor `prefers-reduced-motion` everywhere.
- Document each component before changing it (so the next agent does not improvise).

If we deliver those eight things on top of the existing `PROMPTS.md` ten steps, the gap closes.
