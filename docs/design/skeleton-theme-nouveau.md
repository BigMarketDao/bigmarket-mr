# Skeleton theme `nouveau` — vizualni cilj za BigMarket

**Cilj:** Krajnji izgled (boje, kontrasti, tipografija, bazni radius, globalni `text-scaling`) usklađen s **Skeleton Labs** temom **`nouveau`**, bez obveze da API imena u kodu kopiraju Skeleton.

## Gdje je što u repou

| Što | Put |
|-----|-----|
| **Puna paleta** (OKLCH skale 50–950, `*-contrast-*`, `--text-scaling`, font/radius base) | `packages/bm-design/src/vendor/skeleton-nouveau.css` |
| **Tailwind + semantički aliasi** (`bg-background`, `bg-primary`, `bg-accent` = kobalt, dark mode, `h1–h6` font) | `packages/bm-design/src/theme.css` |
| **TS vrijednosti** za charte / inline | `packages/bm-design/src/tokens.ts` |

Vendor datoteka je **sinkronizirana s** `@skeletonlabs/skeleton@4.15.2` (`src/themes/nouveau.css`). Selektor je **` :root`** (umjesto `[data-theme='nouveau']`) da cijela aplikacija dobije istu paletu bez atributa na `<html>`. Kad bumpate Skeleton, **ponovno kopirajte** datoteku iz `node_modules` i zadržite komentar + `:root`.

## Mapiranje koje smo odabrali

- **`bg-primary` / brand CTA** → Skeleton **`primary-*`** (topli žuto-zlatni ton).
- **`bg-accent` / link / fokus prsten** → Skeleton **`secondary-*`** (kobalt) — u Skeletonu se ta obitelj zove "secondary", u našem shadcn-stilu to je **`accent`** da ne miješamo s `bg-secondary` (utopljeni sivi gumb).
- **`bg-secondary`** (prigušeni gumb) → **`surface-200` / `surface-800`** (ne kobalt).
- **Pozadina / tekst / obrubi** → **`surface-*`** + `muted-*` kao u prijedlogu semantike.

## Tipografija

- **Body:** `system-ui, sans-serif` (kao `--base-font-family` u nouveau).
- **Naslovi:** Bahnschrift / condensed stack (`--font-heading`); primijenjeno na `h1–h6` u `@layer base`.
- **Globalni rem:** `html { font-size: calc(100% * var(--text-scaling)); }` gdje je `--text-scaling: 1.067` iz nouveau.

Ako želite **Inter** ili drugi webfont, uvedite ga u `app.html` i postavite `--font-sans` u `theme.css` — to je namjerna odstupanja od čistog nouveau.

## Daljnji koraci

- Komponente koje još koriste `gray-*` / `Inter` zamijeniti **semantičkim** klasama.
- Za detalje imenovanja uloga: [`styling-contract.md`](./styling-contract.md), [`bm-semantic-tokens-proposal.md`](./bm-semantic-tokens-proposal.md).
