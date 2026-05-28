# Skeleton theme `nouveau` — visual target for BigMarket

**Goal:** the final look (colors, contrasts, typography, base radius, global `text-scaling`) is aligned with the **Skeleton Labs** theme **`nouveau`**, without forcing the code-side API names to copy Skeleton’s names.

## Where things live in the repo

| What | Path |
|------|------|
| **Full palette** (OKLCH scales 50–950, `*-contrast-*`, `--text-scaling`, font/radius base) | `packages/bm-design/src/vendor/skeleton-nouveau.css` |
| **Tailwind + semantic aliases** (`bg-background`, `bg-primary`, `bg-accent` = cobalt, dark mode, `h1–h6` font) | `packages/bm-design/src/theme.css` |
| **TS values** for charts / inline use | `packages/bm-design/src/tokens.ts` |

The vendor file is **synchronized with** `@skeletonlabs/skeleton@4.15.2` (`src/themes/nouveau.css`). The selector is **`:root`** (instead of `[data-theme='nouveau']`) so the entire app gets the same palette without any attribute on `<html>`. When you bump Skeleton, **re-copy** the file from `node_modules` and keep the header comment + `:root` selector.

## Mapping we chose

> ⚠️ **Naming collision warning.**
> Skeleton’s **`secondary-*`** family is **cobalt**; we map it to our **`accent`** token.
> Our **`secondary`** token is a **subtle gray surface** (`surface-200` / `surface-800`).
> Therefore: `bg-accent` is cobalt; `bg-secondary` is a sunken surface.

- **`bg-primary` / brand CTA** → Skeleton **`primary-*`** (warm yellow-gold).
- **`bg-accent` / link / focus ring** → Skeleton **`secondary-*`** (cobalt). In Skeleton this family is called “secondary”; in our shadcn-style naming it is **`accent`** so we don’t confuse it with `bg-secondary` (subtle gray button).
- **`bg-secondary`** (de-emphasized button) → **`surface-200` / `surface-800`** (not cobalt).
- **Background / text / borders** → **`surface-*`** + `muted-*` per the semantic proposal.

## Typography

- **Body:** `system-ui, sans-serif` (matches `--base-font-family` in nouveau).
- **Headings:** Bahnschrift / condensed stack (`--font-heading`); applied to `h1–h6` in `@layer base`.
- **Global rem:** `html { font-size: calc(100% * var(--text-scaling)); }` where `--text-scaling: 1.067` is from nouveau.

**Webfont decision (wave 1):** **we do not load a webfont.** The Skeleton condensed-stack fallback (`Bahnschrift` on Windows, `DIN Alternate` on macOS, `Franklin Gothic Medium` on legacy, generic `sans-serif-condensed` elsewhere) is acceptable for v1. If we later commit to **Inter** (body) or **Geist Mono** (numerics) — both visible on Polymarket — we register them in `app.html` and override `--font-sans` / `--font-mono` in `theme.css`. That is a separate ticket, not a refactor side-effect.

## Charts

**Library: ApexCharts** (declared at `packages/bm-market/package.json:32–34` as `apexcharts ^5.3.5` + `svelte-apexcharts ^1.0.2`). All BigMarket chart code uses ApexCharts; we do not introduce a second chart library without an RFC.

Chart code reads colors from **CSS variables** (preferred) or `tokens.ts` (TS fallback for inline / SSR). Never inline hex. Dark-mode flip is via the ApexCharts `theme.mode` option, derived from the current class on `<html>`.

The chart-structure tokens (`chart-grid`, `chart-axis`, `chart-axis-label`, `chart-tooltip-bg`, `chart-cursor`, `chart-area-opacity`, `outcome-1..6`) land together in `PROMPTS.md` Step 8. Until then, chart code consuming ad-hoc hex (e.g. `packages/bm-market/src/lib/market/version2/do-charts/StakeChart.svelte:68`) is documented technical debt — not a license to add more.

## Next steps

- Replace components that still use `gray-*` / `Inter` with **semantic** classes.
- For role naming details: [`styling-contract.md`](./styling-contract.md), [`bm-semantic-tokens-proposal.md`](./bm-semantic-tokens-proposal.md).
- For the why-Nouveau-not-cobalt rationale: [`design-philosophy.md`](./design-philosophy.md).
- For measured Polymarket values (radius, font stack, brand cobalt, tier tokens we explicitly skip): [`polymarket-analysis.md`](./polymarket-analysis.md).
