# Pre-run audit — Critique + fix proposals for Prompts A / B / C

**Use this for:** Before running Build Prompts A / B / C, have Claude Code (with full repo access) line-by-line verify each prompt against the actual codebase. Output is a **structured findings report** and **concrete fix proposals** (text-replacement blocks). **Nothing is auto-applied.** The user reviews findings and applies fixes manually (or via a follow-up prompt) before running A / B / C.

**Recommended model:** Claude Code (or any model with `Read` / `Grep` / `Glob` tools across the repo).

**Estimated time:** 20–40 minutes (most of it reading; tiny output).

**Paste everything below this line into a fresh Claude Code session.**

---

## Guardrails (HARD)

```text
You are auditing three build prompts BEFORE I run them. You will produce a STRUCTURED REPORT and PROPOSED FIXES.

DO NOT edit any file in the repo.
DO NOT run any build, lint, test, or `pnpm` command.
DO NOT commit anything.
DO NOT modify the prompt files (docs-v2/build-prompts/A-token-wiring.md, B-homepage.md, C-market-detail.md, B0-header-chrome.md) or any other file.

You may freely READ any file in the repo.
You may use grep / glob / semantic search.

Output ONLY the report described in §5 below. No prose preamble, no "I will now..." narration.
If a finding requires reading a file I did not list in §1, READ it and cite the path + line range.

If at any point you think you should write to a file, STOP and instead include the desired edit as a "PROPOSED FIX" block in §5.
```

---

## 1. Required reading (read fully, in this order)

Direction docs:

1. `docs-v2/tokens-and-rules.lock.md` — the locked decisions everything else cites.
2. `docs-v2/current-vs-target.md` — plain-English target state.
3. `docs-v2/design/design-philosophy.md` — why we use Skeleton `nouveau` and what "professional but approachable" means concretely.
4. `docs-v2/design/styling-contract.md` — the rules of usage and tier model.
5. `docs-v2/design/bm-semantic-tokens-proposal.md` — semantic token inventory.
6. `docs-v2/design/skeleton-theme-nouveau.md` — palette baseline + charts decision.
7. `docs-v2/audit-report.md` — the gap audit this whole effort responds to.

Prompts to audit (the work product):

8. `docs-v2/build-prompts/A-token-wiring.md`
9. `docs-v2/build-prompts/B0-header-chrome.md`
10. `docs-v2/build-prompts/B-homepage.md`
11. `docs-v2/build-prompts/C-market-detail.md`

Codebase files the prompts touch (read enough to evaluate each prompt's claims):

12. `packages/bm-design/src/theme.css` (full)
13. `packages/bm-design/src/tokens.ts` (full)
14. `packages/bm-design/src/vendor/skeleton-nouveau.css` (only the `--color-*-50/.../950` and `--color-*-contrast-*` blocks; verify primitive names referenced in Prompt A all exist)
15. `apps/frontend-c1/src/routes/layout.css` (full)
16. `apps/frontend-c1/src/app.html` (full)
17. `apps/frontend-c1/src/lib/components/template/HeaderMenuTailwind.svelte` (full — it is ~375 lines and heavy in `zinc-*`)
18. `apps/frontend-c1/src/lib/components/template/AlphaBanner.svelte` (full — note most of it may be commented out)
19. `apps/frontend-c1/src/lib/components/template/ReputationCommunityBanner.svelte` (full — heavy purple gradient)
20. `apps/frontend-c1/src/lib/components/template/Footer.svelte` (full)
21. `apps/frontend-c1/src/routes/+page.svelte` (full — the homepage outer container)
22. `apps/frontend-c1/src/routes/market/[marketId]/[marketType]/+page.svelte` (full — the market-detail route)
23. `packages/bm-ui/src/lib/components/ui/card/card.svelte` (full)
24. `packages/bm-ui/src/lib/components/ui/button/button-variants.ts` (full)
25. `packages/bm-market-homepage/src/lib/components/markets/MarketEntry.svelte` (full)
26. `packages/bm-market/src/lib/market/version2/MarketHeader.svelte`, `MarketStatsBar.svelte`, `MarketCharts.svelte`, `MarketStaking.svelte`, `OrderBook.svelte`, `MarketComments.svelte`, `MarketDetails.svelte`, `do-stake/StakingButton.svelte`, `do-stake/StakingButtonClassic.svelte`, `market-staking-components/MarketStakingPurchaseAmount.svelte` (full)

You may read additional files if a finding needs them; cite them in the report.

---

## 2. Severity definitions (use exactly these tiers)

- **CRITICAL** — running the prompt as written will cause: a build/typecheck error, a runtime crash, broken behavior, a visible regression on existing UI, a security hole, a data-shape change, a deletion of working code, or an invariant violation (per `CLAUDE.md` "Critical Invariants").
- **HIGH** — running the prompt will produce a **visibly wrong UI** (broken borders, invisible elements, wrong colors, missing focus rings, accessibility regression), or will fail to satisfy an explicit lock-file requirement.
- **MEDIUM** — running the prompt risks ambiguity that *might* lead an agent to do the wrong thing (under-specified anatomy, contradictions between two sections of the same prompt, missing line numbers / file paths, deferred concerns labelled as in-scope).
- **LOW** — doc / cross-reference / wording issues that don't change behavior but slow review.
- **NIT** — typos, formatting, tone.

**A finding is only CRITICAL or HIGH if you can point to a concrete codebase line / behavior that proves it.** If you cannot prove it, downgrade to MEDIUM and say "speculative" in the evidence.

---

## 3. Audit tasks

### 3.1 Direction sanity check (one paragraph)

Read docs 1–7 above. Then answer in **≤ 8 sentences total**:

- What is BigMarket's UI target in plain English?
- What is the *one* thing the design system is locking down first (and why)?
- What is the recommended order of execution across Prompts A → B0 → B → C?
- If the docs disagree with each other anywhere, name the disagreement and which one wins per the source-of-truth rules in `docs-v2/sources-of-truth.md`.

If you cannot answer any of these without speculation, the direction docs have a gap — log it as a MEDIUM finding in §3.5.

### 3.2 Audit `A-token-wiring.md`

For each Task (1, 2, 3) and the Verification section:

- Verify every Tailwind / CSS / TS reference exists in the codebase.
- Verify every primitive cited (e.g. `--color-success-300`, `--color-tertiary-700`, `--color-secondary-contrast-500`) exists in `packages/bm-design/src/vendor/skeleton-nouveau.css`. List any that don't.
- Verify the `--color-input` decision (it should be the **border** color, not a surface) is consistent across the prompt and the lock file.
- Verify the `pnpm` scripts referenced in the Verification section actually exist (read `package.json` of `frontend-c1`, `bm-design`, root). Flag any that don't.
- Verify the `.dark` block instruction is unambiguous (`@layer base { .dark { ... } }`, NOT a new top-level `.dark`).
- Verify the `prefers-reduced-motion` block is placed where the `!important` declarations actually win (outside `@layer base`).
- Verify there are zero current consumers of the old `tokens.colors.primary.DEFAULT` shape (grep for `tokens.colors`, `tokens.spacing`, `tokens.radius`, `tokens.typography`, `from '@bigmarket/bm-design'`).
- Count: **how many CSS custom properties are added in total** (light + dark)?

Expected: **CRITICAL: 0, HIGH: 0** if the recent iterations did their job. Anything you find at CRITICAL or HIGH means the iterations missed something — report it precisely.

### 3.3 Audit `B0-header-chrome.md` (the header-only first build)

For each Task in the prompt:

- Verify the file scope list matches files that actually exist (use Glob).
- For each `Tier-1 → token` mapping the prompt prescribes, **read the actual source file** and confirm the Tier-1 utility appears there (so the mapping is not aspirational).
- Verify the token names in mappings exist after Prompt A runs (cross-reference the additions in Prompt A's CSS block).
- Verify the prompt does NOT touch `<script>` bodies anywhere it claims "class-only".
- Verify the prompt's verification grep gates would actually return 0 hits if the migration is complete (look for any Tier-1 utility the prompt forgot to map).
- Specifically scrutinize:
  - `HeaderMenuTailwind.svelte` (~375 lines, heavy `zinc-*`) — does the prompt give enough mapping granularity for hover / active states / mobile sheet?
  - `ReputationCommunityBanner.svelte` — the existing purple gradient (`from-purple-50/90 via-indigo-50/80 to-purple-50/90`) does not survive a flat `bg-community-soft` mapping. Is that visual change called out and accepted, or is it silent?
  - `AlphaBanner.svelte` — if most of the file is commented-out markup, is the prompt asking for unnecessary work?
  - `app.html` splash — does the prompt rely on `.dark` being set on `<html>` before the splash renders? Read `app.html` to verify the `<script>` order is correct.
  - `+page.svelte` outer container — does the prompt limit scope to wrapper classes (column / section padding / grid gap) without dragging in cards?
  - `bm-ui` Card and Button leakage — does the prompt correctly preserve `<script>`, slots, props, and variant API?

### 3.4 Audit `B-homepage.md` (the full homepage; deferred to after B0)

Same approach as 3.3. Specifically scrutinize:

- The `MarketEntry.svelte` script change (importing `fmtProbability`) — is the justification clear and the change minimal?
- The `format-extras.ts` API surface (`fmtProbability`, `fmtSignedPercent`, `fmtCompact`, `fmtAddressShort`, `fmtCountdownSeconds`) — does the existing codebase already export anything overlapping (search `packages/bm-utilities` and `packages/bm-common`)? If so, propose deduplication.
- The Card shadow removal — call out the visual-regression risk so reviewers know to look for it.
- The Button `outline` variant text-color change — does any consumer rely on the old `text-gray-300` color in light mode? (grep for `variant="outline"` usage.)
- The exhaustive grep guard at the bottom — is the regex complete (does it miss any palette family Tailwind ships, e.g. `caret-*`, `divide-*`, `outline-*`, `accent-*`)?

### 3.5 Audit `C-market-detail.md` — DEEP DIVE (this is the prompt the user expects has the most issues)

Spend the most time here. Specifically:

- **Task 1 layout shell** — read `apps/frontend-c1/src/routes/market/[marketId]/[marketType]/+page.svelte` first. Is the prompt's "BEFORE" example accurate? Does the current route render the children in the order the prompt assumes? Are there `{#if marketData.resolutionState ...}` branches that the new grid would *visually break* even if the markup is preserved? Is `<aside>` semantically appropriate for the trade widget, or should the trade widget live in the main column on a `<form>` / `<section>`?
- **Sticky offset** — the prompt hardcodes `lg:top-20`. Read `HeaderMenuTailwind.svelte` and compute the real height (`h-16` = 64 px; `lg:top-20` = 80 px). Off by 16 px is acceptable but worth flagging.
- **Mobile order** — the prompt claims `<aside>` stacks above `<main>`'s lower content on mobile. Verify by inspecting the grid: with `grid lg:grid-cols-[1fr_360px]`, on mobile both children stack in DOM order, so `<main>` (which contains the chart) appears BEFORE `<aside>` (the trade widget). The prompt's claim "trade widget MUST appear above the chart on mobile" is WRONG unless the DOM order is flipped. Confirm in the report.
- **Task 4 time-range tabs** — does `MarketCharts.svelte` actually have a time-range selector today, or is the prompt asking for new logic disguised as visual change? Read the file. If no selector exists, the prompt's example code is dead instructions.
- **Task 5 `<details>` wrap** — read `OrderBook.svelte` end-to-end. Does it use Bits UI / a Svelte transition / focus-trap / portal anywhere inside that would conflict with `<details>` semantics? Will collapsing it break any prop / store binding?
- **Task 6 `MarketStaking.svelte`** — read all 368 lines. Class-only migration on a file that mixes layout and `$state` / `$derived` / store reads is high risk. Is the prompt specific enough about *which* lines to touch and *which* to leave?
- **Task 7 button height** — `h-11 md:h-10` (44 / 40 px). Verify against the lock file (mobile 44 / desktop 36–40). OK.
- **`destructive` vs `price-down`** — verify the prompt never lets the agent bind a price-down element to the `destructive` *name*. Grep through the prompt for `text-destructive` etc. and check the surrounding context.
- **Resolution banner palettes** — does `ResolutionBanner.svelte` actually have the three states the prompt prescribes (`resolving / resolved / awaiting`)? If the state names differ in the script, the agent will guess wrong.
- **`MarketStakingPurchaseAmount.svelte`** — 126 Tier-1 matches claimed. Verify with grep.
- **Sports market mention** — the "What this prompt does NOT do" section mentions "Sports market specific patterns". Does a sports market route / variant exist in the codebase today? If not, drop the mention.
- **Chart palette** — Prompt C says chart code "still uses hex". Verify by reading one chart file (`do-charts/StakeChart.svelte` or `do-charts/TVLChart.svelte`).
- **Verification grep families** — same audit as 3.4.

### 3.6 Cross-prompt consistency

- Token names: does every name used in B0, B, C appear in A's CSS block? Cross-check the full set.
- Numeric formatters: does B mention helpers that C also calls? If C inherits B, the dependency must be explicit.
- Run-order: is the README's "A then B (or C) — B and C don't depend on each other" still true, or does B's `bm-ui` Card/Button fix in fact make C depend on B? If yes, the run-order doc must change.

---

## 4. What to do with findings

For each CRITICAL or HIGH finding in Prompts A / B0 / B / C, produce a **PROPOSED FIX** in this exact shape:

````
### FIX-{ID} (severity: {CRITICAL|HIGH}) — {file:line-range}

**Why this is a problem (evidence):**
- Codebase line: `path/to/file.ext:LL-LL` — quote the relevant 1–3 lines.
- Prompt line: `docs-v2/build-prompts/{X}.md` — section heading + the wording.
- What goes wrong if I run the prompt as-is: 1–2 sentences.

**Proposed replacement text:**

Replace this block in `docs-v2/build-prompts/{X}.md`:

```text
<exact existing text — must match the file byte-for-byte>
```

with:

```text
<exact new text>
```

(If the change is more than ~30 lines, propose a smaller surgical edit instead. If even that is too big, propose a rewrite of the relevant Task only and put it in a separate ```text fence.)
````

For MEDIUM findings, produce a 1–3 sentence recommendation (no patch required unless trivial).

LOW / NIT findings are listed without patches.

---

## 5. Output format (the only thing you return)

Use this exact skeleton — no preamble, no postscript:

```markdown
# Pre-run audit report

## 0. Direction sanity check
{≤ 8 sentences per §3.1}

## 1. Counts
- A-token-wiring.md — CSS vars added (light + dark): {N}
- A-token-wiring.md — files changed: 3 (`theme.css`, `tokens.ts`, `layout.css`)
- B0-header-chrome.md — files changed: {N}
- B-homepage.md — files changed: {N}
- C-market-detail.md — files changed: {N}

## 2. Findings — Prompt A
- CRITICAL: {N}
- HIGH: {N}
- MEDIUM: {N}
- LOW / NIT: {N}

{Per-finding details, in severity order. Use the FIX-{ID} template from §4 for CRITICAL + HIGH.}

## 3. Findings — Prompt B0 (Header)
{Same shape as §2.}

## 4. Findings — Prompt B (Homepage)
{Same shape.}

## 5. Findings — Prompt C (Market detail)
{Same shape — this section is expected to be the longest.}

## 6. Cross-prompt consistency
{Bullets per §3.6.}

## 7. Run-order recommendation (after fixes)
{Either confirm A → B0 → B → C as-is, or propose a different order and justify in ≤ 3 sentences.}

## 8. Top three things to fix BEFORE running anything
{Three bullets, each citing a FIX-{ID} from above.}
```

That's the entire output. No "Hope this helps", no "Let me know if...".

---

## 6. Stop conditions

- If you find a CRITICAL issue you don't know how to fix, mark its FIX block as `**Proposed replacement text:** TBD — need product / design call. Reason: <one sentence>` and continue.
- If you cannot read a file (path doesn't exist), log it as a finding and continue.
- Do not exceed 4000 words in the report. If you would, summarize and link the most important finding instead of listing every NIT.
