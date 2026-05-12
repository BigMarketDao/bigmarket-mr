# Sources of Truth — BigMarket UI refactor evaluation

Read-only evaluation of the design docs + implemented theme/wiring, used to seed the `phantom-wallet` refactor branch. No product UI changes here.

---

## A. Canonical sources of truth (ranked)

Use this table as the single resolution rule. If anything contradicts it, the table wins.

| Concern | Winning source | Why |
|---|---|---|
| Process, rules, naming contract, migration order, dark-mode requirement | `docs-v2/design/styling-contract.md` | Canonical per `docs-v2/design/README.md` §Single-source rule. |
| Semantic token inventory (which roles exist, quad pattern, domain tokens) | `docs-v2/design/bm-semantic-tokens-proposal.md` | Same. |
| Visual baseline (palette, contrast, fonts, radius base, text-scaling) | `docs-v2/design/skeleton-theme-nouveau.md` + `packages/bm-design/src/vendor/skeleton-nouveau.css` | Doc + vendored primitives are the visual ground truth. |
| Architecture boundaries only (`bm-ui` vs app) | `docs-v2/ui-system.md` | Explicitly “layer boundaries only”; defers tokens to design docs. |
| Implemented values (what the build actually does) | `packages/bm-design/src/theme.css`, then `packages/bm-design/src/tokens.ts` | `theme.css` is **runtime truth** (drives Tailwind v4 classes). `tokens.ts` is the JS mirror, consumed only by charts/inline. |
| Reference UI audit (Polymarket) | `docs-v2/design/polymarket-ui-audit.md` | Supporting, **not** canonical for tokens. Method only — summary tables in repo are unfilled today. |
| `docs/design/design audit polymarket bigmarket.MD` | Archive pointer only | Explicitly non-authoritative in `docs/design/README.md`. |

**Rule when a doc disagrees with `theme.css` / `tokens.ts`:**

1. **Naming/role** disagreement → the doc wins (semantics drive code).
2. **Value/wiring** disagreement → `theme.css` wins (build truth). Immediately bring `tokens.ts` and the doc into line.
3. `tokens.ts` never wins on its own — it is a TS mirror of `theme.css`. Today it has **drifted** (see §F).

---

## B. Non-negotiable engineering constraints (only what the docs actually say)

From `ui-system.md` §1–§3:

- `packages/bm-ui` is **presentation-only**: no API calls, no DAO/business logic, no app-store coupling. Inputs via props/events/slots.
- Domain naming stays in app code; `bm-ui` names are generic.
- Svelte 5 runes; UI components take state via props, never own global product state.

From `styling-contract.md` §2–§4, §6, §9:

- **Tier model** (hybrid, mandatory):
  - **Tier 1** — Primitives (`--color-primary-500`, palette stops). Defined in `theme.css` / vendor. **Forbidden in feature code after migration.**
  - **Tier 2** — Semantics (shadcn-style: `bg-card`, `text-foreground`, `bg-primary`, `bg-accent`…). **Default in product UI.**
  - **Tier 3** — Component namespace (only when a component has many variants × states — e.g. buttons, tabs).
- `bm-ui`: Tier 2 by default, Tier 3 where variants explode.
- Tier 1 outside `packages/bm-design` is banned post-migration (target: lint/grep in CI).

**Forbidden patterns explicitly listed in the contract** (do not invent extras):

- Raw palette utilities in feature code: `gray-*`, `zinc-*`, `orange-500`, etc.
- Arbitrary text sizes (`text-[13px]`) and arbitrary color values (`bg-[#abc]`) in feature code.
- Hex/rgb in components except temporarily with a comment.
- Using `destructive` for price-down, or `primary` to mean a trade-action confirmation.
- Surface level-skipping. The only direction is `background → card → popover`; `muted` is “below”.
- Semantic colors without a dark counterpart.

**State conventions:** `hover`, `active`, `disabled` are suffixes on the role. **`selected` is its own token** and must contrast against branded cards.

**Naming contract:** roles not colors; pair every solid surface with `*-foreground`; status quad = `* / *-foreground / *-soft / *-border`; `primary ≠ trade action`; `destructive ≠ price-down`; `outcome-1..n` are categorical (not Yes/No).

**Procedural rule:** every semantic value change must land in **both** `theme.css` **and** `tokens.ts` (until automated).

**Migration cadence:** component-by-component (not page-by-page); grep `gray-`, `zinc-`, `text-[`, `bg-[#` to drive the next token wave; one visible vertical slice (e.g. header/shell) before broad rollout.

---

## C. Visual baseline (Skeleton `nouveau`) — what is vendored vs aliased

Confirmed in `packages/bm-design/src/vendor/skeleton-nouveau.css` + `packages/bm-design/src/theme.css`.

**Vendored (Tier 1, immutable except via Skeleton bump):**

- `:root` (not `[data-theme='nouveau']`) so the palette applies app-wide without an HTML attribute. Re-copy from `node_modules` on Skeleton bump and keep the `:root` selector.
- OKLCH scales 50–950 for: `primary`, `secondary`, `tertiary`, `success`, `warning`, `error`, `surface`, plus their `*-contrast-*` tables.
- Typography & layout primitives: `--base-font-family: system-ui, sans-serif`, `--heading-font-family: Bahnschrift, 'DIN Alternate', 'Franklin Gothic Medium', 'Nimbus Sans Narrow', sans-serif-condensed, sans-serif`, `--text-scaling: 1.067`, `--radius-base: 0.375rem`, `--radius-container: 0.75rem`, `--default-border-width: 1px`, `--default-ring-width: 1px`.

**Semantic aliases (Tier 2, in `theme.css @theme`):**

- `--font-sans: var(--base-font-family)`, `--font-heading: var(--heading-font-family)`.
- `html { font-size: calc(100% * var(--text-scaling)); }` and `h1–h6 { font-family: var(--font-heading); }` in `@layer base`.
- `--radius-md: var(--radius-base)`, `--radius-lg: var(--radius-container)` (Tailwind’s `rounded-md` / `rounded-lg` are rebound).
- Light defaults + `.dark` overrides for: `background`, `foreground`, `primary` + `-foreground`, `secondary` + `-foreground`, `muted` + `-foreground`, `border`, `accent` + `-foreground`, `destructive` + `-foreground`, `ring`.

**Critical naming split (do not get this wrong):**

- Skeleton **`secondary-*`** family = **cobalt** → bound to our **`accent`** token.
- Our **`secondary`** token = **subtle surface** (`surface-200` light / `surface-800` dark), used for muted buttons/surfaces.
- Therefore: `bg-accent` = cobalt CTA / link / focus; `bg-secondary` = de-emphasized surface.
- This is the #1 trap for the refactor.

**Body vs heading + scaling:**

- Body: `system-ui, sans-serif` via `--font-sans`.
- Headings (`h1–h6`): Bahnschrift / DIN Alternate / condensed stack via `--font-heading`.
- Global rem multiplied by `1.067` so all `text-*` utilities scale once.

---

## D. Semantic token set — implemented vs proposed

### D.1 Implemented today in `theme.css` (Tier 2, available as Tailwind utilities)

Light + dark variants exist for each:

`background`, `foreground`, `primary` + `primary-foreground`, `secondary` + `secondary-foreground`, `muted` + `muted-foreground`, `border`, `accent` + `accent-foreground`, `destructive` + `destructive-foreground`, `ring`.

Plus: `--radius-md`, `--radius-lg`, `--spacing-xs/sm/md/lg/xl` (note: `--spacing: 0.25rem` is the Tailwind base step; the `xs..xl` aliases are additive).

### D.2 Proposed by `bm-semantic-tokens-proposal.md` but **NOT yet in `theme.css`**

Treat these as the “next-wave” backlog. None are currently usable as `bg-*` / `text-*` classes:

- Surfaces: `card` + `card-foreground`, `popover` + `popover-foreground`, `overlay`.
- Text levels: `subtle-foreground` (optional; only if a third level proves necessary).
- Status quad: `success`, `warning`, `info` (each with `-foreground`, `-soft`, `-border`); `destructive-soft`/`-border`; `accent-soft`/`-border`.
- Interaction: `input` (single token — the **border** color, shadcn convention; matches existing `bm-ui` `border-input` usage). `ring` already exists.
- Brand: `community` + `community-foreground` (+ `-soft`/`-border`) mapped to Skeleton `tertiary-*` (violet).
- Domain (prediction-specific): `price-up`, `price-down`, `price-neutral`, `live-indicator`, `selected`.
- Outcome categorical series: `outcome-1 … outcome-6` (each may need `-foreground`, `-soft`, `-border`, plus chart `stroke-outcome-N` / `fill-outcome-N`).
- Chart structure: `chart-grid`, `chart-axis`, `chart-axis-label`, `chart-tooltip-bg`, `chart-cursor`, `chart-area-opacity`.
- Optional typography roles: `text-body-xs`, `text-body-sm`, `text-heading-lg`, … (only if `text-sm` / `text-base` proves insufficient).

### D.3 Minimum viable Tier-2 (first-pass parity with the proposal)

Add only what the first vertical slice actually consumes:

`card`, `popover`, `input` (border), plus a starter `outcome-1..4`. Everything else (`success` / `warning` / `info` quads, `community`, `selected`, `price-*`, `chart-*`) lands as the next wave, driven by what the next migrated components actually need. Locked values: [`tokens-and-rules.lock.md`](./tokens-and-rules.lock.md).

---

## E. Migration playbook (clean-branch order)

1. **Docs-only commit** on the clean branch (this folder). Lock the source-of-truth ranking; seed `PROMPTS.md`. No code changes.
2. **CSS hygiene & wiring audit** (read-only). Verify on:
   - `apps/frontend-c1/src/routes/layout.css`: `@import 'tailwindcss';`, `@import '@bigmarket/bm-design/theme.css';`, every `@source` path resolves, `@custom-variant dark (&:where(.dark, .dark *))` present, forms+typography plugins loaded.
   - `packages/bm-design/src/theme.css`: imports `./vendor/skeleton-nouveau.css`; no duplicate `@theme` blocks; semantic aliases + `.dark` overrides present; `--font-sans` / `--font-heading` reference vendor vars.
   - `packages/bm-design/package.json` `exports` still exposes `./theme.css`.
   - Dark mode toggling: app must add/remove `.dark` on a root element (verify exists; out of scope to *change* behavior).
3. **Token foundation extension** (paired commits to `theme.css` + `tokens.ts`):
   - Add the “min viable” set from §D.3.
   - Add `.dark` counterparts for each.
   - Add to `tokens.ts` with the same keys.
4. **One vertical slice — app shell / header** (the “proof”): rebuild `+layout.svelte` chrome (splash, header wrapper, footer border, alpha banner) using only Tier 2 tokens. Validates the whole pipeline end-to-end before scaling.
5. **Component-by-component sweep** in `packages/bm-ui` and feature packages (`bm-market-homepage`, `bm-market`, `bm-create-market`, `sip18-forum`). For each: read → evaluate → update (markup, semantic classes, states, dark parity, focus rings). No behavior changes.
6. **Second token wave** driven by greps from the sweep (status quads, `community`, `selected`, `price-*`, `chart-*`).
7. **Polish & lint guard**: optional CI grep banning Tier-1 tokens outside `packages/bm-design`.

**Grep / search checklist (Svelte and CSS in feature packages):**

```bash
# Tier-1 palette leakage in feature code (must be 0 after migration)
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

# DaisyUI residue (must stay 0; CLAUDE.md says "Do not reintroduce DaisyUI")
rg -n "(btn-primary|card-body|drawer-side|navbar|menu-title)\b" apps packages
```

---

## F. Gaps, contradictions, risks

1. **`tokens.ts` is drifted vs `theme.css`.** It exposes `primary/secondary/muted/accent/destructive/border/background/foreground/ring` only, with **hardcoded OKLCH literals**, no `card/popover/muted-foreground/primary-foreground/secondary-foreground/destructive-foreground/accent-foreground`, no dark variants, and different `radius` keys (`sm/md/lg/xl` numeric px instead of `base/container`). Any chart/inline-style consumer reads stale or partial data. The contract says they must move in lock-step. **Risk: silent visual drift in charts/inline styles.**
2. **The Croatian language in the original `styling-contract.md`.** New canonical version is English-only here. The legacy file in `docs/design/` remains as history.
3. **`polymarket-ui-audit.md` is a method, not a result.** The summary tables are empty. There is no measured Polymarket baseline in repo. Refactor decisions lean on Skeleton `nouveau` + judgment until that audit is filled in.
4. **`+layout.svelte` still uses Tier-1 utilities** (`bg-gray-50/900`, `text-gray-500`, `border-purple-600/20`, `text-orange-800`). This is exactly the slice step 4 in §E must migrate.
5. **Naming collision risk: `bg-secondary` vs Skeleton’s `secondary` (cobalt).** Implementation is correct, but must be a top-of-file warning in `styling-contract.md` and `PROMPTS.md`.
6. **Missing tokens vs proposal** (status quad, `success/warning/info`, `community`, `selected`, `price-*`, `outcome-*`, `chart-*`, `input`, `overlay`). Backlog only; no day-one blocker.
7. **ESLint examples that assume JSX — Unknown.** No ESLint config has been read. The contract talks about “custom lint / grep in CI” aspirationally. *Required file to decide*: an `eslint.config.*` and a list of intended rules.
8. **`bm-design` `exports` only `./theme.css` and `.`** — no `./tokens` named export. Today `import { tokens } from '@bigmarket/bm-design'` works via `index.ts`. Open decision: stable `./tokens` export?
9. **CSS for shell-level dark toggling.** `layout.css` declares the `dark` variant but `+layout.svelte` does not toggle `.dark`. Whatever does is outside the read scope. Flag as a read-only verification step.
10. **`docs/technical/08_ui_element_analysis.md`** referenced from `CLAUDE.md` as a per-page checklist — not read. If a component sweep needs status tracking, that file may already host it.

**Open decisions to resolve before broad rollout:**

- Lock in or remove `subtle-foreground` (third text level).
- Decide whether outcome series caps at 6 with named tokens vs algorithmic generation past 6.
- Decide whether to introduce typography role tokens (`text-body-sm`, `text-heading-lg`) or keep `text-sm` / `text-base`.
- Decide light/dark policy for `*-soft` opacity (proposal says “light/dark may use different alpha logic” without fixing values).

---

## G. First commit on the clean branch — recommendation

**Commit #1 = docs only.** Rationale:

- The vendor file (`packages/bm-design/src/vendor/skeleton-nouveau.css`) and `theme.css` aliasing are already wired and working. Touching them in the first commit conflates docs hygiene with a visual change.
- The fastest unblock is establishing the canonical sources of truth, the `PROMPTS.md` sequence, and the “do not change behavior” guardrails — so every subsequent code commit is small and reviewable.
- `tokens.ts` drift is a real risk but is a code commit (commit #2 or later), not docs.

**Contents of commit #1 (this folder):**

1. `docs-v2/sources-of-truth.md` — this report.
2. `docs-v2/README.md` — entry point + single-source rule.
3. `docs-v2/PROMPTS.md` — executable refactor checklist.
4. `docs-v2/design/styling-contract.md` — English version of the contract, with Skeleton-secondary ↔ accent warning at the top.
5. `docs-v2/design/bm-semantic-tokens-proposal.md` — implemented vs next-wave annotated.
6. `docs-v2/design/skeleton-theme-nouveau.md` — English version.
7. `docs-v2/design/polymarket-ui-audit.md` — English method.
8. `docs-v2/ui-system.md` — architecture boundaries.
9. `docs-v2/design/README.md` — design subpack index.

**Suggested commit message (Conventional Commits, English):**

```text
docs(design): introduce docs-v2 canonical pack for phantom-wallet refactor

- Add sources-of-truth evaluation (A–G) with implemented vs next-wave tokens.
- Add English styling-contract with Skeleton-secondary ↔ accent warning callout.
- Annotate bm-semantic-tokens-proposal with implementation status.
- Add PROMPTS.md with dependency-ordered refactor steps and behavior-preservation guardrails.
- Keep legacy docs/design/ in place as history; docs-v2 is canonical going forward.
```
