# Build Prompt B0 — Header chrome (Claude Code or Cursor)

**Use this for:** the **first visible build slice** after Prompt A wires tokens. Migrates the entire app chrome — layout wrapper, both header bars (AlphaBanner + HeaderMenuTailwind), banners, footer, splash, the homepage route wrapper's empty-state branch, and the three `bm-ui` primitives (Card + Button + PageContainer) that leak Tier-1 today. This is the safest possible first proof that the new token system works end-to-end, without committing to the full homepage card-by-card sweep.

**Why B0 instead of jumping to B (full homepage):** the homepage prompt covers ~8 components and ~700 lines of class migration in one PR — review is hard, regressions slow to bisect. B0 is the smallest *visible* slice: all chrome surfaces on every page + the `bm-ui` primitives that block B and C. Land B0 with screenshots, take the win, then queue B and C.

**Recommended model:** Claude Code (the `HeaderMenuTailwind.svelte` sweep is non-trivial — ~375 lines, heavy `zinc-*`). Cursor Auto can do the smaller files.

**Prerequisites:** Prompt A landed and merged.

**Estimated time:** 50–70 minutes including verification.

**Paste everything below this line into a fresh agent session.**

---

## Guardrails (do not break)

```text
DO NOT change behavior.

Allowed files (and only these):
- apps/frontend-c1/src/routes/+layout.svelte                                                  (Task 0 — 5 class substitutions only)
- apps/frontend-c1/src/app.html                                                               (splash inline CSS only — Task 1)
- apps/frontend-c1/src/lib/components/template/AlphaBanner.svelte                            (Task 2 — 3 substitutions; script block + commented-out mint block UNTOUCHED)
- apps/frontend-c1/src/lib/components/template/HeaderMenuTailwind.svelte                      (full Tier-1 sweep — Task 3)
- apps/frontend-c1/src/lib/components/template/ReputationCommunityBanner.svelte               (community tokens — Task 4)
- apps/frontend-c1/src/lib/components/template/Footer.svelte                                  (Task 5)
- apps/frontend-c1/src/routes/+page.svelte                                                    (empty-state branch class sweep ONLY — Task 6)
- packages/bm-ui/src/lib/components/ui/card/card.svelte                                       (Tier-1 leakage fix — Task 7a)
- packages/bm-ui/src/lib/components/ui/button/button-variants.ts                              (Tier-1 leakage fix — Task 7b)
- packages/bm-ui/src/lib/components/custom/PageContainer.svelte                               (Tier-1 leakage fix — Task 7c)

Forbidden:
- Any edit outside the files above.
- ANY edit to Svelte <script> blocks. Markup + classes ONLY.
  Exception: HeaderMenuTailwind.svelte — the three `navLinkBase / navLinkInactive / navLinkActive`
  const string literals (~lines 94–99) hold ONLY class-name strings, no logic. You MAY edit those
  string values. Do NOT touch any function, $state, $effect, onMount, onDestroy, afterNavigate,
  or import.
- New dependencies. New files. New Tailwind plugins.
- Tier-1 palette utilities anywhere in the migrated files
  (gray-*, zinc-*, slate-*, neutral-*, stone-*, orange-*, red-*, green-*, blue-*, sky-*, indigo-*,
   violet-*, purple-*, fuchsia-*, pink-*, rose-*, amber-*, yellow-*, lime-*, emerald-*, teal-*, cyan-*).
  Use tokens.
- Arbitrary values: no `text-[Npx]`, no `bg-[#abc]`, no `shadow-[0_6px_...]`, no `ring-[Npx]`,
  no `outline-offset-[Npx]`. Use the token or an existing Tailwind utility (`shadow-sm`, `text-xs`,
  `outline-offset-0`, etc.).
  Note: existing `z-[NNNN]` values in AlphaBanner are preserved — stacking-context exception.
- Hex / rgb literals (except inside `app.html`'s splash, which we ARE migrating).
- Binding any element to the `destructive` name when it semantically represents a price drop.
- The `¢` glyph.
- WalletMenuTailwind.svelte, ConnectLanes.svelte, SlotModal.svelte, CurrencyDropdown.svelte — out of scope.

If a visual change requires a logic change, STOP and flag it — do not refactor silently.
```

---

## Required reading (read fully BEFORE editing; nothing else)

1. `docs-v2/tokens-and-rules.lock.md` (§1.1 surfaces, §1.2 status quad, §1.3 community).
2. `docs-v2/current-vs-target.md` (§2 "Where we are today" — the chrome sections).
3. `docs-v2/design/design-philosophy.md` §4 (professional but approachable), §6 (do/don't).
4. `apps/frontend-c1/src/routes/+layout.svelte` (full — pay attention to lines ~106, ~109, ~113, ~127, ~140).
5. `apps/frontend-c1/src/app.html` (full — 58 lines).
6. `apps/frontend-c1/src/lib/components/template/AlphaBanner.svelte` (full).
   The inner mint/connect block (~lines 50–86) IS commented out. The wrapping `<header>` (~line 38) IS active and uses Tier-1.
7. `apps/frontend-c1/src/lib/components/template/HeaderMenuTailwind.svelte` (full — ~375 lines; `<script>` lines 1–100, desktop header lines 102–222, mobile sheet lines 224–363).
8. `apps/frontend-c1/src/lib/components/template/ReputationCommunityBanner.svelte` (full — 101 lines).
9. `apps/frontend-c1/src/lib/components/template/Footer.svelte` (full — 81 lines).
10. `apps/frontend-c1/src/routes/+page.svelte` (full — 47 lines).
11. `packages/bm-ui/src/lib/components/ui/card/card.svelte` (full — 43 lines).
12. `packages/bm-ui/src/lib/components/ui/button/button-variants.ts` (full — 85 lines).
13. `packages/bm-ui/src/lib/components/custom/PageContainer.svelte` (full).
14. `packages/bm-design/src/theme.css` lines 445–500 (confirm `--color-card`, `--color-popover`, `--color-community`, `--color-community-soft`, `--color-community-border`, `--color-input`, `--color-accent`, `--color-warning` all exist after Prompt A).

Do NOT open other files. If you think you need to, STOP and flag.

---

## Task 0 — Migrate `apps/frontend-c1/src/routes/+layout.svelte`

This is the app's outermost rendered wrapper — HeaderMenuTailwind, AlphaBanner, page content, and Footer all mount inside it. Five Tier-1 sites, all in markup (zero `<script>` changes):

| Location | Current | Target |
|---|---|---|
| Svelte-side splash container (~line 106) | `bg-gray-900` | `bg-background` |
| Svelte-side splash copy text (~line 109) | `text-gray-500` | `text-muted-foreground` |
| App main container (~line 113) | `bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100` | `bg-background text-foreground` |
| Network-mismatch banner (~line 127) | `text-orange-800 dark:text-orange-300` | `text-warning` |
| Footer wrapper div (~line 140) | `border-t border-purple-600/20 dark:border-purple-500/25` | `border-t border-border` |

---

## Task 1 — Migrate `app.html` splash

The early-paint `<script>` at lines 7–17 already toggles `.dark` on `<html>` before the splash renders, so `--color-background` / `--color-muted-foreground` are in scope when the splash paints.

In the inline `<style>` of the `#splash-screen` div (lines 21–44), replace:

| Current | Target |
|---|---|
| `background: var(--color-gray-900);` | `background: var(--color-background);` |
| `color: #667085;` | `color: var(--color-muted-foreground);` |

Leave splash image, layout, z-index, and the `<script>` that removes the splash on `DOMContentLoaded` exactly as they are.

---

## Task 2 — Migrate `AlphaBanner.svelte`

This file renders a full-width `h-16` header bar **above** HeaderMenuTailwind on every page. The inner mint/connect block (~lines 50–86) is commented out — leave it untouched. Only the wrapping `<header>` and its two inner text spans carry Tier-1:

| Location | Current | Target |
|---|---|---|
| `<header>` root class (~line 38) | `...border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900` | `...border-b border-border bg-background` (preserve `relative top-0 right-0 left-0 z-[999] h-16`; the `z-[999]` arbitrary value is a stacking-context exception — keep it) |
| App-name text span (~line 43) | `text-gray-900 dark:text-gray-200` | `text-foreground` |
| Right-side container (~line 49) | `text-gray-900 dark:text-gray-200` | `text-foreground` |

Three substitutions. Script block entirely untouched.

---

## Task 3 — Migrate `HeaderMenuTailwind.svelte`

Header is ~375 lines. The `<script>` (lines 1–100) is OFF-LIMITS except for the three `navLink*` class-name string constants.

### 3a. The `navLinkBase / navLinkInactive / navLinkActive` constants (lines ~94–99)

These const string literals hold ONLY class names — no logic. This is the **only** authorized mutation of the `<script>` block in this prompt. Replace:

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

Note: `border-foreground` is intentional — the active-tab underline uses the body text color (Carbon-style hairline). Resolves to `surface-950` in light / `surface-50` in dark, matching the original visual weight.

### 3b. Desktop header chrome (lines ~102–222)

| Current | Target |
|---|---|
| `border-zinc-200 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90` (header root) | `border-border bg-background/90 backdrop-blur-md` |
| `text-zinc-900 ... dark:text-zinc-50` (wordmark anchor) | `text-foreground` |
| `focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-200` | `focus-visible:outline-ring` |
| `border border-zinc-900 ... dark:border-zinc-100` (BM monogram square) | `border border-border` |
| `text-zinc-600 hover:text-zinc-950 ... dark:text-zinc-400 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-200` (dark-mode toggle) | `text-muted-foreground hover:text-foreground focus-visible:outline-ring` |
| `text-zinc-700 hover:text-zinc-950 ... dark:text-zinc-300 dark:hover:text-zinc-50 dark:focus-visible:outline-zinc-200` (mobile menu button) | `text-muted-foreground hover:text-foreground focus-visible:outline-ring` |

### 3c. Mobile sheet (lines ~224–363)

Sweep every Tier-1 utility to tokens:

| Pattern | Target |
|---|---|
| Sheet backdrop: `bg-zinc-950/45 backdrop-blur-[3px]` | `bg-overlay backdrop-blur-sm` (`backdrop-blur-[3px]` → `backdrop-blur-sm` = 3 px → 4 px; visually imperceptible) |
| Sheet panel: `border-l border-zinc-200/80 bg-zinc-50/95 ... dark:border-zinc-700/80 dark:bg-zinc-900/95` | `border-l border-border bg-popover` |
| `shadow-[-12px_0_40px_-8px_rgba(0,0,0,0.18)] ... dark:shadow-black/50` | `shadow-lg` (drop arbitrary value) |
| "Menu" eyebrow `text-zinc-500 dark:text-zinc-400` | `text-muted-foreground` |
| Close button `text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100` | `text-muted-foreground hover:text-foreground` |
| Nav link rows `border-b border-zinc-200 ... text-zinc-800 ... dark:border-zinc-700 dark:text-zinc-100` | `border-b border-border text-foreground` |
| Sublabel under "Community" `text-zinc-500 dark:text-zinc-400` | `text-muted-foreground` |
| Separator `bg-zinc-200/90 dark:bg-zinc-700/80` | `bg-border` |
| Theme row label `text-zinc-600 dark:text-zinc-300` | `text-muted-foreground` |
| Theme toggle button `text-zinc-700 ... dark:text-zinc-300` | `text-muted-foreground hover:text-foreground` |
| Connected-wallet card root `rounded-2xl border border-zinc-200/80 bg-white/90 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-950/60` | `rounded-md border border-border bg-card text-card-foreground shadow-sm` |
| "Connected wallet" eyebrow `text-zinc-500 dark:text-zinc-400` | `text-muted-foreground` |
| Address line `text-zinc-900 dark:text-zinc-100` | `text-foreground` |
| Address separator dots `text-zinc-400` | `text-muted-foreground` |
| Disconnect button `text-red-700 ... dark:text-red-400` (with `underline-offset-4 hover:underline`) | `text-destructive underline-offset-4 hover:underline` (keep underline-only hover; do NOT add `hover:text-destructive/90` — the original hover behavior was underline only, no color change) |

If you encounter `rounded-2xl` or `tracking-[0.14em]` — preserve them (not Tier-1 leakage).

---

## Task 4 — Migrate `ReputationCommunityBanner.svelte`

This banner uses a multi-stop purple/indigo gradient. The new contract bakes the same role-name (`community` → Skeleton `tertiary`/violet) as a **flat soft tint**. **This is a visible change** and is intentional.

Replace the root `<a>` class string (~line 26):

```svelte
class="group border-b border-purple-500/15 bg-gradient-to-r from-purple-50/90 via-indigo-50/80 to-purple-50/90 transition-colors hover:border-purple-500/25 hover:from-purple-50 hover:via-indigo-50 hover:to-purple-50 dark:border-purple-400/10 dark:from-purple-950/40 dark:via-indigo-950/35 dark:to-purple-950/40 dark:hover:from-purple-950/55 dark:hover:via-indigo-950/50 dark:hover:to-purple-950/55"
```

With:

```svelte
class="group block border-b border-community-border bg-community-soft transition-colors hover:bg-community-soft/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring"
```

Note: `outline-offset-0` (standard utility, flush outline) replaces any arbitrary `outline-offset-[Npx]` value.

Sweep the rest:

| Current | Target |
|---|---|
| `text-purple-900 dark:text-purple-100` (~line 31) | `text-community` |
| `text-purple-600 ... group-hover:text-purple-700 dark:text-purple-400 dark:group-hover:text-purple-300` (Sparkles icon, ~line 33) | `text-community/70 group-hover:text-community` |
| `text-[11px] text-purple-800/90 sm:text-xs dark:text-purple-200/85` (dl, ~line 43) | `text-xs text-community/90` (drop `text-[11px]`; `text-xs` = 12 px removes the arbitrary value) |
| `font-medium text-purple-600/80 dark:text-purple-400/90` (each `<dt>`, lines 46, 54, 62, 83; line 68 is inside a commented block — skip it) | `font-medium text-community/70` |
| `border-purple-300/50 ... dark:border-purple-600/40` (vertical separators, ~lines 82, 92) | `border-community-border` |
| `text-purple-600 ... dark:text-purple-300/90` (~line 92, "Connect wallet" fallback text) | `text-community/80` |

The `font-mono tabular-nums` on `<dd>` elements stays — correct per numeric rules.

**Visual outcome:** flat violet tint strip, not a gradient. **Capture a before/after screenshot in the PR so reviewers can ACK the gradient → flat decision.**

---

## Task 5 — Migrate `Footer.svelte`

| Current | Target |
|---|---|
| `border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900` (footer root, ~line 24) | `border-t border-border bg-background` |
| `bg-orange-500 text-white shadow-sm transition-colors group-hover:bg-orange-600` (BM monogram square, ~line 31) | `bg-accent text-accent-foreground shadow-sm transition-colors group-hover:bg-accent/90` |
| `text-gray-900 dark:text-white` (app-name span, ~line 35) | `text-foreground` |
| `text-sm text-gray-500 dark:text-gray-400` (copyright `<p>`, ~line 39) | `text-sm text-muted-foreground` |
| `text-sm font-semibold text-gray-900 dark:text-gray-100` (each `<h3>`) | `text-sm font-semibold text-foreground` |
| `text-sm text-gray-600 transition-colors hover:text-orange-500 dark:text-gray-400 dark:hover:text-orange-400` (each link `<a>`) | `text-sm text-muted-foreground transition-colors hover:text-accent` |

Note: the inner `<span class="text-sm font-bold">BM</span>` inherits `text-accent-foreground` from the parent — no separate change needed. `CurrencyDropdown` stays untouched (out of scope).

---

## Task 6 — Migrate `+page.svelte` outer wrapper (empty-state branch only)

The route uses `<PageContainer>` from `bm-ui` (fixed in Task 7c). The only Tier-1 in the route itself is the **empty-state branch**. Replace (lines ~35–44):

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

No other change. `<MarketPlace>` rendering, props, derived stores, and `onMount` stay exactly as written.

---

## Task 7 — Fix `bm-ui` Tier-1 leakage (Card + Button + PageContainer)

> **Visible-change warning.** Every `<Card>` in the app shifts hue after 7a: light mode from cool `zinc-100` to warm Skeleton `surface-50`, dark mode from near-black `gray-900` to Skeleton `surface-900`. **This is intentional and aligns Card with the rest of the chrome.** Capture before/after on Reputation Hub and My Bets pages in the PR so reviewers can ACK it.

### 7a. `packages/bm-ui/src/lib/components/ui/card/card.svelte`

Replace the entire `cn(...)` class string (lines ~17–35) with:

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

Drop `border-zinc-100/70`, `dark:bg-gray-900`, `bg-zinc-100`, all `shadow-[...]` arbitrary values, `hover:border-zinc-300`, `dark:hover:border-zinc-700`. Card relies on `border-border` for visual definition. Preserve `$bindable`, `$props`, `data-slot`, slot rendering, and `WithElementRef` typing exactly.

### 7b. `packages/bm-ui/src/lib/components/ui/button/button-variants.ts`

Two surgical edits.

**`outline` variant** (lines ~35–41) — replace with:

```ts
outline: [
    'bg-transparent text-muted-foreground',
    'border border-border',
    'hover:bg-transparent hover:text-foreground'
].join(' '),
```

Drop `text-gray-300`, `hover:text-gray-100`, `dark:border-input`, `dark:text-gray-300`, `dark:hover:text-gray-100`.

**Arbitrary shadow values across `default`, `secondary`, `destructive` variants** — replace each `shadow-[0_6px_18px_rgba(0,0,0,0.08)]`, `shadow-[0_10px_26px_rgba(0,0,0,0.45)]`, `dark:shadow-[0_10px_26px_rgba(0,0,0,0.45)]`, `shadow-[0_6px_18px_rgba(0,0,0,0.10)]` with `shadow-sm`. Drop the `dark:shadow-*` lines entirely.

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

Same pattern for `secondary` and `destructive`. `ghost`, `link`, the `base`, `size`, `defaultVariants`, and exported types stay exactly as written.

### 7c. `packages/bm-ui/src/lib/components/custom/PageContainer.svelte`

Replace the two container divs:

```svelte
<div class="min-h-screen bg-background">
    <div class="mx-auto w-full max-w-7xl px-4 py-8 text-foreground sm:px-6 lg:px-8 lg:py-12">
        {@render children?.()}
    </div>
</div>
```

No prop changes, no script changes, no slot changes. Three substitutions: `bg-white` → `bg-background`, `text-gray-900` → `text-foreground`, drop `dark:bg-gray-900 dark:text-white`.

---

## Verification (paste actual command output / screenshots in PR)

```bash
# 1. Build + check
pnpm --filter @bigmarket/frontend-c1 check
pnpm --filter @bigmarket/frontend-c1 build

# 2. Tier-1 leakage in the migrated files (MUST RETURN ZERO)
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret|accent)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  apps/frontend-c1/src/routes/+layout.svelte \
  apps/frontend-c1/src/app.html \
  apps/frontend-c1/src/lib/components/template/AlphaBanner.svelte \
  apps/frontend-c1/src/lib/components/template/HeaderMenuTailwind.svelte \
  apps/frontend-c1/src/lib/components/template/ReputationCommunityBanner.svelte \
  apps/frontend-c1/src/lib/components/template/Footer.svelte \
  apps/frontend-c1/src/routes/+page.svelte \
  packages/bm-ui/src/lib/components/ui/card/card.svelte \
  packages/bm-ui/src/lib/components/ui/button/button-variants.ts \
  packages/bm-ui/src/lib/components/custom/PageContainer.svelte

# 3. Arbitrary values in the migrated files (MUST RETURN ZERO)
rg -n '(bg|text|border|ring|fill|stroke|shadow|outline|outline-offset)-\[' \
  apps/frontend-c1/src/routes/+layout.svelte \
  apps/frontend-c1/src/app.html \
  apps/frontend-c1/src/lib/components/template/AlphaBanner.svelte \
  apps/frontend-c1/src/lib/components/template/HeaderMenuTailwind.svelte \
  apps/frontend-c1/src/lib/components/template/ReputationCommunityBanner.svelte \
  apps/frontend-c1/src/lib/components/template/Footer.svelte \
  apps/frontend-c1/src/routes/+page.svelte \
  packages/bm-ui/src/lib/components/ui/card/card.svelte \
  packages/bm-ui/src/lib/components/ui/button/button-variants.ts \
  packages/bm-ui/src/lib/components/custom/PageContainer.svelte

# 4. Lint (no NEW errors; pre-existing errors are out of scope for this PR)
pnpm --filter @bigmarket/frontend-c1 lint

# 5. Dev server
pnpm dev
```

Open `http://localhost:8081` and visually confirm:

1. **App chrome (layout.svelte):** body background matches header in light mode (no `bg-gray-50` vs `bg-background` stripe); network-mismatch banner uses `text-warning` color.
2. **Splash (both `app.html` and `+layout.svelte`):** uses token background.
3. **AlphaBanner + HeaderMenuTailwind:** no visible color seam between the two header bars in either theme.
4. **Header chrome:** consistent in light AND dark. Wordmark / monogram legible; focus ring visible on tab.
5. **Nav links:** inactive vs active vs hover visibly distinct. Active tab underline matches text color.
6. **Mobile sheet (≤768 px):** opens; has overlay, border, popover surface; close button works; theme toggle works.
7. **Reputation community banner (when reputation data loaded):** flat violet tint strip, not a gradient. Stats use `tabular-nums`. Screenshot mandatory.
8. **Footer:** monogram is accent (cobalt); link hover is accent; copyright is muted; theme parity.
9. **Cards anywhere in the app** (Reputation, My Bets): `bm-ui/Card` now `bg-card border-border`. Hue shift from zinc to warm Skeleton cream is **expected** — capture before/after screenshot.
10. **PageContainer surface:** no more `bg-white dark:bg-gray-900` bleed; all page surfaces use tokens.
11. **Reduced motion:** macOS "Reduce motion" → no transitions / no `animate-pulse` on chrome.

If verification step 2 or 3 returns any line, **fix before commit**. They are the hard gates.

---

## PR summary template

```
B0 — Header chrome migration to Tier-2 tokens

What changed:
- +layout.svelte: 5 Tier-1 sites swept (splash, main container, network banner, footer wrapper)
- app.html splash: --color-gray-900 + #667085 → --color-background + --color-muted-foreground
- AlphaBanner.svelte: active <header> Tier-1 → border-border bg-background (3 substitutions)
- HeaderMenuTailwind.svelte: desktop chrome + navLink* constants + mobile sheet swept to tokens
  (no <script> changes outside the three navLink* string constants)
- ReputationCommunityBanner.svelte: purple gradient → flat bg-community-soft (screenshot attached)
- Footer.svelte: gray-* + orange-500 → token semantics
- routes/+page.svelte: empty-state branch swept (no other change)
- bm-ui/Card: dropped Tier-1 surface + arbitrary shadows; bg-card border-border (screenshot attached)
- bm-ui/Button outline: gray-* → muted-foreground/foreground; arbitrary shadows → shadow-sm
- bm-ui/PageContainer: bg-white dark:bg-gray-900 → bg-background; text-gray-900 dark:text-white → text-foreground

What did NOT change:
- Zero Svelte <script> logic (only constants edited: pure class-name strings in HeaderMenuTailwind.svelte).
- No SDK / API / store / route / event-handler edit.
- No new deps. No new files. AlphaBanner.svelte mint block left commented-out as-is.
- Wallet / connect / modal / currency-dropdown / market cards / leaderboard / staking / charts untouched.

Verification:
- Tier-1 grep on all 10 migrated paths: 0 hits.
- Arbitrary-values grep (incl. outline-offset) on all 10 paths: 0 hits.
- Typecheck / build: ok. Lint: no new errors.
- Visual: chrome light + dark confirmed; mobile sheet confirmed.
- Reputation banner gradient→flat: screenshot attached (reviewer ACK required).
- Card hue shift: before/after screenshot on Reputation Hub (reviewer ACK required).
- Reduced motion: confirmed (screenshot).
```

---

## What this prompt does NOT do (defer to Prompt B or later)

- Market cards, leaderboard, gauge, comments preview, category chips — full homepage body. → Prompt B.
- `bm-utilities/format-extras.ts` (`fmtProbability`, `fmtSignedPercent`, etc.). → Prompt B.
- WalletMenuTailwind / ConnectLanes / SlotModal / CurrencyDropdown redesigns. → Future prompts.
- `bm-ui/Panel.svelte` — its container class is built in a `$derived` expression in `<script>` (Panel.svelte line 63); the guardrail prevents changing it here. Every trade widget renders inside Panel, so the trade-widget chrome will still emit Tier-1 from Panel until a dedicated "bm-ui Panel fix" prompt runs. → Future prompt (run before or alongside Prompt C).
- Market detail page. → Prompt C.

If anything else feels missing while working, **STOP and ask**, do not improvise.
