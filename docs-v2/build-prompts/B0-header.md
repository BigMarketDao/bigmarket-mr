# Build Prompt B0 — Header chrome first (Claude Code or Cursor)

**Use this for:** the **first visible build slice** after Prompt A wires tokens. Migrates the app chrome only — header, banners, footer, splash, the homepage route wrapper's empty-state branch — plus the two `bm-ui` primitives (Card + Button) that leak Tier-1 today. This is the safest possible first proof that the new token system works end-to-end, without committing to the full homepage card-by-card sweep.

**Why this exists (vs the full `B-homepage.md`):** the homepage prompt rewrites every market card, leaderboard, gauge, comments preview, and category chip — that's ~8 components on top of the chrome. Doing all of that in one PR makes review hard and visual regressions slow to bisect. B0 lands the chrome + the `bm-ui` Tier-1 leakage fix; B can run later (or be re-scoped) once B0 proves the pipeline.

**Recommended model:** Claude Code (the `HeaderMenuTailwind.svelte` sweep is non-trivial — ~375 lines, heavy `zinc-*`). Cursor Auto can do the smaller files.

**Prerequisites:** Prompt A landed and merged.

**Estimated time:** 40–60 minutes including verification.

**Paste everything below this line into a fresh agent session.**

---

## Guardrails (do not break)

```text
DO NOT change behavior.

Allowed files (and only these):
- apps/frontend-c1/src/app.html                                                               (splash inline CSS only — Task 1)
- apps/frontend-c1/src/lib/components/template/HeaderMenuTailwind.svelte                      (full Tier-1 sweep — Task 2)
- apps/frontend-c1/src/lib/components/template/ReputationCommunityBanner.svelte               (purple gradient → community tokens — Task 3)
- apps/frontend-c1/src/lib/components/template/Footer.svelte                                  (Task 4)
- apps/frontend-c1/src/routes/+page.svelte                                                    (empty-state branch class sweep ONLY — Task 5)
- packages/bm-ui/src/lib/components/ui/card/card.svelte                                       (Tier-1 leakage fix — Task 6)
- packages/bm-ui/src/lib/components/ui/button/button-variants.ts                              (Tier-1 leakage fix in `outline` variant + arbitrary shadows in `default` / `secondary` / `destructive`)

Forbidden:
- Any edit outside the files above.
- ANY edit to Svelte <script> blocks. Markup + classes ONLY. (HeaderMenuTailwind.svelte has 100 lines of <script>; leave every line.)
- New dependencies. New files. New Tailwind plugins.
- Tier-1 palette utilities anywhere in the migrated files (gray-*, zinc-*, slate-*, neutral-*, stone-*, orange-*, red-*, green-*, blue-*, sky-*, indigo-*, violet-*, purple-*, fuchsia-*, pink-*, rose-*, amber-*, yellow-*, lime-*, emerald-*, teal-*, cyan-*). Use tokens.
- Arbitrary values in the migrated files: no `text-[Npx]`, no `bg-[#abc]`, no `shadow-[0_6px_...]`, no `ring-[Npx]`, no `bg-[rgba(...)]`. Use the token or an existing Tailwind utility (`shadow-sm`, `shadow-md`, `text-xs`, etc.).
- Hex / rgb literals (except inside `app.html`'s splash, which we ARE migrating).
- Binding any element to the `destructive` name when it semantically represents a price drop (n/a for chrome — flagged for habit).
- The `¢` glyph (n/a for chrome).
- AlphaBanner.svelte — its active markup is fully commented out (only the script's import lines run). Leave it alone in B0; touch it when the wallet/mint flow is rebuilt.
- WalletMenuTailwind.svelte, ConnectLanes.svelte, SlotModal.svelte, CurrencyDropdown.svelte — out of scope; left as-is.

If a visual change requires a logic change, STOP and flag it — do not refactor silently.
```

---

## Required reading (read fully BEFORE editing; nothing else)

1. `docs-v2/tokens-and-rules.lock.md` (§1.1 surfaces, §1.2 status quad, §1.3 community).
2. `docs-v2/current-vs-target.md` (§2 "Where we are today" — the chrome sections).
3. `docs-v2/design/design-philosophy.md` §4 (professional but approachable table), §6 (do/don't).
4. `apps/frontend-c1/src/app.html` (full — 58 lines).
5. `apps/frontend-c1/src/lib/components/template/HeaderMenuTailwind.svelte` (full — ~375 lines; the `<script>` is lines 1–100, the desktop header is lines 102–222, the mobile sheet is lines 224–363).
6. `apps/frontend-c1/src/lib/components/template/ReputationCommunityBanner.svelte` (full — 101 lines).
7. `apps/frontend-c1/src/lib/components/template/Footer.svelte` (full — 81 lines).
8. `apps/frontend-c1/src/routes/+page.svelte` (full — 47 lines).
9. `packages/bm-ui/src/lib/components/ui/card/card.svelte` (full — 43 lines).
10. `packages/bm-ui/src/lib/components/ui/button/button-variants.ts` (full — 85 lines).
11. `packages/bm-design/src/theme.css` lines 445–500 (the semantic palette block after Prompt A landed — confirm `--color-card`, `--color-popover`, `--color-community`, `--color-community-soft`, `--color-community-border`, `--color-input`, `--color-accent`, etc. all exist).

Do NOT open other files. If you think you need to, STOP and flag.

---

## Task 1 — Migrate `app.html` splash

The early-paint `<script>` at lines 7–17 already toggles `.dark` on `<html>` **before** the splash renders, so by the time the splash paints, the right value of `--color-background` / `--color-muted-foreground` is in scope.

In the inline `<style>` of the `#splash-screen` div (lines 21–44), replace:

| Current | Target |
|---|---|
| `background: var(--color-gray-900);` | `background: var(--color-background);` |
| `color: #667085;` | `color: var(--color-muted-foreground);` |

Leave the splash image, layout, z-index, and the `<script>` that removes the splash on `DOMContentLoaded` exactly as they are.

---

## Task 2 — Migrate `HeaderMenuTailwind.svelte`

Header is ~375 lines. The `<script>` (lines 1–100) is OFF-LIMITS. The rest is a class-only sweep.

### 2a. Desktop header chrome (lines 102–222)

Replace:

| Current | Target |
|---|---|
| `border-zinc-200 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90` (header root, line 103) | `border-border bg-background/90 backdrop-blur-md` (one set; the `bg-background` token already carries the dark override) |
| `text-zinc-900 ... dark:text-zinc-50` (wordmark anchor, line 111) | `text-foreground` |
| `focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-200` (line 111) | `focus-visible:outline-ring` |
| `border border-zinc-900 ... dark:border-zinc-100` (BM monogram square, line 115) | `border border-border` |
| `text-zinc-600 hover:text-zinc-950 ... dark:text-zinc-400 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-200` (dark-mode toggle button, line 192) | `text-muted-foreground hover:text-foreground focus-visible:outline-ring` |
| `text-zinc-700 hover:text-zinc-950 ... dark:text-zinc-300 dark:hover:text-zinc-50 dark:focus-visible:outline-zinc-200` (mobile menu button, line 208) | `text-muted-foreground hover:text-foreground focus-visible:outline-ring` |

### 2b. The `navLinkBase / navLinkInactive / navLinkActive` constants (lines 93–99)

These are CONST string constants in the `<script>` — but they hold *only class names*, no logic. **You may edit the string literals** (not the surrounding `const` declaration). Treat the strings as classes for the purpose of the no-script rule.

Replace:

```ts
const navLinkBase =
    'border-b-2 border-transparent px-4 py-3 text-sm font-semibold tracking-tight text-zinc-700 transition-[color,border-color] duration-150 dark:text-zinc-400';
const navLinkInactive =
    'hover:border-zinc-400 hover:text-zinc-950 dark:hover:border-zinc-500 dark:hover:text-zinc-50';
const navLinkActive =
    'border-zinc-900 text-zinc-950 hover:border-zinc-900 dark:border-zinc-50 dark:text-zinc-50 dark:hover:border-zinc-50';
```

With:

```ts
const navLinkBase =
    'border-b-2 border-transparent px-4 py-3 text-sm font-semibold tracking-tight text-muted-foreground transition-[color,border-color] duration-150';
const navLinkInactive =
    'hover:border-border hover:text-foreground';
const navLinkActive =
    'border-foreground text-foreground hover:border-foreground';
```

This is the **only** mutation of the `<script>` block authorized in this prompt. Do not touch any function, `$state`, `$effect`, `onMount`, `onDestroy`, `afterNavigate`, or import.

### 2c. Mobile sheet (lines 224–363)

Sweep every Tier-1 utility — `zinc-50/95`, `zinc-900/95`, `zinc-200`, `zinc-700`, `zinc-400`, `zinc-500`, `zinc-100`, `zinc-300`, `zinc-950/45`, `zinc-700/80`, `zinc-200/80`, `zinc-200/90`, `zinc-600`, `zinc-700/80` — to tokens:

| Pattern | Target |
|---|---|
| Sheet backdrop: `bg-zinc-950/45 backdrop-blur-[3px]` (line 234) | `bg-overlay backdrop-blur-sm` |
| Sheet panel: `border-l border-zinc-200/80 bg-zinc-50/95 ... dark:border-zinc-700/80 dark:bg-zinc-900/95` (line 240) | `border-l border-border bg-popover` |
| `shadow-[-12px_0_40px_-8px_rgba(0,0,0,0.18)] ... dark:shadow-black/50` (line 240) | `shadow-lg` (drop the arbitrary value; `shadow-lg` is the closest Tailwind utility) |
| "Menu" eyebrow text `text-zinc-500 dark:text-zinc-400` (line 244) | `text-muted-foreground` |
| Close button `text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100` (line 247) | `text-muted-foreground hover:text-foreground` |
| Nav link rows `border-b border-zinc-200 ... text-zinc-800 ... dark:border-zinc-700 dark:text-zinc-100` (lines 258, 268, 276, 282, 334, 341) | `border-b border-border text-foreground` |
| Sublabel under "Community" `text-zinc-500 dark:text-zinc-400` (line 262) | `text-muted-foreground` |
| Separator `bg-zinc-200/90 dark:bg-zinc-700/80` (lines 291, 310) | `bg-border` |
| Theme row label `text-zinc-600 dark:text-zinc-300` (line 294) | `text-muted-foreground` |
| Theme toggle button text `text-zinc-700 ... dark:text-zinc-300` (line 297) | `text-muted-foreground hover:text-foreground` |
| Connected-wallet card root `rounded-2xl border border-zinc-200/80 bg-white/90 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-950/60` (line 314) | `rounded-md border border-border bg-card text-card-foreground shadow-sm` |
| "Connected wallet" eyebrow `text-zinc-500 dark:text-zinc-400` (line 316) | `text-muted-foreground` |
| Address line `text-zinc-900 dark:text-zinc-100` (line 320) | `text-foreground` |
| Address separator dots `text-zinc-400` (lines 324, 326) | `text-muted-foreground` |
| Disconnect button `text-red-700 ... dark:text-red-400` (line 348) | `text-destructive hover:text-destructive/90` |

If you encounter `rounded-2xl` keep it for now (it's not Tier-1 leakage). Same for `tracking-[0.14em]` — it's a typography tweak, not a color/sizing arbitrary value; leave it.

---

## Task 3 — Migrate `ReputationCommunityBanner.svelte`

This banner today uses a multi-stop purple/indigo gradient. The new contract bakes the same role-name (`community` → Skeleton `tertiary`/violet) but as a **flat soft tint**, not a gradient. **This is a visible change** and is intentional.

Replace the root `<a>` class string (line 26):

```svelte
class="group border-b border-purple-500/15 bg-gradient-to-r from-purple-50/90 via-indigo-50/80 to-purple-50/90 transition-colors hover:border-purple-500/25 hover:from-purple-50 hover:via-indigo-50 hover:to-purple-50 dark:border-purple-400/10 dark:from-purple-950/40 dark:via-indigo-950/35 dark:to-purple-950/40 dark:hover:from-purple-950/55 dark:hover:via-indigo-950/50 dark:hover:to-purple-950/55"
```

With:

```svelte
class="group block border-b border-community-border bg-community-soft transition-colors hover:bg-community-soft/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
```

Sweep the rest of the file:

| Current | Target |
|---|---|
| `text-purple-900 dark:text-purple-100` (line 31) | `text-community` |
| `text-purple-600 ... group-hover:text-purple-700 dark:text-purple-400 dark:group-hover:text-purple-300` (Sparkles icon, line 33) | `text-community/70 group-hover:text-community` |
| `text-[11px] text-purple-800/90 sm:text-xs dark:text-purple-200/85` (dl, line 43) | `text-xs text-community/90` (drop `text-[11px]`; `text-xs` = 12 px is fine and removes the arbitrary value) |
| `font-medium text-purple-600/80 dark:text-purple-400/90` (each `<dt>`, lines 46, 54, 62, 68 commented, 83, 92, 316) | `font-medium text-community/70` |
| `border-purple-300/50 ... dark:border-purple-600/40` (vertical separator on `<div>` and `<dt>`, lines 82, 92) | `border-community-border` |
| `text-purple-600 ... dark:text-purple-300/90` (line 92, fallback "Connect wallet" text) | `text-community/80` |

The `font-mono tabular-nums` on `<dd>` elements stays — it's correct.

Visual outcome: the banner becomes a single flat tinted strip (no gradient). Tone reads as governance/community (violet), still legible in both themes. **Capture a screenshot in the PR so reviewers can ACK the gradient → flat decision.**

---

## Task 4 — Migrate `Footer.svelte`

Sweep:

| Current | Target |
|---|---|
| `border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900` (footer root, line 24) | `border-t border-border bg-background` |
| `bg-orange-500 ... shadow-sm transition-colors group-hover:bg-orange-600` (BM monogram square, line 31) | `bg-accent text-accent-foreground shadow-sm transition-colors group-hover:bg-accent/90` |
| `text-white` (BM monogram inner span has `text-white` implicit on parent; keep) | leave |
| `text-gray-900 dark:text-white` (app-name span, line 35) | `text-foreground` |
| `text-sm text-gray-500 dark:text-gray-400` (copyright `<p>`, line 39) | `text-sm text-muted-foreground` |
| `text-sm font-semibold text-gray-900 dark:text-gray-100` (each `<h3>`, lines 48, 75) | `text-sm font-semibold text-foreground` |
| `text-sm text-gray-600 transition-colors hover:text-orange-500 dark:text-gray-400 dark:hover:text-orange-400` (each link `<a>`, lines 56, 63) | `text-sm text-muted-foreground transition-colors hover:text-accent` |

CurrencyDropdown stays untouched (out of scope).

---

## Task 5 — Migrate `+page.svelte` outer wrapper

The route uses `<PageContainer>` from `bm-ui` (out of scope here). The only Tier-1 leakage in the route is the **empty-state branch**:

Replace (lines 35–44):

```svelte
<div
    class="flex flex-col items-center justify-center text-center text-gray-900 dark:text-gray-100"
>
    <p class="mb-4 text-lg font-medium">No markets available…</p>
    <img
        src="/splash.png"
        alt="BigMarket loading..."
        class="max-w-md rounded-lg border border-purple-600/20 shadow"
    />
</div>
```

With:

```svelte
<div
    class="flex flex-col items-center justify-center text-center text-foreground"
>
    <p class="mb-4 text-lg font-medium">No markets available…</p>
    <img
        src="/splash.png"
        alt="BigMarket loading..."
        class="max-w-md rounded-md border border-border shadow-sm"
    />
</div>
```

No other change to this file. The `<MarketPlace>` rendering, props, derived stores, and `onMount` stay exactly as written.

---

## Task 6 — Fix `bm-ui` Card + Button Tier-1 leakage

These two primitives are consumed across the app (header mobile sheet, every market card, every staking widget). Today they hardcode Tier-1 utilities and arbitrary shadows. Land the fix here so any later component sweep (B, C) doesn't have to re-touch `bm-ui`.

### 6a. `packages/bm-ui/src/lib/components/ui/card/card.svelte`

Replace the entire `cn(...)` class string (lines 17–35) with:

```svelte
class={cn(
    `
    group
    flex flex-col
    gap-6
    rounded-md
    border
    border-border
    bg-card
    text-card-foreground
    p-4

    transition-colors duration-200

    hover:border-border/60
    `,
    className
)}
```

Specifically: drop `border-zinc-100/70`, `dark:bg-gray-900`, `bg-zinc-100`, the three `shadow-[...]` arbitrary values, `hover:border-zinc-300`, `dark:hover:border-zinc-700`. Card now relies on `border-border` for definition (and Tailwind's `shadow-sm` if a reviewer asks for it back — but ship without first and see if it looks OK).

Preserve `$bindable`, `$props`, `data-slot`, slot rendering, and the `WithElementRef` typing exactly.

### 6b. `packages/bm-ui/src/lib/components/ui/button/button-variants.ts`

Two surgical edits.

**`outline` variant** (lines 35–41) — replace with:

```ts
outline: [
    'bg-transparent text-muted-foreground',
    'border border-border',
    'hover:bg-transparent hover:text-foreground'
].join(' '),
```

Drop the `text-gray-300`, `hover:text-gray-100`, `dark:border-input`, `dark:text-gray-300`, `dark:hover:text-gray-100`. The `text-muted-foreground` token already carries the correct dark override.

**Arbitrary shadow values across `default`, `secondary`, `destructive` variants** (lines 21, 23, 30, 32, 55) — replace each `shadow-[0_6px_18px_rgba(0,0,0,0.08)]`, `shadow-[0_10px_26px_rgba(0,0,0,0.45)]`, `dark:shadow-[0_10px_26px_rgba(0,0,0,0.45)]`, `shadow-[0_6px_18px_rgba(0,0,0,0.10)]` with `shadow-sm`. Drop the `dark:shadow-*` lines entirely (Tailwind's shadow utilities already darken adequately).

Result for `default`:

```ts
default: [
    'bg-primary text-primary-foreground',
    'border border-primary/40',
    'shadow-sm',
    'hover:bg-primary/90 hover:border-primary/60',
    '[a&]:no-underline'
].join(' '),
```

Same pattern for `secondary` and `destructive` (preserve role tokens; replace the arbitrary shadow with `shadow-sm`; drop the dark shadow line).

`ghost`, `link`, the `base`, `size`, `defaultVariants`, and the exported types stay exactly as written.

---

## Verification (paste actual command output / screenshots in PR)

```bash
# 1. Build + check
pnpm --filter @bigmarket/frontend-c1 check
pnpm --filter @bigmarket/frontend-c1 build

# 2. Tier-1 leakage in the migrated files (MUST RETURN ZERO)
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret|accent)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  apps/frontend-c1/src/app.html \
  apps/frontend-c1/src/lib/components/template/HeaderMenuTailwind.svelte \
  apps/frontend-c1/src/lib/components/template/ReputationCommunityBanner.svelte \
  apps/frontend-c1/src/lib/components/template/Footer.svelte \
  apps/frontend-c1/src/routes/+page.svelte \
  packages/bm-ui/src/lib/components/ui/card/card.svelte \
  packages/bm-ui/src/lib/components/ui/button/button-variants.ts

# 3. Arbitrary values in the migrated files (MUST RETURN ZERO)
rg -n '(bg|text|border|ring|fill|stroke|shadow)-\[' \
  apps/frontend-c1/src/app.html \
  apps/frontend-c1/src/lib/components/template/HeaderMenuTailwind.svelte \
  apps/frontend-c1/src/lib/components/template/ReputationCommunityBanner.svelte \
  apps/frontend-c1/src/lib/components/template/Footer.svelte \
  apps/frontend-c1/src/routes/+page.svelte \
  packages/bm-ui/src/lib/components/ui/card/card.svelte \
  packages/bm-ui/src/lib/components/ui/button/button-variants.ts

# 4. Lint (no NEW errors; pre-existing errors are out of scope for this PR)
pnpm --filter @bigmarket/frontend-c1 lint

# 5. Dev server
pnpm dev
```

Open `http://localhost:8081` and visually confirm:

1. **Header chrome:** consistent in light AND dark, no flash of unstyled chrome on refresh (splash uses tokens now).
2. **Wordmark / monogram:** legible in both themes; focus ring visible when tabbing.
3. **Nav links:** inactive vs active vs hover all visibly distinct.
4. **Mobile sheet (≤768 px):** opens, has overlay, border, popover surface; close button works; theme toggle inside works.
5. **Reputation community banner (when wallet has reputation data):** flat violet tint, not a gradient; eyebrow text legible; epoch / weighted-supply / yours stats use `tabular-nums`.
6. **Footer:** monogram is accent (cobalt); link hover is accent; copyright is muted; theme parity.
7. **Empty homepage state:** if you can force `markets.length === 0`, the empty-state copy uses tokens.
8. **Reduced motion:** macOS "Reduce motion" toggled on → no transitions / no `animate-pulse` running anywhere on the chrome.
9. **Cards anywhere in the app** (e.g. Reputation page, My Bets page) still render — `bm-ui/Card` now uses `bg-card border-border`. If a card looks too "flat", flag in the PR; do not re-add the arbitrary shadow.

If verification step 2 or 3 returns any line, **fix before commit**. They are the hard gates.

---

## PR summary template

```
B0 — Header chrome migration to Tier-2 tokens

What changed:
- app.html splash: --color-gray-900 + #667085 → --color-background + --color-muted-foreground
- HeaderMenuTailwind.svelte: desktop chrome + nav-link constants + mobile sheet swept to tokens (no <script> changes outside the three navLink* string constants)
- ReputationCommunityBanner.svelte: purple gradient → flat bg-community-soft; visible-but-intentional visual change (screenshot attached)
- Footer.svelte: gray-* + orange-500 hover → token semantics
- routes/+page.svelte: empty-state branch swept (no other change)
- bm-ui/Card: dropped Tier-1 surface + arbitrary shadows; now bg-card border-border
- bm-ui/Button outline variant: gray-* → muted-foreground/foreground; arbitrary shadows on default/secondary/destructive → shadow-sm

What did NOT change:
- Zero Svelte <script> logic (the only constants edited are pure class-name strings in HeaderMenuTailwind.svelte).
- No SDK / API / store / route / event-handler edit.
- No new deps. No new files. AlphaBanner.svelte left as-is (dead code).
- Wallet / connect / modal / currency-dropdown / market cards / leaderboard / staking / charts all untouched.

Verification:
- Tier-1 grep on migrated paths: 0 hits.
- Arbitrary-values grep on migrated paths: 0 hits.
- Typecheck / build: ok.  Lint: no new errors.
- Visual: chrome light + dark confirmed; mobile sheet confirmed; reputation banner gradient→flat ACK'd (screenshots).
- Reduced motion: confirmed (screenshot).
```

---

## What this prompt does NOT do (and is fine to defer to Prompt B)

- Market cards, leaderboard, gauge, comments preview, category chips — full homepage body. → Prompt B.
- `bm-utilities/format-extras.ts` (`fmtProbability`, `fmtSignedPercent`, etc.). → Prompt B.
- AlphaBanner.svelte rebuild (today: 100 % commented markup). → A later "AlphaBanner / mint flow" prompt.
- WalletMenuTailwind / ConnectLanes / SlotModal / CurrencyDropdown redesigns. → Future prompts.
- Market detail page. → Prompt C.

If anything else feels missing while you're working, **STOP and ask**, do not improvise.
