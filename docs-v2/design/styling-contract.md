# Styling contract (BigMarket)

**Purpose:** A single agreement for introducing and maintaining styles, so the team and AI agents do not fall back on raw Tailwind primitives without semantics.

> ⚠️ **Top warning 1 — Skeleton naming collision.**
> Skeleton’s **`secondary-*`** family (cobalt) is bound to our **`accent`** token.
> Our **`secondary`** token is a **subtle surface** (`surface-200` light / `surface-800` dark).
> Therefore: `bg-accent` = cobalt CTA / link / focus; `bg-secondary` = de-emphasized surface. Do not assume `bg-secondary` is cobalt.

> ⚠️ **Top warning 2 — `price-down` is NOT `destructive`.**
> A red price drop is **not** an error. Bind price-direction visuals to `price-up` / `price-down` / `price-neutral` (own token names). They may share **values** with `success` / `destructive` / `muted-foreground`, but the **names** never collide. The same applies to order-book ask rows — bind to `price-down`, never `destructive`. See §4.7 below and [`design-philosophy.md`](./design-philosophy.md) §6 "Don't".

> ⚠️ **Top warning 3 — No arbitrary values in feature code or `bm-ui`.**
> No `text-[13px]`, `bg-[#abc]`, `shadow-[0_6px_18px_rgba(...)]`, or `ring-[3px]` in `apps/**` or `packages/**` except inside `packages/bm-design/`. Use a token, or add one. The audit (`audit-report.md` §A "Shadow", §I) lists current violations; CI grep in `PROMPTS.md` Step 9 will gate this.

> ⚠️ **Top warning 4 — Tabular numerics, every numeric display.**
> All prices, percentages, balances, countdowns, and addresses must wrap in an element carrying `tabular-nums`. Crypto addresses also use `font-mono tabular-nums`. Headings never use `tabular-nums`.

## 1. Sources of truth

| What | Where |
|------|-------|
| Semantic colors, spacing, radius in CSS (Tailwind `@theme`) | `packages/bm-design/src/theme.css` |
| Same values for TypeScript (charts, inline styles) | `packages/bm-design/src/tokens.ts` |
| Tailwind entry point in the app | `apps/frontend-c1/src/routes/layout.css` (`@import` bm-design, `@source` workspace packages) |
| Components without logic | `packages/bm-ui` (presentation-only) |
| Inventory of semantic roles (what we tokenize) | [`bm-semantic-tokens-proposal.md`](./bm-semantic-tokens-proposal.md) |
| Brand palette `nouveau` (OKLCH, contrast, font/radius base) | `packages/bm-design/src/vendor/skeleton-nouveau.css` + [`skeleton-theme-nouveau.md`](./skeleton-theme-nouveau.md) |

**Rule:** every change to a semantic value lands in **both** `tokens.ts` **and** `theme.css` (until we automate it).

## 2. Token architecture (three tiers)

```text
TIER 1 — Primitives (palette stops in theme.css, e.g. --color-primary-500)
        ↓ mapped to
TIER 2 — Semantics (Tailwind/shadcn convention: bg-card, text-foreground, …)
        ↓ where needed, into
TIER 3 — Component namespace (explicit per-component tokens for high-variant
         components — buttons, tabs, …)
```

**Who uses what**

- **Feature / app code (Svelte routes, business packages):** Tier 2 by default. Tier 1 (`gray-*`, `zinc-*`, `orange-500`, …) is not used after migration — only in `theme.css` / `@theme`.
- **`bm-ui`:** Tier 2 for simple surfaces; Tier 3 where a component has many variants × states (e.g. buttons).
- **Tier 1 in product code:** forbidden outside `packages/bm-design` (goal: custom lint / grep in CI).

**Why hybrid:** pure Tier 2 covers most UI; pure Tier 3 is verbose for ordinary text. Hybrid = short everyday code + clear contracts where state surfaces explode.

## 3. Class hierarchy (consumption rule)

1. **Semantic token** (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, `bg-card`, …) — **default** for product UI.
2. **Primitive Tailwind scale** — only inside `bm-design` when defining the semantic mapping; **not** in feature code after migration.
3. **Hex / rgb in components** — avoid; if used exceptionally, leave a comment explaining why (e.g. temporary until a token is introduced).

## 4. Naming contract (mandatory)

1. **Roles, not colors** — `accent`, not `purple`; `outcome-1`, not `orange-outcome`.
2. **Pair** — every solid surface that holds text has `*-foreground` (or an equivalent from the contrast table).
3. **Quad for status roles** — for `success`, `warning`, `destructive`, `info`, `accent`: add `*-soft` and `*-border` where badges/pills need a tint + border (see proposal).
4. **Surface monotonicity** — levels go `background → card → popover` (or the equivalent defined in `@theme`). `muted` is “below” / sunken (well, filter). Skipping a level is a design error.
5. **States are suffixes** — `hover`, `active`, `disabled` on the same role; **`selected` is a separate concept** (the selection ring is not necessarily `primary`).
6. **`primary` ≠ trade action** — `primary` = brand CTA; a transaction confirmation can be a different role (e.g. `success` / `action`) even if it currently looks the same.
7. **Status ≠ price direction** — `destructive` = error/delete; **price drop** is `price-down` (may share a value with `destructive`, but not the name).
8. **Outcome series** — `outcome-1…n` are categorical colors for scalar markets; they do not replace Yes/No (`success` / `destructive`).
9. **No arbitrary values in feature code** after cleanup — e.g. `text-[13px]`, `bg-[#abc]`; replace with typography roles / tokens.
10. **Every semantic color has a dark counterpart** — no exceptions.

**Selecting a selection ring:** when a card is already brand/colored, `ring-primary` can disappear into the background. A dedicated **`selected`** token (e.g. mapped to a secondary / cobalt accent) keeps selection legible.

## 5. Recipes (composition)

- **Solid button:** `bg-{role} text-{role}-foreground`, subtle hover (e.g. `/90`), **tactile press** `active:scale-[97%]` on interactive controls where it makes sense.
- **Soft badge:** `bg-{role}-soft text-{role} border border-{role}-border`.
- **Card:** `bg-card text-card-foreground border border-border` (+ radius from tokens).
- **Input:** `bg-background border border-input` + visible `focus-visible:ring-2` / `ring-ring`. (`--color-input` is the **border** color — shadcn convention, matches existing `bm-ui/input/input.svelte`. The input surface is the page background or `bg-card`, not a dedicated `bg-input` utility.)
- **Modal:** `bg-popover` above `bg-overlay` (once an overlay token is introduced).

### Spacing rhythm (until a dedicated `spacing.md` lands)

- Card padding: `p-md` (16 px) on `<md`, `p-lg` (24 px) on `md+`.
- Button vertical padding: 8 / 12 / 16 px for sm / md / lg.
- List row padding: `py-sm` (8 px).
- Section spacing: `py-xl` (32 px) desktop, `py-lg` (24 px) mobile.
- Breakpoints: Tailwind defaults (`sm/md/lg/xl/2xl`), **mobile-first**. JS reading breakpoints does so via `matchMedia('(min-width: 768px)')`.

### Radius per surface (until a dedicated `radius.md` lands)

- Input / button / card / popover = `rounded-md` (`--radius-md` from `theme.css`).
- Modal = `rounded-lg` (`--radius-lg`).
- Pill / badge = `rounded-full`.

### Shadow per surface (token names; introduce as a Wave-2 ticket)

- Card resting / hover = `shadow-card` / `shadow-card-hover` (resting subtle, hover slightly deeper).
- Popover / dropdown / menu = `shadow-popover`.
- Modal = `shadow-modal` (largest, used with overlay token).
- Button press = `shadow-button-press` (inset, tactile).
- Focus = `shadow-focus` (used in addition to `ring-ring`).

**Rule:** no `shadow-[…]` arbitrary utilities anywhere except inside `packages/bm-design/` while defining these tokens.

### Motion (until a dedicated `motion.md` lands)

- Three durations: `motion-fast` 120 ms / `motion-base` 200 ms / `motion-slow` 320 ms.
- Two easings: `ease-pop: cubic-bezier(.16,1,.3,1)` for entrance/exit; `ease-stand: cubic-bezier(.4,0,.2,1)` for state transitions.
- All transform / opacity animations honor `prefers-reduced-motion: reduce` (degrade to no animation, no scroll).
- Infinite animations (live dot pulse, ticker scroll) are **disabled** under reduced-motion.

Details and extended inventory: [`bm-semantic-tokens-proposal.md`](./bm-semantic-tokens-proposal.md).

## 6. Dark mode

Every semantic role must have a meaningful **dark** counterpart (in `@layer base` / `.dark` or via an aligned `dark:` approach). No half-tokens without a night variant.

## 7. Migration and verification

- **Component by component**, not page by page — easier to review and regress.
- During each wave: **grep** for `gray-`, `zinc-`, `text-[`, `bg-[#` in feature code; results drive the next token wave.
- **Token gallery / Storybook** (recommended): a single screen with all semantic swatches + light/dark.

## 8. Packages and legacy

- **`sip18-forum`:** No DaisyUI; uses Tailwind utilities. May still contain older ad-hoc color combinations — align with `bm-design` in a separate pass.
- **`docs/technical/08_ui_element_analysis.md`:** per-page checklist; check the “Tech stack” row when dependencies change (e.g. Skeleton in `bm-ui`).
- **Reference competitor (method + notes):** [`polymarket-ui-audit.md`](./polymarket-ui-audit.md) (+ images in `docs/design/assets/polymarket/`).

## 9. Work order (groundwork → proof → cleanup)

1. **Analyze** — CSS / visual analysis per [`polymarket-ui-audit.md`](./polymarket-ui-audit.md) (or an internal audit); record the summary in the same MD or a linked doc.
2. **Groundwork** — extend `tokens.ts` + `theme.css`; update `bm-semantic-tokens-proposal.md` if a key concept changes.
3. **This contract** — remains the reference; changes rarely and explicitly (PR description).
4. **Proof in code** — one visible change (e.g. **header / shell**) that uses the new tokens end-to-end.
5. **Per-component pass** — other components one at a time; note progress in `08_ui_element_analysis.md` where helpful.

## 10. Out of scope for this contract

- Business logic in `bm-ui` (still forbidden).
- Changes without a corresponding use case where the project rule requires one (`/docs/use-cases/`).
