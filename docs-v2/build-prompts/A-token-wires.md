# Build Prompt A — Token wires (Cursor Auto / Composer)

**Use this for:** wiring all Wave 1 + minimum Wave 2 + domain + outcome tokens needed by Build Prompts B (homepage) and C (market detail).

**Recommended model:** Cursor Auto or Composer (mechanical work; values are spelled out).

**Estimated time:** 20–30 minutes including verification.

**Paste everything below this line into a fresh agent session.**

---

## Guardrails (do not break)

```text
DO NOT change behavior.

Allowed files (and only these):
- packages/bm-design/src/theme.css
- packages/bm-design/src/tokens.ts
- apps/frontend-c1/src/routes/layout.css   (ONLY to add the reduced-motion @media block at the bottom)

Forbidden:
- Any edit outside the three files above.
- Any logic edit. No .ts business logic. No <script> bodies.
- No new dependencies.
- No DaisyUI utilities reintroduced.

Output: three file diffs (theme.css + tokens.ts + layout.css). All three are required — the reduced-motion guard in layout.css is part of the lock-file a11y rule, not optional. No prose response beyond a 5-bullet PR summary at the end.

If a value below is ambiguous, STOP and ask. Do not guess.
```

---

## Required reading (read fully before editing)

1. `docs-v2/tokens-and-rules.lock.md` — the source of all values you will land.
2. `packages/bm-design/src/theme.css` — current state; especially lines 445–500 (existing semantic aliases + `.dark` block).
3. `packages/bm-design/src/tokens.ts` — current state; full file (~65 lines).
4. `packages/bm-design/src/vendor/skeleton-nouveau.css` — search for `--color-surface-`, `--color-success-`, `--color-warning-`, `--color-error-`, `--color-secondary-`, `--color-tertiary-`, `--color-primary-` (these primitives must exist; verify before aliasing).

Do NOT read anything else. Do NOT open feature-package Svelte files.

---

## Task 1 — Extend `packages/bm-design/src/theme.css`

**File anatomy you must match (read before editing):**
- `@theme { ... }` block starts at line 8, closes at line 468. Light semantic aliases live here. **Existing values like `--color-background`, `--color-primary`, `--radius-md`, `--radius-lg` are already defined** — do not duplicate.
- `@layer base { ... }` block starts at line 470, closes at line 501. Inside it sits the existing `.dark { ... }` selector (lines 485–500). Dark overrides live there. **Extend the existing `.dark { }`** — do NOT create a new top-level `.dark { }`.

Inside the existing `@theme { ... }` block, **add the following lines** at the end of the BigMarket semantic palette section (right before the closing `}` of `@theme` at line 468):

```css
	/* Surfaces (Wave 1) */
	--color-card: var(--color-surface-50);
	--color-card-foreground: var(--color-surface-950);
	--color-popover: #fff;
	--color-popover-foreground: var(--color-surface-950);
	/* `--color-input` is the BORDER color (shadcn convention; bm-ui already uses `border-input`). */
	--color-input: var(--color-surface-200);
	--color-overlay: rgba(0, 0, 0, 0.4);

	/* Status quad — additions to existing pairs */
	--color-success: var(--color-success-500);
	--color-success-foreground: var(--color-success-contrast-500);
	--color-success-soft: color-mix(in oklab, var(--color-success-500) 12%, transparent);
	--color-success-border: var(--color-success-300);
	--color-warning: var(--color-warning-500);
	--color-warning-foreground: var(--color-warning-contrast-500);
	--color-warning-soft: color-mix(in oklab, var(--color-warning-500) 12%, transparent);
	--color-warning-border: var(--color-warning-300);
	--color-info: var(--color-secondary-500);
	--color-info-foreground: var(--color-secondary-contrast-500);
	--color-info-soft: color-mix(in oklab, var(--color-secondary-500) 12%, transparent);
	--color-info-border: var(--color-secondary-300);
	--color-destructive-soft: color-mix(in oklab, var(--color-error-500) 12%, transparent);
	--color-destructive-border: var(--color-error-300);
	--color-accent-soft: color-mix(in oklab, var(--color-secondary-500) 12%, transparent);
	--color-accent-border: var(--color-secondary-300);

	/* Community (Skeleton tertiary = violet) */
	--color-community: var(--color-tertiary-500);
	--color-community-foreground: var(--color-tertiary-contrast-500);
	--color-community-soft: color-mix(in oklab, var(--color-tertiary-500) 12%, transparent);
	--color-community-border: var(--color-tertiary-300);

	/* Prediction domain */
	--color-price-up: var(--color-success-500);
	--color-price-up-foreground: var(--color-success-contrast-500);
	--color-price-up-soft: color-mix(in oklab, var(--color-success-500) 12%, transparent);
	--color-price-down: var(--color-error-500);
	--color-price-down-foreground: var(--color-error-contrast-500);
	--color-price-down-soft: color-mix(in oklab, var(--color-error-500) 12%, transparent);
	--color-price-neutral: var(--color-surface-700);
	--color-live-indicator: var(--color-error-500);
	--color-selected: var(--color-secondary-500);

	/* Outcome starter 1..4 */
	--color-outcome-1: var(--color-warning-500);
	--color-outcome-2: var(--color-success-500);
	--color-outcome-3: var(--color-secondary-500);
	--color-outcome-4: var(--color-tertiary-500);
```

Inside the existing `.dark { ... }` selector (which lives **inside** the `@layer base { ... }` block starting at line 485 of `theme.css`), **add at the end** (right before the closing `}` of `.dark`):

```css
		/* Surfaces (Wave 1) — dark */
		--color-card: var(--color-surface-900);
		--color-card-foreground: var(--color-surface-50);
		--color-popover: var(--color-surface-900);
		--color-popover-foreground: var(--color-surface-50);
		--color-input: var(--color-surface-800);
		--color-overlay: rgba(0, 0, 0, 0.65);

		/* Status quad — dark */
		--color-success: var(--color-success-400);
		--color-success-foreground: var(--color-success-contrast-400);
		--color-success-soft: color-mix(in oklab, var(--color-success-400) 18%, transparent);
		--color-success-border: var(--color-success-700);
		--color-warning: var(--color-warning-400);
		--color-warning-foreground: var(--color-warning-contrast-400);
		--color-warning-soft: color-mix(in oklab, var(--color-warning-400) 18%, transparent);
		--color-warning-border: var(--color-warning-700);
		--color-info: var(--color-secondary-400);
		--color-info-foreground: var(--color-secondary-contrast-400);
		--color-info-soft: color-mix(in oklab, var(--color-secondary-400) 18%, transparent);
		--color-info-border: var(--color-secondary-700);
		--color-destructive-soft: color-mix(in oklab, var(--color-error-400) 18%, transparent);
		--color-destructive-border: var(--color-error-700);
		--color-accent-soft: color-mix(in oklab, var(--color-secondary-400) 18%, transparent);
		--color-accent-border: var(--color-secondary-700);

		/* Community — dark */
		--color-community: var(--color-tertiary-400);
		--color-community-foreground: var(--color-tertiary-contrast-400);
		--color-community-soft: color-mix(in oklab, var(--color-tertiary-400) 18%, transparent);
		--color-community-border: var(--color-tertiary-700);

		/* Prediction domain — dark */
		--color-price-up: var(--color-success-400);
		--color-price-up-foreground: var(--color-success-contrast-400);
		--color-price-up-soft: color-mix(in oklab, var(--color-success-400) 18%, transparent);
		--color-price-down: var(--color-error-400);
		--color-price-down-foreground: var(--color-error-contrast-400);
		--color-price-down-soft: color-mix(in oklab, var(--color-error-400) 18%, transparent);
		--color-price-neutral: var(--color-surface-300);
		--color-live-indicator: var(--color-error-400);
		--color-selected: var(--color-secondary-400);

		/* Outcome starter 1..4 — dark */
		--color-outcome-1: var(--color-warning-400);
		--color-outcome-2: var(--color-success-400);
		--color-outcome-3: var(--color-secondary-400);
		--color-outcome-4: var(--color-tertiary-400);
```

---

## Task 2 — Update `packages/bm-design/src/tokens.ts`

Restructure the file to mirror `theme.css`. **Replace the existing `tokens` export** with a `light` + `dark` shape. Use the **same Skeleton primitive references** (resolved at build time via the values in `vendor/skeleton-nouveau.css`); if you cannot resolve the OKLCH values, use the CSS-var name `'var(--color-surface-50)'` as the string — JS consumers (charts) read these via `getComputedStyle` anyway.

Use this exact shape:

```ts
/**
 * TypeScript design tokens — mirror of `theme.css`. Runtime truth is `theme.css`.
 * Update both together. See `docs-v2/tokens-and-rules.lock.md`.
 */
export const tokens = {
  light: {
    colors: {
      background: 'var(--color-surface-50)',
      foreground: 'var(--color-surface-950)',
      card: 'var(--color-surface-50)',
      cardForeground: 'var(--color-surface-950)',
      popover: '#fff',
      popoverForeground: 'var(--color-surface-950)',
      muted: 'var(--color-surface-100)',
      mutedForeground: 'var(--color-surface-700)',
      border: 'var(--color-surface-200)',
      /** Input BORDER color (shadcn convention). */
      input: 'var(--color-surface-200)',
      overlay: 'rgba(0, 0, 0, 0.4)',
      primary: 'var(--color-primary-500)',
      primaryForeground: 'var(--color-primary-contrast-500)',
      secondary: 'var(--color-surface-200)',
      secondaryForeground: 'var(--color-surface-900)',
      accent: 'var(--color-secondary-500)',
      accentForeground: 'var(--color-secondary-contrast-500)',
      destructive: 'var(--color-error-500)',
      destructiveForeground: 'var(--color-error-contrast-500)',
      success: 'var(--color-success-500)',
      warning: 'var(--color-warning-500)',
      info: 'var(--color-secondary-500)',
      community: 'var(--color-tertiary-500)',
      priceUp: 'var(--color-success-500)',
      priceDown: 'var(--color-error-500)',
      priceNeutral: 'var(--color-surface-700)',
      liveIndicator: 'var(--color-error-500)',
      selected: 'var(--color-secondary-500)',
      outcome1: 'var(--color-warning-500)',
      outcome2: 'var(--color-success-500)',
      outcome3: 'var(--color-secondary-500)',
      outcome4: 'var(--color-tertiary-500)',
      ring: 'var(--color-secondary-400)',
    },
  },
  dark: {
    colors: {
      background: 'var(--color-surface-950)',
      foreground: 'var(--color-surface-50)',
      card: 'var(--color-surface-900)',
      cardForeground: 'var(--color-surface-50)',
      popover: 'var(--color-surface-900)',
      popoverForeground: 'var(--color-surface-50)',
      muted: 'var(--color-surface-900)',
      mutedForeground: 'var(--color-surface-300)',
      border: 'var(--color-surface-800)',
      /** Input BORDER color (shadcn convention). */
      input: 'var(--color-surface-800)',
      overlay: 'rgba(0, 0, 0, 0.65)',
      primary: 'var(--color-primary-400)',
      primaryForeground: 'var(--color-primary-contrast-400)',
      secondary: 'var(--color-surface-800)',
      secondaryForeground: 'var(--color-surface-50)',
      accent: 'var(--color-secondary-400)',
      accentForeground: 'var(--color-secondary-contrast-400)',
      destructive: 'var(--color-error-400)',
      destructiveForeground: 'var(--color-error-contrast-400)',
      success: 'var(--color-success-400)',
      warning: 'var(--color-warning-400)',
      info: 'var(--color-secondary-400)',
      community: 'var(--color-tertiary-400)',
      priceUp: 'var(--color-success-400)',
      priceDown: 'var(--color-error-400)',
      priceNeutral: 'var(--color-surface-300)',
      liveIndicator: 'var(--color-error-400)',
      selected: 'var(--color-secondary-400)',
      outcome1: 'var(--color-warning-400)',
      outcome2: 'var(--color-success-400)',
      outcome3: 'var(--color-secondary-400)',
      outcome4: 'var(--color-tertiary-400)',
      ring: 'var(--color-secondary-300)',
    },
  },
  radius: {
    sm: 'var(--radius-base)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-container)',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  typography: {
    fontFamily: {
      sans: 'system-ui, sans-serif',
      heading:
        "Bahnschrift, 'DIN Alternate', 'Franklin Gothic Medium', 'Nimbus Sans Narrow', sans-serif-condensed, sans-serif",
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '24px',
    },
  },
} as const;
```

**Pre-verified by docs author:** A repo-wide grep for `tokens.colors`, `tokens.spacing`, `tokens.radius`, `tokens.typography`, and `from '@bigmarket/bm-design'` returned **zero hits** in `apps/` and `packages/` (only docs reference these names). Restructuring the shape is therefore safe — no consumer code will break. If a typecheck error surfaces anyway, STOP and report it.

---

## Task 3 — Add reduced-motion guard to `apps/frontend-c1/src/routes/layout.css`

**File anatomy you must match:** the existing `body { @apply ... }` rule lives **inside** an `@layer base { ... }` block. Adding the media query inside that layer would let `@layer` cascade ordering demote the `!important` declarations under any non-layered author CSS. **Append the new block AFTER the closing `}` of `@layer base { }`**, at file root (zero indentation), so the rule is unlayered and the `!important`s behave as written.

End-state of `layout.css` (illustrative — the only new section is the trailing `@media` block):

```css
@import 'tailwindcss';
@import '@bigmarket/bm-design/theme.css';
/* …existing @source / @custom-variant / @plugin lines… */

@layer base {
	html { min-height: 100dvh; }
	body {
		@apply m-0 min-h-dvh bg-background text-foreground antialiased;
		font-family: var(--font-sans);
	}
}

/* NEW — unlayered, so !important is not demoted by cascade-layer ordering. */
@media (prefers-reduced-motion: reduce) {
	*,
	*::before,
	*::after {
		animation-duration: 0.01ms !important;
		animation-iteration-count: 1 !important;
		transition-duration: 0.01ms !important;
		scroll-behavior: auto !important;
	}
}
```

Nothing else in this file changes.

---

## Verification (run these and confirm in your PR summary)

```bash
# Svelte / TS check (bm-design has no scripts of its own; frontend-c1's `check` covers it via imports).
pnpm --filter @bigmarket/frontend-c1 check

# Tailwind must still build (will fail if we typo'd a primitive).
pnpm --filter @bigmarket/frontend-c1 build  || true   # report stderr only

# Grep verifies new utilities are generated (run AFTER a dev build).
# (Optional — agent does not have to run this; for human reviewer.)
```

Then start `pnpm dev` and verify (visually, 30 s):

1. Header and footer look unchanged (we only added tokens; nothing consumed them yet).
2. Open DevTools, inspect `<html>`, switch class to `.dark`. The computed value of `--color-card` should resolve to a dark surface color.
3. **bm-ui inputs / popovers / selects still render visible borders** in both themes (this is the regression `--color-input = surface-200/-800` exists to prevent). Quickly: open any page with an `<Input>`, `<Select>`, or `<Popover>` — borders must be visible in light AND dark.
4. macOS / OS-level "reduce motion" toggled on → no animation runs.

---

## PR summary template (the only prose output)

```
Token wires (Wave 1 + minimum Wave 2 + domain + outcome 1..4)

- theme.css: +N new semantic aliases in @theme + .dark (cite token-count)
- tokens.ts: restructured to {light, dark} mirror; same keys as theme.css
- layout.css: added prefers-reduced-motion guard
- Typecheck: ok | Build: ok | Visual: chrome unchanged in light + dark
- No feature code touched. PROMPTS.md Steps 3 + 5 (subsets) landed.
```

---

## What this prompt does NOT do

- Does not migrate any feature component. That is Build Prompts B and C.
- Does not add formatter helpers. The homepage prompt may add `format-extras.ts` if needed.
- Does not introduce chart-structure tokens (`chart-grid`, etc.). Deferred to Wave 3.
- Does not change `bm-ui` components. They will pick up the new tokens automatically.
