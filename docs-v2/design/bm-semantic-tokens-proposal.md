# BigMarket — semantic tokens proposal

**Goal:** extend the existing tokens (`primary`, `secondary`, `muted`, `border`, `background` in `tokens.ts` / `theme.css`) into a **fuller role set** without duplicating the whole Tailwind scale. Names are **roles**, not colors; values come from primitives (see [`skeleton-theme-nouveau.md`](./skeleton-theme-nouveau.md)).

> Each row is annotated **Implemented** (already wired in `packages/bm-design/src/theme.css`) or **Next wave** (proposed but not yet wired). The contract requires every semantic value change in both `theme.css` and `tokens.ts`.

## Context (why)

- In product code we frequently see **primitives** (`gray-*`, `zinc-*`) and **arbitrary text sizes** — hard to maintain and hard to dark-mode.
- **Multi-outcome scalar markets** need **one** categorical color set used by badges, cards, and chart lines.
- The **trading UI** must distinguish: Yes/No, **price direction**, status (live), and **selection** (ring) without disappearing visually.

## Already in place (keep)

| Key | Role | Status |
|------|------|--------|
| `primary` / `primary-foreground` | Main accent (CTA, strong emphasis) | **Implemented** |
| `secondary` / `secondary-foreground` | Subtle secondary surface / alt button (NOT cobalt — see top warning in styling-contract) | **Implemented** |
| `muted` / `muted-foreground` | Sunken background, secondary text | **Implemented** |
| `border` | Default borders | **Implemented** |
| `background` / `foreground` | Page background and default text | **Implemented** |
| `accent` / `accent-foreground` | Cobalt — link, info accent, focus | **Implemented** (mapped to Skeleton `secondary-*`) |
| `destructive` / `destructive-foreground` | Errors, destructive actions | **Implemented** |
| `ring` | Focus ring | **Implemented** |

## Aligning with Tailwind / shadcn surfaces

In implementation we use **shadcn names** already in the ecosystem:

| Concept from early proposal | Typical in `@theme` | Purpose | Status |
|----------------------------|---------------------|---------|--------|
| One level above the page | `card` / `card-foreground` | Cards, panels, main content containers | **Next wave** |
| Above the card (floating) | `popover` / `popover-foreground` | Tooltip, dropdown, contextual layer | **Next wave** |
| “Elevated” inside a sunken region | `card` inside `muted` | Active pill tab on a gray strip | composition (no token) |
| Sunken / well | `muted` | Fields inside a card, filter bar | **Implemented** |
| Modal background | `overlay` (to be introduced) | Dimming behind a dialog | **Next wave** |

`header` / `nav-active` / `nav-inactive` are introduced **only if** a dedicated role really improves consistency; usually `foreground` + `muted-foreground` + `accent` for the active link is enough.

## Proposed extension — text

| Token | Purpose | Status |
|------|---------|--------|
| `foreground` | Default text on `background` | **Implemented** |
| `muted-foreground` | Meta, secondary text | **Implemented** |
| `subtle-foreground` | Caption, small footer — **only if** a third level is needed | **Next wave (optional)** |

*(If `muted-foreground` covers all “secondary”, omit `subtle-foreground` until the first visual proof.)*

## Proposed extension — accent and signal

| Token | Purpose | Status |
|------|---------|--------|
| `accent` / `accent-foreground` | Link, info accent, “live” highlight (maps to brand `secondary` where it fits) | **Implemented** |
| `success` / `success-foreground` | Positive outcome, “Yes” | **Next wave** |
| `warning` / `warning-foreground` | Warning, risk | **Next wave** |
| `destructive` / `destructive-foreground` | Delete, error, “No” | **Implemented** |
| `info` / `info-foreground` | Informational message (often aliased to the secondary tone) | **Next wave** |

### Quad pattern for status roles

For **`success`**, **`warning`**, **`destructive`**, **`info`**, **`accent`** (where a badge/pill is needed):

| Suffix | Purpose | Status |
|--------|---------|--------|
| `*` (DEFAULT) | Solid surface / icon | varies (see above) |
| `*-foreground` | Text on the solid surface | varies |
| `*-soft` | Soft tint background (light/dark may use different alpha logic) | **Next wave** |
| `*-border` | Badge / card border | **Next wave** |

## Proposed extension — interaction

| Token | Purpose | Status |
|------|---------|--------|
| `ring` | Focus ring (accessibility) | **Implemented** |
| `input` | Input background | **Next wave** |
| `input-border` | Input border | **Next wave** |

## Proposed extension — brand / community

The `nouveau` palette has **`secondary`** (cobalt) and **`tertiary`** (violet). We propose:

| Token | Purpose | Status |
|------|---------|--------|
| `accent` | Inline link, “live”, KPI highlight → typically **secondary** (cobalt) | **Implemented** |
| `community` / `community-foreground` (+ optional `-soft`, `-border`) | Governance, Karma, violet banners → **tertiary** | **Next wave** |

`destructive` in code = Tailwind convention; in the CSS layer the primitive may remain `error-*` — what matters is one semantic name at the consumption site.

## Prediction domain (must be separate from status)

| Token | Purpose | Note | Status |
|------|---------|------|--------|
| `price-up` | Price increased | May alias `success`; **the name stays** | **Next wave** |
| `price-down` | Price decreased | May share a value with `destructive`; **not** “error” | **Next wave** |
| `price-neutral` | No direction / flat | Often aliased to `muted-foreground` | **Next wave** |
| `live-indicator` | “Live” (if separate from `accent`) | May alias `success` | **Next wave** |
| `selected` | Card / item selection ring | Typically contrasts with `primary` on a colored card (e.g. cobalt) | **Next wave** |

## Outcome series (categorical, not Yes/No)

For scalar markets with several ranges: **`outcome-1` … `outcome-6`** (minimum set). Each slot gets `*-foreground`, `*-soft`, `*-border` as needed, plus chart usage (`stroke-outcome-N`, `fill-outcome-N`).

| Slot | Mapping guideline | Status |
|------|------------------|--------|
| `outcome-1` | Warm / first series — e.g. `warning` | **Next wave** |
| `outcome-2` | Green series — e.g. `success` | **Next wave** |
| `outcome-3` | Cobalt — `secondary` (Skeleton) | **Next wave** |
| `outcome-4` | Violet — `tertiary` (Skeleton) | **Next wave** |
| `outcome-5` | Brand yellow-gold — `primary` | **Next wave** |
| `outcome-6` | Additional hue (e.g. cyan) if the palette lacks one | **Next wave** |

For **7+** outcomes: generate colors in component/util; we do not need to name a token beyond 6 in the first wave.

## Chart structure (independent of series)

Tokens for grid, axes, tooltip, cursor — so charts do not introduce one-off hex values:

| Token | Purpose | Status |
|------|---------|--------|
| `chart-grid` | Grid lines | **Next wave** |
| `chart-axis` | Axis | **Next wave** |
| `chart-axis-label` | Axis label | **Next wave** |
| `chart-tooltip-bg` | Tooltip background (often = `popover`) | **Next wave** |
| `chart-cursor` | Vertical / crosshair | **Next wave** |
| `chart-area-opacity` | Numeric constant in the theme (light/dark may differ) | **Next wave** |

Implementation of charts: **library of choice** (e.g. Svelte-friendly); what matters is that colors come from CSS variables / `tokens.ts`.

## Typography (optional in `@theme`)

| Approach | Purpose | Status |
|---------|---------|--------|
| Keep `text-sm` / `text-base` … | Fast, already familiar | **Implemented** (Tailwind defaults + nouveau `--text-scaling`) |
| Introduce roles `text-body-xs`, `text-body-sm`, `text-heading-lg`, … | Aligned with reference prediction UI; reduces `text-[11px]` | **Next wave (optional)** |

## Implementation order (recommendation)

1. In `tokens.ts` under `colors` add **only** what the first pass actually uses (e.g. `card`, `popover`, `input`, `input-border`, a starter `outcome-1..4`).
2. Mirror in `theme.css` inside `@theme { }`.
3. In `.dark` define **dark** values for the same keys.
4. Migrate **one vertical** (e.g. header + one page) before scaling to the whole app.
5. Second wave: **evidence-driven** — a grep for primitives and arbitrary classes shows what to name next.

## Note

You do not need 30 semantic colors at the start — **fewer names, more consistent usage** is better than a large table no one follows. Detailed naming and consumption rules: [`styling-contract.md`](./styling-contract.md).
