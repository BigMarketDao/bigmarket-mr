# Audit of Build Prompt B0 — Header chrome first

> Read-only audit of [`docs-v2/build-prompts/B0-header-chrome.md`](../B0-header-chrome.md), checking it against:
> - the rules in [`../tokens-and-rules.lock.md`](../tokens-and-rules.lock.md), [`../sources-of-truth.md`](../sources-of-truth.md), [`../design/styling-contract.md`](../design/styling-contract.md)
> - the assumptions in the prompt (allowed-file list, line numbers, class strings, grep gates, "AlphaBanner is dead" claim, dependency on Prompt A's tokens)
> - the **actual code** on disk in `apps/frontend-c1/src/{app.html, routes/+layout.svelte, routes/+page.svelte}`, `apps/frontend-c1/src/lib/components/template/*.svelte`, `packages/bm-ui/src/lib/components/ui/{card,button}/*`, and `packages/bm-ui/src/lib/components/custom/PageContainer.svelte`.
>
> Same shape as [`./C-market-detail.md`](./C-market-detail.md). No code edits, no edits to `B0-header-chrome.md`; this file is the gap report only.

---

## 1. Summary verdict

**B0 is in much better shape than C.** Every file it lists is real, every line number it cites is accurate (with one typo), every class string it asks the agent to replace exists in the source, and the tokens it consumes will be present after Prompt A. The grep gates are tightly scoped to the migrated files (so they won't false-fail on out-of-scope leakage the way C's do). The script-block carve-out for the three `navLink*` constants is correctly motivated (those strings hold no logic).

**The one real problem is scope, not correctness.** Three visible chrome surfaces on every page are *not* in B0's allowed-file list, so after a perfect B0 run the user still sees Tier-1 leakage above, around, and below the migrated header:

1. **`apps/frontend-c1/src/routes/+layout.svelte`** — the app's outermost wrapper. 5 Tier-1 sites including the duplicate `bg-gray-900` splash, `bg-gray-50 dark:bg-gray-900` on the main app container, `text-orange-800` on the network-mismatch banner, and `border-purple-600/20` on the footer divider.
2. **`apps/frontend-c1/src/lib/components/template/AlphaBanner.svelte`** — B0 claims its markup is "fully commented out". **It is not.** The inner mint-button block is commented out; the wrapping `<header>` with `border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900` is live and renders above HeaderMenuTailwind on every page (17 Tier-1 hits).
3. **`packages/bm-ui/src/lib/components/custom/PageContainer.svelte`** — wraps every route's children. Uses `bg-white dark:bg-gray-900 text-gray-900 dark:text-white` (3 Tier-1 hits). Same `bm-ui` leakage pattern the audit-report flagged for Card and Button, but missed here.

If you add those three files to scope (~10 class substitutions total across the three) B0 closes the chrome end-to-end in one PR. Without them, B0 still works — it just leaves a "half-token, half-Tier-1" chrome that will look obviously inconsistent in both themes.

**Top three blockers to fix before running B0:**

1. Add `apps/frontend-c1/src/routes/+layout.svelte` to scope and sweep its 5 Tier-1 sites (Task 0, before Task 1).
2. Fix the AlphaBanner.svelte claim — its `<header>` is live, not commented out. Either add it to scope for a 5-substitution class-only sweep, or update the guardrail wording so the agent doesn't mis-skip it.
3. Add `packages/bm-ui/src/lib/components/custom/PageContainer.svelte` to scope. 3-class fix, identical shape to the Card fix already in Task 6.

Everything below the top 3 is "small fixes worth landing, none of them block".

---

## 2. Critical findings (none)

**No file path is wrong. No line number is off by more than 1 line. No class string is invented.** B0's substitution tables match the source code on disk:

| B0 cite | Status |
|---|---|
| `app.html` 58 lines, splash `lines 21-44`, `bg gray-900` at line 26, `#667085` at line 41 | ✅ all correct |
| `HeaderMenuTailwind.svelte` ~375 lines, script `1-100`, desktop `102-222`, mobile `224-363` | ✅ all correct (header opens 102 closes 222, mobile opens 224 closes 364) |
| Each Tier-1 utility B0 enumerates (`zinc-200`, `zinc-700`, `zinc-950/45`, `zinc-200/80`, `red-700 dark:red-400`, etc.) | ✅ all present at the cited line |
| `ReputationCommunityBanner.svelte` 101 lines | ✅ correct |
| `Footer.svelte` 81 lines | ✅ correct (every line cited verified) |
| `+page.svelte` 47 lines | ✅ correct |
| `card.svelte` 43 lines, `cn(...)` block lines 17-35 | ✅ (the `cn` block actually closes line 38; the class string itself spans 17-36 — within 2 lines) |
| `button-variants.ts` 85 lines | ✅ correct |
| `theme.css` "after Prompt A landed — confirm `--color-card`, `--color-popover`, `--color-community`, `--color-community-soft`, `--color-community-border`, `--color-input`, `--color-accent`" | ✅ all defined by A's Task 1 (verified against `A-token-wiring.md:56-104`) |

The `navLink*` script-mutation carve-out is also safe: the three constants (lines 94-99) hold only class-name strings, no logic.

`pnpm --filter @bigmarket/frontend-c1` matches `apps/frontend-c1/package.json:2` exactly, and the form is consistent with Prompt A. (Fixes C-12 from the C audit.)

---

## 3. High-priority findings (scope omissions that leave visible Tier-1)

### B0-A1. `apps/frontend-c1/src/routes/+layout.svelte` is out of scope yet wraps every page

**Evidence.** The `+layout.svelte` is the outermost rendered surface — HeaderMenuTailwind, ReputationCommunityBanner, page content, Footer all mount inside it. Tier-1 hits at:

- `:106` — `class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gray-900"` (the **Svelte-side splash**, duplicates the `app.html` splash B0 already migrates in Task 1)
- `:109` — `class="mt-4 font-sans text-sm text-gray-500"` (splash copy)
- `:113` — `class="flex min-h-dvh flex-col bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100"` (the **app's main container** — visible everywhere)
- `:127` — `class="text-orange-800 dark:text-orange-300"` (network-mismatch banner)
- `:140` — `class="shrink-0 border-t border-purple-600/20 dark:border-purple-500/25"` (footer wrapper)

The audit-report flagged this exact file at `audit-report.md §I` lines 159-160 ("`+layout.svelte` Tier-1 utilities — **Drifted**"). B0 inherits the gap; its allowed-file list only covers `+page.svelte`, not `+layout.svelte`.

**Why it blocks the visible goal.** After B0 lands:
- HeaderMenuTailwind is on tokens (`bg-background/90`, etc.).
- The `<div>` it sits inside (`+layout.svelte:113`) still emits `bg-gray-50 dark:bg-gray-900`. In light mode this is `#f9fafb` (cool gray) vs. the new `--color-background` Skeleton-cream — visibly distinct stripes.
- The Footer is on tokens, but the wrapping `<div class="border-t border-purple-600/20 dark:border-purple-500/25">` paints a thin purple divider above it.
- The "Loading BigMarket..." splash now exists in two places (`app.html` migrated, `+layout.svelte` not). On a slow connection users see the unmigrated one.

**Recommendation.** Add a "Task 0 — Migrate `+layout.svelte`" with:

| Line | Current | Target |
|---|---|---|
| 106 | `bg-gray-900` | `bg-background` |
| 109 | `text-gray-500` | `text-muted-foreground` |
| 113 | `bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100` | `bg-background text-foreground` |
| 127 | `text-orange-800 dark:text-orange-300` | `text-warning` (Wave-2 token from A) |
| 140 | `border-t border-purple-600/20 dark:border-purple-500/25` | `border-t border-border` (or drop the wrapper div entirely — Footer already has `border-t border-border`) |

Add the file to the allowed list and to the verification grep paths. Five substitutions, zero `<script>` changes, no behavior risk.

### B0-A2. `AlphaBanner.svelte` is NOT fully commented out

**Evidence.** B0's Forbidden block (line 40) says:

> `AlphaBanner.svelte` — its active markup is fully commented out (only the script's import lines run). Leave it alone in B0; touch it when the wallet/mint flow is rebuilt.

The actual file is 110 lines. Lines 50-86 (the mint/connect button block) **are** commented out. **Lines 37-89 are not.** The active markup is:

```svelte
<header
    class="relative top-0 right-0 left-0 z-[999] h-16 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
>
    <nav class="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div class="font-bold tracking-wide text-gray-900 dark:text-gray-200">
            BigMarket {appConfig.VITE_NETWORK === 'testnet' ? appConfig.VITE_NETWORK.toUpperCase() : 'ALPHA'}
        </div>
        <div class="flex h-[80%] items-center gap-3 overflow-hidden text-gray-900 dark:text-gray-200">
            <!-- ...the commented-out mint block lives here... -->
        </div>
    </nav>
</header>
```

That's a full-width `h-16` header bar with `border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900` (Tier-1) rendered **above** HeaderMenuTailwind on every page. 17 Tier-1 hits in the file (counted via the same B0 regex).

`+layout.svelte:116` renders `<AlphaBanner />` immediately before `<HeaderMenuTailwind />`, so users see: `[AlphaBanner Tier-1 stripe]` → `[HeaderMenuTailwind tokens]` → content. After B0, the visible mismatch is exactly there.

**Why it blocks the visible goal.** "Header chrome is on tokens in both themes" is verification step 1 (B0 line 346). With AlphaBanner left untouched, that step is failing as written — there are two headers, one migrated and one not, with a visible color seam between them.

**Recommendation.** Two options:

1. **Add `AlphaBanner.svelte` to scope** for a class-only sweep. The substitution is small:

   | Line | Current | Target |
   |---|---|---|
   | 38 | `relative top-0 right-0 left-0 z-[999] h-16 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900` | `relative top-0 right-0 left-0 z-[999] h-16 border-b border-border bg-background` |
   | 43 | `text-gray-900 dark:text-gray-200` | `text-foreground` |
   | 49 | `text-gray-900 dark:text-gray-200` | `text-foreground` |

   (3 substitutions; the script block stays untouched; the commented-out mint block is left alone.)

2. **Rewrite the guardrail.** Change "fully commented out" to "the inner mint-button block (lines 50-86) is commented out; the wrapping `<header>` is active and uses Tier-1, but its rebuild is deferred to a future prompt." Accept the visible seam in this PR.

Option 1 is cleaner — the work is identical in shape to Task 4 (Footer) and fits B0's 40-60 min window.

### B0-A3. `bm-ui` `PageContainer.svelte` is the page surface; out of scope

**Evidence.** [`packages/bm-ui/src/lib/components/custom/PageContainer.svelte:5-9`](../../packages/bm-ui/src/lib/components/custom/PageContainer.svelte):

```svelte
<div class="min-h-screen bg-white dark:bg-gray-900">
    <div class="mx-auto w-full max-w-7xl px-4 py-8 text-gray-900 sm:px-6 lg:px-8 lg:py-12 dark:text-white">
        {@render children?.()}
    </div>
</div>
```

`PageContainer` wraps the homepage children (see `+page.svelte:31-46` which renders `<PageContainer>…</PageContainer>`). After B0 fixes the empty-state markup *inside* PageContainer (Task 5), the surrounding PageContainer itself still emits `bg-white dark:bg-gray-900 text-gray-900 dark:text-white`.

This is the same class of leakage Prompt B's Task 2 (and B0's Task 6) fixes for `bm-ui/Card` and `bm-ui/Button outline`. The audit-report listed `bm-ui` leakage as a blocker (`§I` lines 161-164). PageContainer was missed.

**Why it matters.** PageContainer is the **page surface** behind every route — `+page.svelte`, every `/reputation`, `/my-markets`, `/dao`, every detail page (until they get their own layout). After B0, the chrome above and below uses tokens but the surface under them stays Tier-1. The cool `gray-50` light surface clashes with the warm Skeleton cream `--color-background`.

**Recommendation.** Add `packages/bm-ui/src/lib/components/custom/PageContainer.svelte` to scope and migrate the two divs in one substitution:

```svelte
<div class="min-h-screen bg-background">
    <div class="mx-auto w-full max-w-7xl px-4 py-8 text-foreground sm:px-6 lg:px-8 lg:py-12">
        {@render children?.()}
    </div>
</div>
```

No prop changes, no script changes, no slot changes. 3 substitutions.

---

## 4. Medium findings (small accuracy / clarity fixes)

### B0-M1. Line-number typo for `ReputationCommunityBanner.svelte` `<dt>` elements

**Evidence.** B0 line 175:

> `font-medium text-purple-600/80 dark:text-purple-400/90` (each `<dt>`, lines 46, 54, 62, 68 commented, **83**, 92, **316**)

The file is 101 lines. **Line 316 does not exist.** Likely a stale paste from another file. The correct list is `46, 54, 62, 68 (commented), 83`. The "92" reference is also miscategorised — line 92's class belongs to the fallback "Connect wallet" `<div>`, not a `<dt>` (line 175 already covers that under its own row).

**Recommendation.** Change to: `(each <dt>, lines 46, 54, 62, 83. Line 68 is inside a commented block.)`.

### B0-M2. Ambiguous "leave `text-white`" instruction on the Footer monogram row

**Evidence.** B0 Task 4 table:

```
| `bg-orange-500 ... shadow-sm transition-colors group-hover:bg-orange-600` (BM monogram square, line 31) | `bg-accent text-accent-foreground shadow-sm transition-colors group-hover:bg-accent/90` |
| `text-white` (BM monogram inner span has `text-white` implicit on parent; keep) | leave |
```

The `text-white` in Footer.svelte:31 is **explicitly on the parent div** (`bg-orange-500 text-white shadow-sm ...`), not "implicit". The row above already replaces it (with `text-accent-foreground`). The "leave" row is therefore a contradiction — either we keep `text-white` (and end up with `bg-accent text-accent-foreground text-white` where Tailwind's class order picks one arbitrarily), or we don't (and the inner span inherits `text-accent-foreground`, which is what we want).

Two agents will read this differently. The behaviorally-correct outcome is "drop `text-white` entirely; the inner span inherits `text-accent-foreground`".

**Recommendation.** Delete the second row of the table. The first row already handles it. Add a one-line note: "The inner `<span class="text-sm font-bold">BM</span>` inherits the new `text-accent-foreground` from the parent — no separate change."

### B0-M3. `focus-visible:outline-offset-[-2px]` is an arbitrary value not caught by the grep

**Evidence.** B0 line 165 introduces:

```
focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring
```

`outline-offset-[-2px]` is an arbitrary value. B0's own forbidden list (line 36) bans `ring-[Npx]`, `text-[Npx]`, `bg-[#abc]`, etc. The grep at line 328:

```
rg -n '(bg|text|border|ring|fill|stroke|shadow)-\[' …
```

…does NOT include `outline-offset` as a prefix, so it would let `outline-offset-[-2px]` through. The lock-file (`tokens-and-rules.lock.md` §4) bans **all** arbitrary values in feature code, not just the grep-listed ones.

**Recommendation.** Either:

1. Use Tailwind v4's `-outline-offset-2` (negative-offset utility — supported since v3.3, preserved in v4). This compiles to `outline-offset: calc(var(--spacing) * -2)` = `-8px`. If you want exactly `-2px`, add an `outline-offset-2 -outline-offset-2` pair (no — better: just accept `-outline-offset-2` ≈ `-8px` and verify it visually looks OK).
2. Drop the negative offset and use `focus-visible:outline-offset-0` (outline sits flush with the border, no inset). Simpler.
3. Define a semantic `--outline-offset-banner: -2px` in `theme.css` and use `outline-offset-banner` — overkill for one banner.

Option 2 is the cheapest; the Reputation banner doesn't need the inset look.

### B0-M4. B0's Tier-1 regex includes `accent` as a prefix; A's and C's don't

**Evidence.** B0 line 318: `\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret|**accent**)-(gray|zinc|...)-(...)\b`. A's and C's regex lack `accent`.

Tailwind's `accent-` utility sets `accent-color` for form inputs (`<input type="checkbox">`, `<input type="radio">`, etc.). It can take any palette token (`accent-red-500`). In practice no migrated file uses it — but having the prefix in B0's regex while A and C don't is a cosmetic drift.

**Recommendation.** Either drop `accent` from B0's regex, or add it to A and C for consistency. (Trivial; aligning all three is the cleanest.)

### B0-M5. Disconnect button hover changes from "underline only" to "underline + color shift"

**Evidence.** HeaderMenuTailwind.svelte:347-348 currently:

```svelte
class="py-2.5 text-left text-sm text-red-700 underline-offset-4 hover:underline dark:text-red-400"
```

B0's substitution (line 146): `text-red-700 ... dark:text-red-400` → `text-destructive hover:text-destructive/90`. The result:

```svelte
class="py-2.5 text-left text-sm text-destructive hover:text-destructive/90 underline-offset-4 hover:underline"
```

Original hover: text stays the same red; underline appears.
New hover: text shifts to a slightly lighter destructive; underline appears.

That's a small, intentional behavior change (color shift on hover). Not breaking, but B0 has a "DO NOT change behavior" rule at line 19. Worth either:

- Drop the `hover:text-destructive/90` and keep only `text-destructive` (matches original "no color shift on hover").
- Keep as-is and acknowledge in the PR template that hover on Disconnect now also shifts color.

Either is fine; the prompt should pick one.

### B0-M6. Card-surface color shift across the whole app — worth flagging at the top of Task 6

**Evidence.** Today `bm-ui/Card` paints `bg-zinc-100 dark:bg-gray-900` — light mode is cool gray, dark mode is near-black. After B0, it paints `bg-card` which (after A) resolves to:

- Light: `var(--color-surface-50)` — Skeleton's near-white *warm cream*
- Dark: `var(--color-surface-900)` — Skeleton's *dark cream*

That's a noticeable hue shift on **every Card across the app** — Reputation page, My Bets, leaderboard, every market card consumer. B0 already addresses this in verification step 9 (`B0-header-chrome.md:354`): "Cards anywhere in the app … still render … If a card looks too 'flat', flag in the PR". Good. But the Task 6 body could mirror the "**This is a visible change** and is intentional" callout that Task 3 uses for the Reputation banner gradient → flat change. Helps reviewers ACK the PR faster.

**Recommendation.** Above Task 6a, add one line:

> **Visible change warning.** Every `<Card>` in the app shifts hue: light mode from cool zinc-100 to warm Skeleton surface-50, dark mode from near-black gray-900 to Skeleton surface-900. **This is intentional and aligns the Card with the rest of the chrome.** Capture before/after on Reputation Hub and My Bets in the PR.

---

## 5. Low / cosmetic findings

### B0-L1. `backdrop-blur-[3px]` → `backdrop-blur-sm` is a 1 px shift

Tailwind's `backdrop-blur-sm` = 4 px. Original = 3 px. Visually indistinguishable. Worth one parenthetical: "`backdrop-blur-[3px]` → `backdrop-blur-sm` (3 px → 4 px; imperceptible)".

### B0-L2. z-index arbitrary values (`z-[999]`, `z-[1000]`, `z-[1001]`) are preserved silently

These violate the lock-file's "no arbitrary values" rule but are the legitimate exception for stacking contexts. B0 implicitly preserves them. Worth a one-line note in the Forbidden block: "Note: existing `z-[NNNN]` arbitrary values are preserved (stacking-context exception; we don't introduce z-tokens today)."

### B0-L3. The Reputation banner removes a gradient — verification needs a screenshot

B0 line 181 already calls this out: "**Capture a screenshot in the PR so reviewers can ACK the gradient → flat decision.**" Good. Move the same instruction to the PR-summary-template block (B0:362-386) so the agent doesn't forget. The current template (line 368) only says "screenshot attached", not which screenshot is mandatory.

### B0-L4. `text-foreground` used as a border via `border-foreground`

B0 Task 2b's `navLinkActive` target: `border-foreground text-foreground hover:border-foreground`. Tailwind v4 emits a utility for every `--color-*` token across `bg`, `text`, `border`, `ring`, `outline`, `fill`, `stroke`, `divide`, etc., so `border-foreground` resolves to `border-color: var(--color-foreground)`. Works. Worth a one-line note: "`border-foreground` is intentional — uses the body text color as the active-tab indicator (Carbon-style hairline). It paints `surface-950` in light and `surface-50` in dark, matching the original."

### B0-L5. The "Required reading" item 11 (line 60) is the right guard

It explicitly instructs the agent to confirm `--color-card`, `--color-popover`, `--color-community`, `--color-community-soft`, `--color-community-border`, `--color-input`, `--color-accent` are in `theme.css` before editing. After Prompt A this is true; before A it is false. Good safeguard. (Verified against the current `theme.css`: only the `--color-accent` / `--color-accent-foreground` / `--color-muted-foreground` are present today; the rest land with A. The agent must run A first.)

---

## 6. What Prompt B0 gets right (keep)

- **Allowed-file list is tight and correctly excludes the in-flight components** (Wallet, SlotModal, ConnectLanes, CurrencyDropdown). Smaller PR = easier review.
- **The grep gates target only the migrated files** (B0 line 318-325 lists seven explicit file paths). Unlike C, the grep won't fail on Tier-1 leakage in files outside the agent's editing window. This is exactly the fix recommended in `C-market-detail.md` (audit) C-5.
- **The `navLink*` constants exception is the right call.** Those three strings hold only class names; treating them as classes (not as logic) is the only sensible reading of "no `<script>` body changes".
- **`pnpm --filter @bigmarket/frontend-c1`** uses the consistent scoped form (matches A; resolves C-12).
- **Required reading enumerates line ranges, file lengths, and zinc-* concentration up front.** The agent knows what to expect before reading.
- **The Card and Button-outline fix lands here, in B0** — exactly as `audit-report.md §I` lines 161-162 demanded ("Block PROMPTS Step 6 on fixing this. Replace with `bg-card text-card-foreground border-border`").
- **`app.html` splash migration is included** — closes the `audit-report.md §I` line 160 finding directly.
- **Forward-explicit "what this does NOT do" section** (lines 390-398) prevents scope creep and tells future prompts what they own.
- **Reputation banner gradient → flat is explicitly flagged as a visible change** with a screenshot requirement. Reviewers can ACK it without surprise.
- **Verification step 9 thinks downstream** (every Card consumer across the app). Catches a real risk.
- **Estimated time (40-60 min)** is realistic for ~120 substitutions across 7 files.

---

## 7. Recommended next steps (apply in this order)

1. **Add `+layout.svelte`** to the allowed-file list and add a Task 0 with 5 substitutions (B0-A1).
2. **Fix the AlphaBanner guardrail.** Pick: add to scope with 3 substitutions, or rewrite the wording to "wrapping header is active and Tier-1; rebuild deferred" (B0-A2). Adding to scope is cleaner.
3. **Add `bm-ui/PageContainer.svelte`** to the allowed-file list with 3 substitutions (B0-A3).
4. **Apply the small fixes:** typo line 316 (B0-M1), drop the "leave text-white" row (B0-M2), pick a non-arbitrary outline-offset (B0-M3), align the Tier-1 regex across A/B0/C (B0-M4), decide Disconnect hover behavior (B0-M5), add the Card hue-shift warning at the top of Task 6 (B0-M6).
5. **Optional cosmetic:** add the z-index exception note, the backdrop-blur 3→4 px note, and the `border-foreground` note (B0-L1, L2, L4). Pin the mandatory screenshot in the PR summary (B0-L3).
6. **Re-read B0** against `tokens-and-rules.lock.md` §1 to confirm every token name it consumes still appears in A's output. Run the grep gates manually after applying (1)-(3) to confirm they return zero across the now-larger scope.

After (1)-(3), B0 closes the entire visible chrome on the default route in one PR: AlphaBanner + HeaderMenuTailwind + ReputationCommunityBanner + PageContainer + Footer + the network-mismatch banner + the empty-state image + the splash (both copies) + the BM-design `Card` + `Button outline`. That is the right "proof of pipeline" slice the lock-file and styling-contract have been asking for.

---

## 8. Quick reference — counts cited in this audit

Per file, Tier-1 hits counted via B0's regex (palette + `accent` prefix):

| File | Tier-1 hits | Visible on default route? | In B0's scope? |
|---|---:|:---:|:---:|
| `apps/frontend-c1/src/app.html` | 0¹ | yes (splash) | ✅ |
| `apps/frontend-c1/src/routes/+layout.svelte` | 5 (lines 106, 109, 113, 127, 140) | **yes** | ❌ |
| `apps/frontend-c1/src/routes/+page.svelte` | 2 (empty-state branch) | yes (on empty) | ✅ |
| `apps/frontend-c1/src/lib/components/template/AlphaBanner.svelte` | 17 | **yes** (active `<header>`, NOT commented) | ❌ |
| `…/template/HeaderMenuTailwind.svelte` | 87 | yes | ✅ |
| `…/template/ReputationCommunityBanner.svelte` | 45 | yes (when reputation data loaded) | ✅ |
| `…/template/Footer.svelte` | 20 | yes | ✅ |
| `…/template/WalletMenuTailwind.svelte` | 90 | yes | ❌ (B0 forbidden — deferred to wallet prompt) |
| `…/template/ConnectLanes.svelte` | 12 | yes (when wallet modal opens) | ❌ (B0 forbidden — deferred) |
| `…/template/SlotModal.svelte` | 6 | yes (when wallet modal opens) | ❌ (B0 forbidden — deferred) |
| `…/template/CurrencyDropdown.svelte` | 24 | yes (in Footer) | ❌ (B0 forbidden — deferred) |
| `…/template/TxModal.svelte` | 10 | yes (post-tx) | ❌ (out of scope) |
| `packages/bm-ui/src/lib/components/custom/PageContainer.svelte` | 3 | **yes** (every route surface) | ❌ |
| `packages/bm-ui/src/lib/components/ui/card/card.svelte` | 7 | yes (every Card consumer) | ✅ |
| `packages/bm-ui/src/lib/components/ui/button/button-variants.ts` | 4 (outline only) | yes (every outline Button) | ✅ |

¹ `app.html` uses `var(--color-gray-900)` and literal `#667085` in inline styles — not catchable by the Tailwind-class regex, but B0 migrates them by hand in Task 1.

**Visible-but-out-of-scope total: 25 hits** (5 `+layout.svelte` + 17 AlphaBanner + 3 PageContainer) across three files. Adding the three to scope drops it to **0** after one PR — and the three additions raise B0's footprint by only ~10 minutes of mechanical work.
