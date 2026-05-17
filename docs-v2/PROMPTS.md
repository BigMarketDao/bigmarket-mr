# PROMPTS — BigMarket UI refactor (phantom-wallet branch)

Executable, dependency-ordered checklist that drives refactor commits on the `phantom-wallet` branch. Every prompt is preceded by the **guardrails block**. Read [`README.md`](./README.md) and [`sources-of-truth.md`](./sources-of-truth.md) first.

## How to use

- Run prompts in order. Each one is a small, reviewable commit.
- Do **not** combine steps. The order is the review unit.
- After every prompt, capture before/after screenshots of the affected slice (light + dark) in the PR description.
- The final visual target per step is concrete (see “Definition of done”). Token work that does not change a screen does not count as a step’s outcome — it is its prerequisite.

## Canonical references (links the prompts may use)

- [`README.md`](./README.md)
- [`sources-of-truth.md`](./sources-of-truth.md)
- [`design/styling-contract.md`](./design/styling-contract.md)
- [`design/bm-semantic-tokens-proposal.md`](./design/bm-semantic-tokens-proposal.md)
- [`design/skeleton-theme-nouveau.md`](./design/skeleton-theme-nouveau.md)
- [`ui-system.md`](./ui-system.md)

Implementation files the prompts may touch:

- `packages/bm-design/src/theme.css`
- `packages/bm-design/src/tokens.ts`
- `apps/frontend-c1/src/routes/layout.css`
- Component files inside `packages/bm-ui`, `packages/bm-market-homepage`, `packages/bm-market`, `packages/bm-create-market`, and Svelte files in `apps/frontend-c1/src`.

---

## Guardrails block (include in every prompt below, verbatim)

```text
DO NOT change behavior.

Allowed:
- HTML / Svelte markup structure
- CSS classes (Tailwind utilities and class attributes)
- Layout, spacing, typography, color tokens, radii, shadows
- Visual states (hover, focus-visible, active, disabled, selected)
- Accessibility attributes (aria-*, role, labelled-by, focus targets)

Forbidden:
- Edits to .ts business logic
- Svelte <script> blocks that own state, stores, or effects (do not move, rename, or change them)
- Stores, SDK calls, API calls, routing, contracts, data shapes, event-handler semantics
- Introducing new dependencies
- Reintroducing DaisyUI utilities (CLAUDE.md: "Do not reintroduce DaisyUI")

Rules of the road:
- If a component mixes logic and presentation, only the presentation half may change.
- If a visual change requires a logic change, STOP and flag it in the PR — do not refactor silently.
- Dark-mode parity is mandatory for every change.
- Use only Tier 2 semantic tokens in feature code. Tier 1 palette utilities (gray-*, zinc-*, orange-500, etc.) are forbidden outside packages/bm-design.
- No arbitrary values: no text-[Npx], no bg-[#abc], no hex/rgb in components.
- Reference only the canonical sources of truth in docs-v2/. Do not edit docs/design/ legacy files.
```

---

## Step 1 — CSS hygiene & wiring audit (read-only)

**Goal:** confirm the runtime pipeline is correctly wired before doing anything else. No file edits.

**Verify and report findings on:**

- `apps/frontend-c1/src/routes/layout.css`
  - `@import 'tailwindcss';` present.
  - `@import '@bigmarket/bm-design/theme.css';` present and resolves.
  - Every `@source '../../../../packages/<pkg>/src'` path actually exists.
  - `@custom-variant dark (&:where(.dark, .dark *))` present.
  - `@plugin '@tailwindcss/forms'` and `@plugin '@tailwindcss/typography'` present.
  - `body { @apply m-0 min-h-dvh bg-background text-foreground antialiased; font-family: var(--font-sans); }` present.
- `packages/bm-design/src/theme.css`
  - Imports `./vendor/skeleton-nouveau.css`.
  - One `@theme { ... }` block (no duplicates).
  - Semantic aliases set: `background`, `foreground`, `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `muted`, `muted-foreground`, `border`, `accent`, `accent-foreground`, `destructive`, `destructive-foreground`, `ring`.
  - `.dark` overrides exist for every semantic key above.
  - `--font-sans: var(--base-font-family);` and `--font-heading: var(--heading-font-family);`.
  - `html { font-size: calc(100% * var(--text-scaling)); }` and `h1–h6 { font-family: var(--font-heading); }` in `@layer base`.
- `packages/bm-design/src/vendor/skeleton-nouveau.css`
  - Selector is `:root`.
  - Header comment lists Skeleton version (`@skeletonlabs/skeleton@4.15.2`).
- `packages/bm-design/package.json`
  - `"./theme.css": "./src/theme.css"` is exported.
- Confirm where `.dark` is added/removed at runtime. Read-only — do not change behavior.

**Output:** a checklist in the PR body, no code changes. Open issues for any failure.

**Definition of done:** the pipeline is verified; subsequent prompts can trust the wiring.

---

## Step 2 — `tokens.ts` ↔ `theme.css` parity

**Goal:** make the TS mirror match the runtime truth so charts/inline styles do not drift.

**Scope:**

- `packages/bm-design/src/tokens.ts`

**Tasks:**

- Add the missing pairs: `primary-foreground`, `secondary-foreground`, `muted-foreground`, `accent-foreground`, `destructive-foreground`.
- Restructure as `{ light: {...}, dark: {...} }` (or equivalent) so dark values are present.
- Replace the hardcoded OKLCH literals with the **current** values that `theme.css` resolves to (snapshot of the runtime values from the vendor file). Treat `theme.css` as the source of truth; copy values from there into `tokens.ts`.
- Adjust `radius` keys to mirror the runtime (`md` → `--radius-base` value, `lg` → `--radius-container` value).
- Keep `spacing` and `typography` blocks as they are (they are already aligned with `theme.css` and nouveau).
- Add a header comment that says: “This file mirrors `theme.css`. Update both together. Runtime truth is `theme.css`.”

**Definition of done:** every semantic key in `theme.css` light + dark has a counterpart in `tokens.ts`, with the same effective value. No component/UI changes.

---

## Step 3 — Token wave 1: surfaces + input

**Goal:** introduce the minimum-viable Tier-2 tokens needed by the app shell and forms before any UI migration.

> ⚠️ **This step unblocks broken UI today.** `packages/bm-ui/src/lib/components/ui/popover/popover-content.svelte:26`, `dialog-content.svelte:30`, `input/input.svelte:28,43`, `select/select-trigger.svelte:22`, `tabs/tabs-trigger.svelte:16` already reference `bg-popover`, `bg-card`, `bg-input`, `border-input`, `text-popover-foreground` — and **those variables do not exist in `theme.css` today** (`audit-report.md` §I "bm-ui consumes Next-wave tokens that are undefined"). Several `bm-ui` primitives are currently rendering with inherited / initial-value backgrounds in production. Land this step before merging any Step 4–7 work.

**Scope (both files in lock-step):**

- `packages/bm-design/src/theme.css` (add to `@theme { ... }` and to `.dark { ... }`)
- `packages/bm-design/src/tokens.ts`

**Tokens to add:**

- `card` + `card-foreground`
- `popover` + `popover-foreground`
- `input` (**BORDER color**, shadcn convention — matches existing `bm-ui` usage of `border-input`; do NOT introduce a separate `input-border`)
- `overlay` (modal dim background; light + dark)

**Suggested mapping (verify in PR against `vendor/skeleton-nouveau.css`):**

- Light: `card` = `surface-50` (same as page) or `white`, `card-foreground` = `surface-950`; `popover` = `white`, `popover-foreground` = `surface-950`; `input` = `surface-200` (border value); `overlay` = `rgba(0,0,0,0.4)`.
- Dark: `card` = `surface-900`, `card-foreground` = `surface-50`; `popover` = `surface-900`, `popover-foreground` = `surface-50`; `input` = `surface-800` (border value); `overlay` = `rgba(0,0,0,0.65)`.

**Constraints:**

- No component edits.
- Verify Tailwind generates `bg-card`, `text-card-foreground`, `bg-popover`, `text-popover-foreground`, `border-input`, `bg-overlay`. (**Not** `bg-input` — `--color-input` is the border color, not a surface color.)
- This naming is **locked** by [`tokens-and-rules.lock.md`](./tokens-and-rules.lock.md) §1.1. Older notes in this folder that mention `input-border` are superseded.

**Definition of done:** new tokens compile to working Tailwind utilities in both themes; the existing `bm-ui` consumers (popover, dialog, input, select, tabs) start rendering correctly without code changes; no visual change in any screen the user has explicitly designed.

---

## Step 4 — App shell migration (vertical slice)

**Goal:** prove the pipeline end-to-end on the highest-traffic shell, and remove the most visible Tier-1 leakage.

**Scope:**

- `apps/frontend-c1/src/routes/+layout.svelte` (markup + class names only; do not touch `<script>` blocks)
- `apps/frontend-c1/src/app.html` — **also migrate** the inline FOUC splash at lines 22–44, which today hardcodes `background: var(--color-gray-900)` (Tier-1 variable) and literal `color: #667085`. Replace with `var(--color-background)` and `var(--color-muted-foreground)`. (`audit-report.md` §I "app.html raw CSS variables and hex").
- `apps/frontend-c1/src/lib/components/template/HeaderMenuTailwind.svelte`
- `apps/frontend-c1/src/lib/components/template/AlphaBanner.svelte`
- `apps/frontend-c1/src/lib/components/template/ReputationCommunityBanner.svelte`
- `apps/frontend-c1/src/lib/components/template/Footer.svelte`
- `apps/frontend-c1/src/lib/components/template/TxModal.svelte` (chrome only; do not touch tx logic)

**Replace Tier-1 utilities with Tier-2 tokens, e.g.:**

- `bg-gray-50 text-gray-900` → `bg-background text-foreground`
- `dark:bg-gray-900 dark:text-gray-100` → already covered by `.dark` overrides via `bg-background text-foreground`
- `text-gray-500` → `text-muted-foreground`
- `text-orange-800` → `text-warning` (introduce in next wave) or, for now, `text-destructive` if the intent is error-toned
- `border-purple-600/20 dark:border-purple-500/25` → `border-border`
- Splash background `bg-gray-900` → `bg-background` (or `bg-card` if the intent is a panel — pick deliberately)
- Splash inline CSS in `app.html`: `var(--color-gray-900)` → `var(--color-background)`; literal `#667085` → `var(--color-muted-foreground)`.

**Constraints:**

- Behavior, props, effects, `onMount`, store wiring, event handlers — **untouched**.
- Add `focus-visible:ring-2 ring-ring` on interactive elements where focus rings are missing.
- Provide a visible before/after for the shell in light + dark in the PR.

**Definition of done:** the chrome contains zero raw palette utilities (`gray-*`, `purple-*`, `orange-*`, etc.); dark mode is at parity; functionality identical.

---

## Step 5 — Token wave 2: status quad + domain

**Goal:** unlock badges, alerts, and prediction-specific surfaces.

**Scope:**

- `packages/bm-design/src/theme.css` (`@theme` + `.dark`)
- `packages/bm-design/src/tokens.ts`

**Tokens to add (light + dark + tokens.ts):**

- `success` + `success-foreground` + `success-soft` + `success-border`
- `warning` + `warning-foreground` + `warning-soft` + `warning-border`
- `info` + `info-foreground` + `info-soft` + `info-border`
- `destructive-soft` + `destructive-border` (round out the existing pair into a quad)
- `accent-soft` + `accent-border`
- `community` + `community-foreground` (+ optional `-soft`, `-border`) — map to Skeleton `tertiary-*`
- `price-up`, `price-down`, `price-neutral`
- `live-indicator`
- `selected`
- `overlay` (modal dim background)

**Mapping guidance (verify against vendor):**

- `success` ↔ Skeleton `success-*`, `warning` ↔ `warning-*`, `info` ↔ `secondary-*` (cobalt) or pick a distinct hue.
- `*-soft` may be the role color at low alpha (or a tinted surface in dark mode).
- `selected` must visually contrast with `primary`; default to cobalt (`accent`).
- `overlay` = semi-transparent black/dark surface; pick alpha that works light + dark.

**Definition of done:** every status role has a working `* / *-foreground / *-soft / *-border` set; domain tokens compile; no UI consumer yet.

---

## Step 6 — `bm-ui` component sweep

**Goal:** migrate `packages/bm-ui` components to Tier-2 tokens, one component per commit.

**Process per component:**

1. Read the current markup and props.
2. Confirm the component is presentation-only (per [`ui-system.md`](./ui-system.md)). If it owns state, stores, or API calls, **stop and flag**; that is a separate refactor.
3. Replace Tier-1 utilities with semantic tokens.
4. Verify hover / focus-visible / active / disabled / selected states. Add the missing ones using token-based classes.
5. Verify dark-mode parity (do not write `dark:` overrides if the semantic token already handles it; only add `dark:` for explicit deviations).
6. Add accessibility attributes where missing (focus rings, `aria-label`, `role`, keyboard handlers stay untouched in `<script>`).
7. Update component documentation/Storybook entry only if one exists.

**Definition of done per component:** zero Tier-1 leakage; dark + light parity; states are visible; component still passes existing tests; no logic change.

---

## Step 7 — Feature packages sweep

**Goal:** migrate the consumer packages in the smallest possible diffs.

**Order (per package, then component-by-component within):**

1. `packages/bm-market-homepage`
2. `packages/bm-market`
3. `packages/bm-create-market`
4. `packages/sip18-forum` (treat ad-hoc colors as a separate, slower pass — per the styling contract §8)

**Per component, same process as Step 6.** Behavior untouched.

**Definition of done per package:** the grep checklist (see Step 9) returns zero hits in that package’s `src/`.

---

## Step 8 — Token wave 3: charts + outcomes

**Goal:** remove inline hex from any chart code and stabilize categorical outcome colors.

**Scope:**

- `packages/bm-design/src/theme.css` (`@theme` + `.dark`)
- `packages/bm-design/src/tokens.ts`
- Chart component consumers (class/style only — no logic change).

**Tokens to add:**

- `outcome-1` … `outcome-6` (+ optional `-foreground` / `-soft` / `-border`)
- `chart-grid`
- `chart-axis`
- `chart-axis-label`
- `chart-tooltip-bg` (often aliased to `popover`)
- `chart-cursor`
- `chart-area-opacity`

**Mapping (suggested, verify visually):**

- `outcome-1` = warning hue, `outcome-2` = success hue, `outcome-3` = cobalt (`accent`), `outcome-4` = violet (`community`), `outcome-5` = primary yellow-gold, `outcome-6` = cyan or another distinct hue.

**Definition of done:** chart components read colors from CSS variables or `tokens.ts`; no inline hex remaining; light + dark verified.

---

## Step 9 — Lint guard (optional, last)

**Goal:** prevent regressions.

**Scope:**

- Add a CI step (or an `eslint.config.*`) that runs the grep checklist below and fails the build on hits outside `packages/bm-design/**`.

**Grep checklist:**

```bash
# Tier-1 palette leakage in feature code
rg -n "\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret|accent)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan|mauve|olive|mist|taupe)-(50|100|200|300|400|500|600|700|800|900|950)\b" apps packages

# Arbitrary values
rg -n "(bg|text|border|ring|fill|stroke)-\[" apps packages
rg -n "text-\[[0-9]+px\]" apps packages
rg -n "#[0-9a-fA-F]{3,8}\b" apps packages

# Dark-mode parity check on Tier-1 leakage
rg -n "dark:(bg|text|border)-(gray|zinc|slate|neutral)-" apps packages

# Hardcoded fonts that bypass --font-sans / --font-heading
rg -n "font-family" apps packages
rg -n "(Inter|Roboto|Helvetica)" apps packages

# DaisyUI residue
rg -n "(btn-primary|card-body|drawer-side|navbar|menu-title)\b" apps packages
```

**Definition of done:** CI fails fast on Tier-1 leakage in feature code; documented escape hatches for the rare edge cases.

---

## Notes

- Step 1 is the only read-only step. Every other step produces a commit.
- Steps that change tokens (2, 3, 5, 8) must update **both** `theme.css` **and** `tokens.ts`. The contract requires this.
- Steps that change components (4, 6, 7) must not touch `<script>` logic. If they have to, the prompt has failed and the work item must be split.
- Token waves are intentionally small. Resist the urge to add the full 30-token set on day one — the proposal explicitly says “fewer names, more consistent usage”.
