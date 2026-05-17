# Audit of Build Prompt C — Market detail

> Read-only audit of [`docs-v2/build-prompts/C-market-detail.md`](./C-market-detail.md), checking it against:
> - the rules in [`../tokens-and-rules.lock.md`](../tokens-and-rules.lock.md), [`../sources-of-truth.md`](../sources-of-truth.md), [`../design/styling-contract.md`](../design/styling-contract.md)
> - the assumptions in the prompt (BEFORE / AFTER snippets, task scopes, allowed-file list, grep gates)
> - the **actual code** on disk in `apps/frontend-c1/src/routes/market/[marketId]/[marketType]/+page.svelte` and `packages/bm-market/src/lib/**`.
>
> Same shape as [`../audit-report.md`](../audit-report.md): verdict, evidence, recommendation per finding. No code edits, no edits to prompt C; this file is the gap report only.

---

## 1. Summary verdict

**Prompt C, executed as written, would (a) produce a no-op or destructive diff on Task 1, (b) edit at least three files that don't render on the page, (c) leave the page visibly unchanged because the actual layout/chrome root is `MarketContainer.svelte` which is not in scope, and (d) fail its own Tier-1 grep gate by ~78 hits in files the prompt forbids the agent from touching.** Tasks 2 and 8 (mechanical class sweeps inside `packages/bm-market/src/lib/market/version2/`) are sound. The rest needs a fix-up before it can be paired with prompts A and B.

The two structural mistakes that drive every other finding:

1. **The route file `apps/frontend-c1/src/routes/market/[marketId]/[marketType]/+page.svelte` does not render the children Prompt C thinks it does.** It only renders `<MarketContainer>` from `@bigmarket/bm-market`. The two-column grid prompt C wants to introduce already lives inside `packages/bm-market/src/lib/MarketContainer.svelte` (NOT in C's allowed files). Task 1's BEFORE snippet is fiction.
2. **Three components named in scope are dead on this page** — `MarketStatsBar.svelte` (replaced by `MarketSummary.svelte`), `MarketDetails.svelte` (never imported), `OrderBook.svelte` (never imported). Tasks 3, 5 and the `<MarketDetails …/>` reference in Task 1's AFTER snippet edit dead code.

If you execute the prompt before fixing these, the agent will either (a) gut `MarketContainer` by inlining children into the route file — discarding the existing Trade/Liquidity tab and the `marketAccounting` / `userLPTokensShares` props — or (b) wrap the existing `<MarketContainer>` with a redundant grid that hides nothing, fixes nothing, and leaves the Tier-1 leakage intact.

**Top three blockers to fix before running C:**

1. Replace the Task 1 BEFORE/AFTER snippets with the real layout target — `packages/bm-market/src/lib/MarketContainer.svelte` — and add it (and the components it actually orchestrates: `MarketSummary`, `MarketStakingContainer`, `MarketLiquidityContainer`, `MarketResolutionCriteria`) to the allowed-file list.
2. Drop `MarketStatsBar`, `MarketDetails`, and `OrderBook` from the task set on this page (they are not rendered on the live route), or move them to a separate cleanup prompt.
3. Either narrow the verification grep paths to "only the files I migrated" or widen the allowed-file list to cover the entire `packages/bm-market/src/lib/market/version2/` tree (do-claim / do-vote / do-resolve / do-charts), because the grep currently scans ~78 Tier-1 hits the agent isn't allowed to touch.

---

## 2. Critical findings (blockers; fix before running C)

### C-1. Task 1's BEFORE/AFTER snippet does not describe the file

**Evidence.** [`docs-v2/build-prompts/C-market-detail.md:78-117`](./C-market-detail.md) shows BEFORE as:

```
<div class="…some classes…">
  <MarketHeader … />
  <MarketStatsBar … />
  <MarketCharts … />
  <MarketStaking … />
  <OrderBook … />
  <MarketComments … />
</div>
```

The actual file [`apps/frontend-c1/src/routes/market/[marketId]/[marketType]/+page.svelte:110-134`](../../apps/frontend-c1/src/routes/market/%5BmarketId%5D/%5BmarketType%5D/+page.svelte) renders only:

```svelte
<div class="min-h-screen bg-gray-50 dark:bg-gray-900" data-market-page …>
  <PageContainer>
    {#if market && thread && userStake && marketAccounting}
      <MarketContainer
        {market}
        marketStakes={data.marketStakes}
        {marketAccounting}
        {userStake}
        {userLPTokensShares}
        {thread}
        onRefreshUserData={fetchUserData}
      />
    {/if}
  </PageContainer>
</div>
```

The grid + child orchestration lives one level down, in [`packages/bm-market/src/lib/MarketContainer.svelte:103-186`](../../packages/bm-market/src/lib/MarketContainer.svelte).

**Why it blocks.** A diligent agent reading the BEFORE template will not find any of the listed children in the file and will either (a) replace `<MarketContainer>` with the inlined children — losing the existing Trade/Liquidity tab toggle (`MarketContainer.svelte:116-179`), the `MarketSummary`/`MarketResolutionCriteria` panels, the `marketAccounting`/`userLPTokensShares` plumbing, and `onRefreshUserData` — or (b) wrap `<MarketContainer>` in a no-op grid that changes nothing visible.

**Recommendation.** Rewrite Task 1 against the real layout root:

- Add `packages/bm-market/src/lib/MarketContainer.svelte` to the allowed-file list.
- Add `packages/bm-market/src/lib/MarketSummary.svelte`, `packages/bm-market/src/lib/MarketStakingContainer.svelte`, `packages/bm-market/src/lib/MarketLiquidityContainer.svelte`, `packages/bm-market/src/lib/market/MarketResolutionCriteria.svelte` to the allowed-file list (each renders on this page and currently carries Tier-1 leakage).
- Replace Task 1's BEFORE snippet with the actual `MarketContainer.svelte:103-186` markup (the `mx-auto max-w-7xl …` outer + the `flex flex-col md:flex-row` two-column body) and write the AFTER against that grid.
- The route file `+page.svelte` only needs the `bg-gray-50 dark:bg-gray-900` outer swept to `bg-background` (2 Tier-1 hits there); the structural work moves to `MarketContainer.svelte`.

### C-2. Three components in scope are not rendered on the page

**Evidence.**

- `MarketStatsBar.svelte` — not imported by any file in the market-detail render path. `MarketContainer.svelte:113` renders `MarketSummary` instead (Grep for `MarketStatsBar` in `packages/bm-market`: 0 matches).
- `MarketDetails.svelte` — never imported. Grep for `MarketDetails` in `packages/bm-market`: 0 matches.
- `OrderBook.svelte` — never imported. Grep for `OrderBook` in `packages/bm-market`: 0 matches.

The prompt nevertheless lists all three in [`C-market-detail.md:23-27`](./C-market-detail.md) and dedicates Tasks 3 and 5 to them, plus places `<MarketDetails … />` into the AFTER layout at line 100.

**Why it blocks.** Three task sections worth of careful edits land on files that never reach the user. The visible MarketContainer panel keeps its `bg-surface text-secondary text-primary border border-purple-600/20 shadow-md` chrome ([`MarketSummary.svelte:113-294`](../../packages/bm-market/src/lib/MarketSummary.svelte) — 50 Tier-1 hits — and [`MarketResolutionCriteria.svelte`](../../packages/bm-market/src/lib/market/MarketResolutionCriteria.svelte) — 54 Tier-1 hits). The user will see "nothing changed" on the market detail page after a successful PR.

**Recommendation.** Three options, pick one and update C accordingly:

1. **Replace dead components with their live counterparts** in C's scope: `MarketStatsBar → MarketSummary`, `MarketDetails → MarketResolutionCriteria`. Drop `OrderBook` from C entirely (no consumer; defer to a later prompt that decides "real order book vs recent trades" per the audit gap, `audit-report.md` Section B "Order book row …" and `current-vs-target.md` §3 Gap 4).
2. **Keep them in scope but call out that they're dead code** with a note: "These three files are not rendered today; we are migrating them in anticipation of re-introducing them later. PR descriptions should say so." — this is the weakest option; agents tend to inline-render unused components when told to migrate them.
3. **Defer** `MarketStatsBar`, `MarketDetails`, `OrderBook` to a separate dead-code cleanup prompt.

### C-3. `MarketStaking.svelte` outer container is owned by `<Panel>` from `bm-ui`, not the file in scope

**Evidence.** [`packages/bm-market/src/lib/market/version2/MarketStaking.svelte:248-447`](../../packages/bm-market/src/lib/market/version2/MarketStaking.svelte) wraps every branch in `<Panel>{…}</Panel>` (`<Panel>` imported from `@bigmarket/bm-ui`).

`Panel.svelte` ([`packages/bm-ui/src/lib/components/custom/Panel.svelte:63-83`](../../packages/bm-ui/src/lib/components/custom/Panel.svelte)) sets its own container:

```svelte
relative overflow-hidden rounded-2xl p-6 sm:p-7
border border-gray-200/80 bg-white/90 backdrop-blur shadow-lg ${a.shadow}
ring-1 ring-black/5 focus-within:outline-none focus-within:ring-2 ${a.ring}
dark:border-gray-700/70 dark:bg-gray-800/90 dark:ring-white/10
text-gray-900 dark:text-white
```

…plus a violet/blue/amber/**emerald**/rose/cyan halo (default `accent="emerald"`) and per-accent rings/shadows built from `from-emerald-400/40 via-teal-400/30 to-green-400/20` etc. (`Panel.svelte:23-60`).

Task 6 ([`C-market-detail.md:246-258`](./C-market-detail.md)) says "Outer container: `bg-card text-card-foreground border border-border rounded-md p-4`" — but **`MarketStaking.svelte` does not own a styled outer container**. Applying the instruction to `MarketStaking.svelte` would either (a) double-wrap (a div around a Panel — nested chrome) or (b) be a no-op (no outer div exists to update).

`Panel.svelte` is not in C's allowed-file list. It is not in prompt B's either. It will silently keep emitting `bg-white/90 dark:bg-gray-800/90` etc. behind every trade widget.

**Recommendation.** Three options:

1. **Add `packages/bm-ui/src/lib/components/custom/Panel.svelte` to C's allowed list** and re-skin its container to `bg-card text-card-foreground border border-border rounded-md` while preserving the `interactive` / `accent` / `forceTheme` API (drop the colored halo for the trade-widget consumer — set `accent="none"` default or remove it). This is the same shape as prompt B's fix to `card.svelte`.
2. **Move `MarketStaking.svelte` off `<Panel>`** to a plain `<div class="bg-card text-card-foreground border border-border rounded-md p-4">` in C. Tradeoff: every other Panel consumer (`StakingCoolDown`, `MarketResolving`, `MarketVoting`, `MarketClaiming`, `MarketLiquidity`) still uses Panel and will look inconsistent.
3. **Defer to a separate "bm-ui Panel fix" prompt** the same way prompt B fixed `card.svelte` + `button-variants.ts` (audit-report `§I` documents this exact "bm-ui Tier-1 leakage" pattern). Then C just sweeps the inner markup of `MarketStaking.svelte`.

Option 1 or 3 is cleanest. Either way, Task 6 must stop pretending `MarketStaking.svelte` owns the outer container.

### C-4. The CTA visuals in Task 7 target the wrong files

**Evidence.** Task 7 ([`C-market-detail.md:261-280`](./C-market-detail.md)) says: "The CTA button on the trade widget should look like: …" and edits `StakingButton.svelte` + `StakingButtonClassic.svelte`.

Grep for `StakingButton` in `packages/bm-market`: only [`do-stake/StakingCoolDown.svelte`](../../packages/bm-market/src/lib/market/version2/do-stake/StakingCoolDown.svelte) imports it. Grep in `apps/`: zero hits. **`StakingButton.svelte` is the cool-down refund button, not the trade-widget CTA.**

The trade-widget CTAs live inline:

- Outcome-row buttons: [`MarketStaking.svelte:339-388`](../../packages/bm-market/src/lib/market/version2/MarketStaking.svelte) — `<button …>` with `bg-green-500` / `bg-red-500` / `bg-orange-500` cluster.
- Buy/Sell purchase CTA: inside [`MarketStakingPurchaseAmount.svelte`](../../packages/bm-market/src/lib/market/version2/market-staking-components/MarketStakingPurchaseAmount.svelte) (126 Tier-1 hits — that's where the real CTA classes live).

**Why it blocks.** The agent will faithfully reshape two cool-down components that the user never sees, and leave the actual Buy/Sell CTA painted `bg-green-500`/`bg-red-500` plus the inline `bg-primary-600 hover:bg-primary-700` of `StakingButtonClassic.svelte:45`. The trade widget visually does not change.

**Recommendation.** Rewrite Task 7 to target:

- The outcome `<button>` cluster in `MarketStaking.svelte:339-388` (yes/no/categorical) — bind to `bg-price-up` / `bg-price-down` for binary, `bg-outcome-{1..4}` for categorical (with the +N more rule from `tokens-and-rules.lock.md` §1.5).
- The buy/sell submit button inside `MarketStakingPurchaseAmount.svelte` — `bg-accent text-accent-foreground` (per `tokens-and-rules.lock.md` §3 "Hit target" and `styling-contract.md` §4.6 "primary ≠ trade action").

Keep `StakingButton(Classic).svelte` in scope only for the mechanical Tier-1 sweep (they belong to the cool-down flow, not the CTA). The "CTA shape" code block belongs above the trade-widget tasks, not under StakingButton.

### C-5. The Tier-1 grep gate will fail by ~78 hits in files outside scope

**Evidence.** The verification block ([`C-market-detail.md:308-311`](./C-market-detail.md)) runs:

```
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-…\b' \
  apps/frontend-c1/src/routes/market \
  packages/bm-market/src/lib/market/version2
```

Tier-1 hits **inside `packages/bm-market/src/lib/market/version2/` but outside C's allowed-file list** (counted per file via the same regex):

| File | Hits | In scope? |
|---|---:|---|
| `do-charts/StakeChart.svelte` | 6 | ❌ |
| `do-charts/TVLChart.svelte` | 6 | ❌ |
| `do-claim/ClaimWinnings.svelte` | 40 | ❌ |
| `do-claim/TransferLosingAmount.svelte` | 2 | ❌ |
| `do-resolve/AgentResolveMarket.svelte` | 4 | ❌ |
| `do-resolve/DisputeResolution.svelte` | 4 | ❌ |
| `do-resolve/FinaliseMarket.svelte` | 2 | ❌ |
| `do-resolve/ResolvedInRange.svelte` | 5 | ❌ |
| `do-vote/DaoMintingInput.svelte` | 9 | ❌ |
| `do-vote/DaoVotingPowerInput.svelte` | 4 | ❌ |
| **Total out-of-scope hits** | **82** | |

The prompt's verification then states: "If grep 2 or grep 3 returns any line, **fix before commit**." ([`C-market-detail.md:329`](./C-market-detail.md)).

**Why it blocks.** The agent's options are: (a) edit files outside the allowed list (violates the top guardrail "Any edit outside the files above" — `C-market-detail.md:42`); (b) give up on the gate (violates the "fix before commit" rule); (c) narrow `rg` itself (violates the explicit verification command). All three break the prompt.

**Recommendation.** Pick one:

1. **Narrow the grep paths to a tight migrated-files list** (the same eighteen-ish paths from the allowed-file list, joined into the `rg` argument list).
2. **Widen the allowed-file list to cover the entire `packages/bm-market/src/lib/market/version2/` tree** plus `packages/bm-market/src/lib/{MarketContainer,MarketSummary,MarketStakingContainer,MarketLiquidityContainer}.svelte` and `packages/bm-market/src/lib/market/MarketResolutionCriteria.svelte`. Accept that C becomes a bigger prompt.
3. **Soft-fail the gate**: change the wording from "must return zero" to "must return zero **for files this prompt migrated**" and have the agent post the raw grep output, then check it by hand.

(1) is the least invasive. (2) is the most honest about the work needed.

### C-6. The Tier-1 grep is blind to the leakage that exists in scope

**Evidence.** The grep regex covers only the Tailwind palette names (`gray|zinc|slate|…|cyan`). Several files in scope use Skeleton-themed primitives instead, which the grep does not catch:

- `MarketStatsBar.svelte:22-26` — `bg-surface text-secondary text-primary border-purple-600/20`. Only the last token (`purple-…`) matches the regex; `bg-surface` / `text-secondary` / `text-primary` slip through.
- `MarketDetails.svelte:16-87` — `bg-surface`, `bg-surface-1`, `bg-surface-2`, `text-secondary`, `text-primary`, `divide-outline`, `border-purple-600/20`. Only `purple-…` and `green-400` match; the rest slip.
- `StakingButton.svelte:72` — `border-secondary-600 bg-secondary-100 text-secondary-800 hover:bg-primary`. None of these match the regex (no Tailwind palette name).
- `StakingButtonClassic.svelte:45` — `border-gray-300 bg-gray-800` (matches) **+** `bg-primary-600 hover:bg-primary-700 focus:ring-primary-400` (does not match).
- `MarketStaking.svelte:255, 271, 283` — Skeleton-themed `text-gray-500 dark:text-gray-400` (matches) but the surrounding `Panel` uses `from-emerald-400/40 via-teal-400/30 to-green-400/20` (matches `emerald-400`, `teal-400`, `green-400`, plus a slash-opacity that the regex won't fully bound — but the prefix still hits).

The audit report flagged this exact failure mode in `audit-report.md` §2.B "Market detail layout" line 51: "`MarketStatsBar.svelte:22` uses `bg-surface text-secondary text-primary border-purple-600/20` (mixed Skeleton + Tier-1)".

**Why it matters.** The agent can hit "grep returns zero" while leaving an entire Skeleton-primitive layer in place. The leakage is invisible to CI.

**Recommendation.** Either:

- Strengthen the grep regex to include the Skeleton primitive scales we treat as Tier-1 (`bg-surface\b`, `bg-surface-\d`, `(text|bg|border|ring|hover:bg|hover:text)-(primary|secondary|tertiary|success|warning|error|surface)-\d{2,3}\b`, `bg-(primary|secondary|tertiary|success|warning|error)\b` when used as a Tailwind utility — note that some of these will collide with our **semantic** `bg-primary` / `bg-secondary` Tier-2 names, so the regex needs the numeric suffix to be unambiguous).
- Add a one-line "Forbidden also: `bg-surface`, `text-primary` (when used as the legacy Skeleton class, not the Tier-2 semantic), `text-secondary` (same), `bg-surface-1/2`, `divide-outline`" to the Forbidden section of the prompt.
- Cross-link `audit-report.md` §I "`MarketStatsBar.svelte:22`" as the worked example.

This is the same gap fix that should land in prompt B's verification block; mention it as a forward note.

---

## 3. High-priority findings (fix, but not strictly blockers)

### C-7. `MarketContainer.svelte`, `MarketSummary.svelte`, `MarketResolutionCriteria.svelte` are out of scope yet hold the bulk of visible Tier-1 leakage

| File | Tier-1 hits | Rendered? | In C's scope? |
|---|---:|:---:|:---:|
| `MarketContainer.svelte` | 23 | yes | ❌ |
| `MarketSummary.svelte` | 50 | yes | ❌ |
| `MarketResolutionCriteria.svelte` | 54 | yes | ❌ |
| (totals just for these three) | **127** | | |

Examples:

- `MarketContainer.svelte:121` (trade/liquidity tab strip): `border-gray-200 bg-gray-100 p-1 shadow-inner dark:border-gray-600 dark:bg-gray-800`.
- `MarketContainer.svelte:129-131` (tab buttons): `text-emerald-800 dark:text-emerald-200`, `text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100`, `focus-visible:ring-emerald-500`.
- `MarketContainer.svelte:166-172` (chart card): `border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-700 dark:bg-gray-800`.

These are the chrome the user actually sees on the live market-detail page. C cannot improve the visible page without touching at least `MarketContainer.svelte`. Tied to fix C-1; the recommendation there folds these files in.

### C-8. Task 4's time-range tab strip has no live counterpart — risk of an unsolicited script change

**Evidence.** [`MarketCharts.svelte:7-13, 15-39`](../../packages/bm-market/src/lib/market/version2/MarketCharts.svelte) accepts only `{ market, showTvl, showStake }` and renders `StakeChart` / `TVLChart` unconditionally. There is no range state, no handler, no `5m / 1H / 6H / 1D / 1W / 1M / All` UI.

The prompt ([`C-market-detail.md:188-209`](./C-market-detail.md)) prints the full tab-strip code block and **only at the bottom** says "If there is no existing time-range selector logic, **do not add one in this prompt**." Several agents will read the code block first and treat the late instruction as a soft guideline, then introduce a new `setRange` + `let activeRange = $state(...)` — which is a `<script>` body change the prompt's guardrail bans (`C-market-detail.md:43`).

**Why it matters.** The prompt's strongest guardrail is "ANY edit to Svelte `<script>` blocks that own state … is forbidden". Putting an inviting code sample in front of that rule is asking for a violation.

**Recommendation.** Reorder the task: lead with "Today this component has no time-range selector. Migration is class-only. Add only a TODO comment. The reference shape is below." Then the code block. Or remove the code block from C entirely and reference it in a follow-up doc.

### C-9. Task 6 conflates binary-outcome colors with categorical-outcome colors

**Evidence.** Task 6 ([`C-market-detail.md:252`](./C-market-detail.md)): "Buy/Sell buttons or any Tier-1 colors → `bg-price-up`/`bg-price-down` for outcome buttons".

But `MarketStaking.svelte` renders **every category** as an outcome row, not just Yes/No (`MarketStaking.svelte:300-388`). For categorical markets with three or more options, mapping all of them to `price-up`/`price-down` is wrong; `tokens-and-rules.lock.md` §1.5 explicitly reserves `outcome-1..4` for categorical and the +N more pill for 5+.

`current-vs-target.md` §3 Gap 1 also bans the existing `bg-orange-500` cluster from being mapped onto `price-up`/`price-down`.

**Recommendation.** Two-tier rule in Task 6:

- Binary (`marketData.categories.length === 2`): Yes → `bg-price-up-soft text-price-up border-price-up-soft`, No → `bg-price-down-soft text-price-down border-price-down-soft` (mirrors prompt B's `MarketEntry.svelte` mapping for the homepage Yes/No buttons).
- Categorical / scalar: outcome 0 → `bg-outcome-1-soft text-outcome-1 …`, outcome 1 → `bg-outcome-2-soft …`, etc., capped at four. The 5+ case is out of scope for C (deferred per `tokens-and-rules.lock.md` §1.5).

### C-10. Sticky offset `lg:top-20` is off by one

**Evidence.** `tokens-and-rules.lock.md` and the prompt assume an 80 px sticky header. The actual header in [`HeaderMenuTailwind.svelte:106`](../../apps/frontend-c1/src/lib/components/template/HeaderMenuTailwind.svelte) is `h-16` = 64 px. `MarketContainer.svelte:25` already uses `lg:sticky lg:top-4` (16 px) in the staking container.

**Recommendation.** Use `lg:top-16` (or align with whatever `MarketContainer.svelte`'s sticky offset is once C-1 lands). Or measure once and write the chosen value into `styling-contract.md` so future prompts cite a single value.

### C-11. `pnpm --filter @bigmarket/bm-market check` does not exist

**Evidence.** [`packages/bm-market/package.json:15-17`](../../packages/bm-market/package.json) defines only `"build": "svelte-package"`. There is no `check`, no `typecheck`, no `lint` script.

The verification block (`C-market-detail.md:303`) runs `pnpm --filter @bigmarket/bm-market check` first. It will error immediately.

**Recommendation.** Drop the line; `pnpm --filter @bigmarket/frontend-c1 check` already type-checks `@bigmarket/bm-market` transitively because the route imports it. Alternatively replace with `pnpm --filter @bigmarket/bm-market build` (which runs `svelte-package`).

### C-12. Inconsistent `pnpm --filter` package name (cosmetic but real)

Prompt A uses `@bigmarket/frontend-c1`; prompts B and C use bare `frontend-c1`. pnpm filters match either an exact package name or a directory glob; the bare `frontend-c1` is ambiguous and may resolve to **nothing** depending on pnpm version (it does work on pnpm 10.33.0 in this repo, but it is not portable across versions). Pick one form and use it everywhere — prefer `@bigmarket/frontend-c1` (matches the actual package name) or `--filter ./apps/frontend-c1` (always unambiguous).

### C-13. Forward note missing: C depends on B's bm-ui consumers being fixed, not just A's tokens

**Evidence.** The prompt says "Prerequisites: Build Prompt A landed. Build Prompt B landed (so `bm-ui` Card / Button leakage is fixed and the homepage proves the pipeline)." (C-market-detail.md:7).

But prompt B's allowed-file list only touches `bm-ui/card/card.svelte` and `bm-ui/button/button-variants.ts`. It does NOT fix the **other** bm-ui primitives that consume Wave-1 tokens — `popover-content.svelte`, `dialog-content.svelte`, `input.svelte`, `select-trigger.svelte`, `tabs-trigger.svelte`, `checkbox.svelte`, `switch.svelte`, `badge-variants.ts` (audit-report `§I` lines 162-163: "**None of `--color-card`, `--color-popover`, `--color-input` exist in `theme.css`**"). Prompt A creates those CSS variables; after A lands, the bm-ui consumers will start emitting valid CSS. But none of B or C verify it.

For C specifically: the trade widget uses `<Banner>`, `<Panel>`, `<ConnectButton>`, `<Countdown>`, `<Bulletin>` from `@bigmarket/bm-ui` (`MarketStaking.svelte:2-4, 8-11, 15` etc.). If any of those primitives still references Tier-1 internally — and `Panel.svelte` definitely does — C's "looks good in light + dark" verification step at line 320-327 will pass for the migrated files yet fail visually on the chrome the user actually sees.

**Recommendation.** Add a "Forward dependency" line to C:

> The trade widget renders inside `<Panel>` from `bm-ui`. `Panel.svelte` is NOT in scope here; if `Panel.svelte`'s Tier-1 leakage (see audit-report.md §I) has not been swept before C runs, the visible trade-widget chrome will still be off-brand. Track separately. — alternatively, add `Panel.svelte` to C's scope (see C-3 option 1).

---

## 4. Medium / cosmetic findings

### C-14. Task 5 doesn't show how to move the existing OrderBook outer `<div>` inside `<details>`

`OrderBook.svelte:86` opens with `<div class="rounded-xl border border-gray-600 bg-gray-800 p-4">`. The Task-5 example introduces a `<details … class="rounded-md bg-card …">` and an inner `<div class="px-4 pb-4 pt-2">`. The prompt doesn't say what happens to the existing `<div>` — should it become the inner div, be deleted, or stay outside? Worth one sentence. Moot if C-2 removes OrderBook from scope.

### C-15. `<details>`/`<summary>` accessibility nit

The chevron rotation `group-open:rotate-180` (`C-market-detail.md:226`) is purely decorative but the `▾` glyph is still a text-rendered triangle that screen readers will speak. `aria-hidden="true"` is correctly applied; the `<summary>` itself, however, also benefits from explicit `aria-expanded` state via `<details>`'s native semantics — no work needed, just confirm in the PR. Minor.

### C-16. Reduced-motion verification step (`C-market-detail.md:326`) only checks the live pill

The prompt's verification at line 326 says "With macOS 'Reduce motion' enabled: no infinite pulse on the live pill (if present)." But under prompt A, the global guard already kills `animation-duration` everywhere, and Task 5's `<details>` `transition-transform` rotation should also degrade. Worth verifying *both* (the chevron + the pulse). Minor.

### C-17. Verification grep #3 is too narrow

Line 313: `rg -n '(bg|text|border|ring|fill|stroke)-\[' apps/frontend-c1/src/routes/market packages/bm-market/src/lib/market/version2` — does not cover `shadow-[…]`, `from-[…]`, `to-[…]`, `via-[…]`, `outline-[…]`, `divide-[…]`, `placeholder-[…]`, `caret-[…]`. `tokens-and-rules.lock.md` §4 forbids all of those in feature code. Align the grep with the lock-file's full list (and with prompt A/B's regex).

### C-18. The reference-screenshot list cites filenames that don't exist verbatim

`C-market-detail.md:66`: `docs/design/assets/polymarket/{market details - BTC Up or Down 5m*.png, market details - West Ham*.png, market details - Hantavirus*.png, order book.png, widget buying.png}`.

Real filenames on disk (resolved via Glob):

- `market details - BTC Up or Down 5m Predictions   Odds 2026   Polymarket.png` (and `(1).png`) ✓ (matches the glob)
- `market details - West Ham United FC vs. Arsenal FC Odds   Predictions  May 10, 2026    Polymarket.png` ✓
- `market details - Hantavirus pandemic in 2026  Predictions   Odds   Polymarket.png` ✓
- `order book.png` ✓
- `widget buying.png` — NOT present in `docs/design/assets/polymarket/`. Closest match in repo: not found.

Either drop the `widget buying.png` reference or add the screenshot to the repo. Low-priority.

### C-19. PR-summary template item "N other components in packages/bm-market/src/lib/market/version2/" undercounts

Line 343 of the template uses an unspecified `N`. With C in scope as-written, `N = 18`. Worth pinning the number so reviewers can sanity-check.

---

## 5. What Prompt C gets right (keep)

- **Behavior-preservation guardrails are clean** (the "ANY edit to Svelte `<script>` blocks that own state …" line at `C-market-detail.md:43` is the same shape as B's). Keep.
- **The "Tier-1 sweep" tasks (Task 2, Task 8) are mechanically correct** for the files that *are* rendered: `MarketHeader`, `MarketCharts`, `MarketComments`, `MarketStaking`, `MarketStakingPurchaseAmount`, `ResolutionBanner`, `SlippageSlider`, `SharePriceInfo`, `StakingCoolDown`, `MarketResolving`, `MarketVoting`, `MarketClaiming`, `MarketLiquidity`. These hold ~340 of the ~430 Tier-1 hits in `version2/`, and the migration plays exactly like B's homepage sweep — token substitutions are spelled out, no script changes required.
- **Naming discipline is correct.** The prompt insists on `text-price-down` (not `text-destructive`) for the sell-side rows (`C-market-detail.md:236`) and rejects the `¢` glyph and arbitrary values. Matches `tokens-and-rules.lock.md` §1.4 and `styling-contract.md` §4.7.
- **Resolution-banner three-state mapping** (`bg-warning-soft` / `bg-success-soft` / `bg-info-soft` per resolution state — `C-market-detail.md:293`) is correct and uses tokens A lands.
- **`tabular-nums` and focus-ring sweeps in Task 8** are the right baseline rule (matches `tokens-and-rules.lock.md` §2-§3).
- **Recommended-model split** (Claude Code for layout, Cursor Auto for sweeps) is realistic.

---

## 6. Recommended next steps (apply in this order)

1. **Resolve C-1 and C-2 together.** Decide what's in scope: the realistic answer is "rewrite Task 1 against `MarketContainer.svelte`, add `MarketSummary` + `MarketStakingContainer` + `MarketLiquidityContainer` + `MarketResolutionCriteria` to the allowed-file list, and drop `MarketStatsBar`/`MarketDetails`/`OrderBook` from C (defer to a later pass)". This expands C by ~5 files but makes the page actually change.
2. **Resolve C-3.** Either add `Panel.svelte` to C's scope and re-skin its container, or fork a small "bm-ui Panel" prompt to run between B and C.
3. **Resolve C-4.** Move Task 7's CTA shape into a new task that edits `MarketStaking.svelte` (outcome buttons) and `MarketStakingPurchaseAmount.svelte` (submit CTA). Leave `StakingButton(Classic).svelte` as part of the mechanical Task 8 sweep.
4. **Resolve C-5.** Pick option (1) (narrow the grep paths to the exact migrated files) — cheapest, doesn't affect scope.
5. **Resolve C-6.** Strengthen the Tier-1 regex with the Skeleton-primitive scales. Mirror the fix into A and B for consistency.
6. **Apply the smaller fixes** C-7 (folded into C-1), C-8 (reorder Task 4), C-9 (split binary vs categorical), C-10 (`lg:top-16`), C-11 (drop the dead `bm-market check` line), C-12 (consistent `pnpm --filter` form), C-13 (forward-note `Panel`), C-14, C-17, C-18, C-19.
7. **Re-read** the updated C against `tokens-and-rules.lock.md`, `styling-contract.md`, and the audit-report's §I drift list. Confirm every visible chrome surface on the market-detail page is reachable via an allowed file.

After (1)-(6), the prompt should be runnable end-to-end on a fresh agent session without hitting the structural pitfalls above.

---

## 7. Quick reference — counts cited in this audit

All counted via the C-market-detail.md verification regex (Tailwind palette only) unless noted. "In scope" = file appears in the allowed-file list in `C-market-detail.md:18-39`.

| File | Tier-1 hits | Rendered on market-detail? | In C's scope? |
|---|---:|:---:|:---:|
| `apps/.../market/[marketId]/[marketType]/+page.svelte` | 2 | yes | ✅ |
| `packages/bm-market/src/lib/MarketContainer.svelte` | 23 | yes | ❌ |
| `packages/bm-market/src/lib/MarketSummary.svelte` | 50 | yes | ❌ |
| `packages/bm-market/src/lib/MarketStakingContainer.svelte` | 0 | yes | ❌ |
| `packages/bm-market/src/lib/MarketLiquidityContainer.svelte` | 0 | yes | ❌ |
| `packages/bm-market/src/lib/market/MarketResolutionCriteria.svelte` | 54 | yes | ❌ |
| `packages/bm-market/src/lib/market/version2/MarketHeader.svelte` | 7 | yes | ✅ |
| `…/MarketStatsBar.svelte` | 1 (+ many Skeleton primitives) | **no** | ✅ |
| `…/MarketCharts.svelte` | 8 | yes | ✅ |
| `…/MarketDetails.svelte` | 9 (+ many Skeleton primitives) | **no** | ✅ |
| `…/MarketStaking.svelte` | 67 | yes | ✅ |
| `…/market-staking-components/MarketStakingPurchaseAmount.svelte` | 126 | yes | ✅ |
| `…/OrderBook.svelte` | 20 | **no** | ✅ |
| `…/MarketComments.svelte` | 48 | yes | ✅ |
| `…/MarketResolving.svelte` | 27 | yes (state-dependent) | ✅ |
| `…/MarketVoting.svelte` | 23 | yes (state-dependent) | ✅ |
| `…/MarketClaiming.svelte` | 7 | yes (state-dependent) | ✅ |
| `…/MarketLiquidity.svelte` | 78 | yes (tab-dependent) | ✅ |
| `…/do-resolve/ResolutionBanner.svelte` | 6 | yes (state-dependent) | ✅ |
| `…/do-stake/SlippageSlider.svelte` | 6 | yes | ✅ |
| `…/do-stake/SharePriceInfo.svelte` | 0 | unclear | ✅ |
| `…/do-stake/StakingButton.svelte` | 1 (+ Skeleton primitives) | **no** (cool-down only) | ✅ |
| `…/do-stake/StakingButtonClassic.svelte` | 9 (+ Skeleton primitives) | **no** (cool-down only) | ✅ |
| `…/do-stake/StakingCoolDown.svelte` | 0 | yes (state-dependent) | ✅ |
| `…/do-charts/StakeChart.svelte` | 6 | yes | ❌ |
| `…/do-charts/TVLChart.svelte` | 6 | yes (if `showTvl`) | ❌ |
| `…/do-claim/ClaimWinnings.svelte` | 40 | yes (state-dependent) | ❌ |
| `…/do-claim/TransferLosingAmount.svelte` | 2 | yes (state-dependent) | ❌ |
| `…/do-vote/DaoMintingInput.svelte` | 9 | yes (state-dependent) | ❌ |
| `…/do-vote/DaoVotingPowerInput.svelte` | 4 | yes (state-dependent) | ❌ |
| `…/do-resolve/AgentResolveMarket.svelte` | 4 | yes (state-dependent) | ❌ |
| `…/do-resolve/DisputeResolution.svelte` | 4 | yes (state-dependent) | ❌ |
| `…/do-resolve/FinaliseMarket.svelte` | 2 | yes (state-dependent) | ❌ |
| `…/do-resolve/ResolvedInRange.svelte` | 5 | yes (state-dependent) | ❌ |
| `packages/bm-ui/src/lib/components/custom/Panel.svelte` | ~10 (+ arbitrary opacity tokens) | yes (every Panel) | ❌ |

**In-scope total (rendered):** ~427 Tier-1 hits in `version2/` plus the 2 on the route file.
**Out-of-scope-but-rendered total:** 127 in `lib/` + ~80 in `version2/` (do-claim/do-vote/do-resolve/do-charts) + ~10 in `bm-ui/Panel.svelte` = ~217.

If C is fixed per Section 6, the **out-of-scope-but-rendered** number drops to roughly the Panel + do-charts + do-resolve hits (~30), which is the right size for a follow-up prompt.
