# polymarket-research/ — raw reference material

**Purpose.** This folder holds **raw fetched material from polymarket.com plus curated extracts**, used as a measured reference baseline while building BigMarket components. It is **reference only** — it is **not** a token source, **not** a styling contract, and **nothing in `packages/bm-design/`** should `@import` or read from here.

The canonical token source remains `packages/bm-design/src/theme.css` (Skeleton `nouveau` + our semantic aliases). Polymarket is being **studied as a best-case prediction-market reference**, not copied.

## Why this exists

The audit (`docs-v2/audit-report.md` §G) flagged that **`polymarket-ui-audit.md` was a method with empty result tables**. Every component decision was therefore opinion. This folder closes that gap: it gives a measured anchor so claims like "Polymarket uses radius X" or "Polymarket binds Yes to color Y" are checkable, not vibes.

The output you actually want to read is **[`../polymarket-analysis.md`](../polymarket-analysis.md)** — a one-pass synthesis of these files plus the screenshots in `docs/design/assets/polymarket/`.

## Folder layout

```
polymarket-research/
├── README.md             ← this file
├── raw/                  ← unmodified, exactly as fetched (do not edit)
│   ├── homepage.html       — polymarket.com landing page (curl + browser UA)
│   ├── 129l0_69etv-5.css   — main app CSS bundle (74 KB)
│   ├── 0qk-5scao2jkz.css   — Tailwind v4 generated utilities (405 KB)
│   ├── 0.qng--2j6bl8.css   — small chunk
│   └── 0o7s_nivrs1sq.css   — small chunk
└── extracted/            ← curated greps (regenerable from raw/)
    ├── all-css-variables.txt
    ├── shadcn-style-tokens.txt      — shadcn-style aliases (--card, --popover, --input, …)
    ├── brand-and-neutral-scales.txt — --brand-50..900, --neutral-0..950 (light + dark)
    ├── semantic-roles.txt           — --color-badge-*, --color-button-*, --color-text-*, --color-bg-*
    ├── status-color-scales.txt      — --color-green/red/yellow/amber stops (light + dark)
    ├── election-tier-tokens.txt     — --tier-lean-d/r, --tier-likely-d/r, --tier-safe-d/r, --tier-tossup
    ├── typography-radius-spacing.txt
    └── animations.txt               — --animate-* (named keyframes + durations)
```

## How to refresh

The CSS file URLs are content-hashed by Polymarket's Next.js build; they will rotate. To refresh:

```bash
cd docs-v2/design/polymarket-research/raw
rm *.css homepage.html
curl -sSL -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36" \
  -o homepage.html https://polymarket.com/
# Then grep new CSS hrefs from homepage.html and re-fetch them with the same UA.
# Finally re-run the extraction commands documented in ../polymarket-analysis.md §3.
```

## What this folder is **not**

- Not a license to copy Polymarket UI verbatim. We use Skeleton `nouveau` as our visual baseline (see `../skeleton-theme-nouveau.md`) and target a more approachable, less intimidating product (see `../design-philosophy.md`).
- Not authoritative for any BigMarket token. The single source of truth for runtime values is `packages/bm-design/src/theme.css`.
- Not safe to ship: the HTML/CSS here is **third-party copyrighted material**, kept locally for design research only. Do not deploy, redistribute, or import these bundles. If this folder ever needs to be committed to a public mirror, scrub the `raw/` directory first.

## Quick reference (most-cited findings)

These are the headline numbers `../polymarket-analysis.md` discusses in detail. Cite from `extracted/` files in PRs, not from memory.

| Concern | Polymarket value | BigMarket today |
|---|---|---|
| Brand CTA color | `--brand-500: #1452f0` (saturated cobalt blue) | `--color-primary` = Skeleton primary (warm yellow-gold) |
| Card / button base radius | `--radius: 0.7rem` (~11.2px) | `--radius-base: 0.375rem` (6px) |
| Page background (dark) | `--background: #0a0b10` (near-black, slight blue) | `--color-background` = Skeleton `surface-950` |
| Page background (light) | `--background: var(--color-neutral-0)` = `#fff` | `--color-background` = Skeleton `surface-50` |
| Body font | `--font-inter: "Inter"` (webfont) | `system-ui, sans-serif` (no webfont) |
| Heading font | `--font-sauce: "Open Sauce One"` (custom webfont) | `Bahnschrift / DIN Alternate / condensed stack` |
| Yes (binary) | green family (`--color-green-500..600`) | not yet bound to a token; uses ad-hoc green |
| No (binary) | red family (`--color-red-500..600`) | not yet bound to a token; uses ad-hoc red |
| Election tiers | `--tier-lean-d/r`, `--tier-likely-d/r`, `--tier-safe-d/r`, `--tier-tossup` | not modeled |
| Status semantics | `--color-badge-{success,error,info,warning}-bg/text` | not yet wired (audit §A) |

Full citation discipline: when a doc references one of these, link the exact line in `extracted/<file>.txt`.
