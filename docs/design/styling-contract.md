# Styling contract (BigMarket)

**Purpose:** Jedan dogovor za uvođenje i održavanje stilova tako da se tim i AI ne raspu po primitivnim Tailwind klasama bez semantike.

## 1. Izvori istine

| Što | Gdje |
|-----|------|
| Semantičke boje, spacing, radius u CSS (Tailwind `@theme`) | `packages/bm-design/src/theme.css` |
| Iste vrijednosti za TS (charti, inline stilovi) | `packages/bm-design/src/tokens.ts` |
| Ulaz Tailwinda u app | `apps/frontend-c1/src/routes/layout.css` (`@import` bm-design, `@source` paketi) |
| Komponente bez logike | `packages/bm-ui` (presentation-only) |

**Pravilo:** Svaka promjena semantičke vrijednosti ide **paralelno** u `tokens.ts` **i** `theme.css` (dok ne automatiziramo).

## 2. Hijerarhija klasa

1. **Semantički token** (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, …) — **default** za product UI.
2. **Primitivna Tailwind skala** (`zinc-600`, `orange-500`) — samo kad **nema** odgovarajućeg tokena ili za jednokratnu ilustraciju; tada razmotriti **novi** semantički ključ.
3. **Hex / rgb u komponenti** — izbjegavati; iznimno uz komentar zašto.

## 3. Tamni način

Semantika mora imati smislen **dark** par (u `@layer base` / `.dark` ili kroz `dark:` na utilityjima — jedan dosljedan pristup po površini).

## 4. Paketi i naslijeđe

- **`sip18-forum`:** Nema DaisyUI; koristi Tailwind utilityje. I dalje može sadržavati **starije** kombinacije boja — cilj je postupno uskladiti s `bm-design` u posebnom prolazu.
- **`docs/technical/08_ui_element_analysis.md`:** Checklist za elemente; provjeri redak „Tech stack“ (npr. Skeleton u `bm-ui`) kad mijenjaš ovisnosti.
- **Reference audita konkurenta / uzora:** `docs/design/polymarket-ui-audit.md` (+ slike u `docs/design/assets/polymarket/`).

## 5. Redoslijed rada (groundwork → dokaz → čišćenje)

1. **Analiza** — CSS / vizual prema uputama u `polymarket-ui-audit.md` (ili interni audit); sažetak u isti MD ili povezani doc.
2. **Groundwork** — proširenje `tokens.ts` + `theme.css`; ažuriranje `bm-semantic-tokens-proposal.md` ako se mijenja koncept ključeva.
3. **Ovaj contract** — ostaje referenca; mijenja se rijetko i eksplicitno (PR opis).
4. **Dokaz u kodu** — jedna vidljiva promjena (npr. **header** / shell) koja koristi nove tokene end-to-end.
5. **Per-komponentni prolaz** — ostale komponente jedna po jedna; bilješka u `08_ui_element_analysis.md` po potrebi.

## 6. Što je izvan opsega ovog contracta

- Poslovna logika u `bm-ui` (zabranjeno i dalje).
- Promjene bez use case-a gdje pravilo projekta to zahtijeva (`/docs/use-cases/`).
