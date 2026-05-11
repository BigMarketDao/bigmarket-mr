# Styling contract (BigMarket)

**Purpose:** Jedan dogovor za uvođenje i održavanje stilova tako da se tim i AI ne raspu po primitivnim Tailwind klasama bez semantike.

## 1. Izvori istine

| Što | Gdje |
|-----|------|
| Semantičke boje, spacing, radius u CSS (Tailwind `@theme`) | `packages/bm-design/src/theme.css` |
| Iste vrijednosti za TS (charti, inline stilovi) | `packages/bm-design/src/tokens.ts` |
| Ulaz Tailwinda u app | `apps/frontend-c1/src/routes/layout.css` (`@import` bm-design, `@source` paketi) |
| Komponente bez logike | `packages/bm-ui` (presentation-only) |
| Inventar semantičkih uloga (što sve tokeniziramo) | [`bm-semantic-tokens-proposal.md`](./bm-semantic-tokens-proposal.md) |
| Brand paleta `nouveau` (OKLCH, kontrast, font/radius base) | `packages/bm-design/src/vendor/skeleton-nouveau.css` + opis u [`skeleton-theme-nouveau.md`](./skeleton-theme-nouveau.md) |

**Pravilo:** Svaka promjena semantičke vrijednosti ide **paralelno** u `tokens.ts` **i** `theme.css` (dok ne automatiziramo).

## 2. Arhitektura tokena (tri razine)

```text
TIER 1 — Primitivi (palette stops u theme.css, npr. --color-primary-500)
        ↓ mapiraju se u
TIER 2 — Semantika (Tailwind/shadcn konvencija: bg-card, text-foreground, …)
        ↓ po potrebi u
TIER 3 — Komponenta (Polymarket-stil: eksplicitni namespace po komponenti, npr. gumb/tab)
```

**Tko što koristi**

- **Feature / app kod (Svelte rute, poslovni paketi):** Tier 2 kao default. Tier 1 (**`gray-*`, `zinc-*`, `orange-500`, …**) ne koristiti nakon migracije — samo u `theme.css` / `@theme`.
- **`bm-ui`:** Tier 2 za jednostavne površine; Tier 3 gdje komponenta ima puno varijanti i stanja (gumb: više varijanti × stanja).
- **Tier 1 u produktu:** zabranjen izvan `packages/bm-design` (cilj: custom lint / grep u CI).

**Zašto hibrid:** čisti Tier 2 pokriva većinu UI-ja; čisti Tier 3 je verbose za običan tekst. Hibrid = kratak svakodnevni kod + jasni ugovori tamo gdje stanja eksplodiraju.

## 3. Hijerarhija klasa (pravilo potrošnje)

1. **Semantički token** (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, `bg-card`, …) — **default** za product UI.
2. **Primitivna Tailwind skala** — samo unutar `bm-design` pri definiranju mape na semantiku; u feature kodu **ne** (nakon migracije).
3. **Hex / rgb u komponenti** — izbjegavati; iznimno uz komentar zašto (npr. privremeno do uvođenja tokena).

## 4. Naming contract (obavezna pravila)

1. **Uloge, ne boje** — `accent`, ne `purple`; `outcome-1`, ne `orange-outcome`.
2. **Par** — svaka puna površina s tekstom ima `*-foreground` (ili ekvivalent iz kontrast tablice).
3. **Status u “quad” uzorku** — za `success`, `warning`, `destructive`, `info`, `accent`: uz `*` i `*-foreground` dodati `*-soft` i `*-border` gdje treba badge/pill obrub (vidi prijedlog tokena).
4. **Monotonost površina** — razine “iznad” idu niz `background` → `card` → `popover` (ili ekvivalent definiran u `@theme`). `muted` je “ispod” / utopljeno (well, filter). Preskakanje razine smatra se greškom dizajna.
5. **Stanja su sufiksi** — `hover`, `active`, `disabled` na istoj ulozi; **selected** je poseban koncept (prsten odabira nije nužno `primary`).
6. **`primary` ≠ akcija u trgovini** — `primary` = brand CTA; potvrda transakcije može biti druga uloga (npr. `success` / `action`) čak i ako je vizualno privremeno ista boja.
7. **Status ≠ smjer cijene** — `destructive` = greška/brisanje; **pad cijene** je `price-down` (smije dijeliti vrijednost s `destructive`, ali ne ime).
8. **Outcome serije** — `outcome-1…n` su kategorijske boje za skalarne tržišta; ne zamjenjuju Yes/No (`success` / `destructive`).
9. **Bez proizvoljnih vrijednosti u feature kodu** nakon čišćenja — npr. `text-[13px]`, `bg-[#abc]`; zamijeniti tipografskim ulogama / tokenima.
10. **Svaka semantička boja ima dark par** — bez iznimki.

**Odabir prstenja za odabir:** kada je kartica već brand/obojena, `ring-primary` može nestati na pozadini. Odvojeni token **`selected`** (npr. mapiran na sekundarni / kobalt akcent) drži selekciju čitljivom.

## 5. Recepti (kompozicija)

- **Čvrsti gumb:** `bg-{role} text-{role}-foreground`, blagi hover (npr. `/90`), **taktilni pritisak** `active:scale-[97%]` na interaktivnim kontrolama gdje ima smisla.
- **Soft badge:** `bg-{role}-soft text-{role} border border-{role}-border`.
- **Kartica:** `bg-card text-card-foreground border border-border` (+ radius iz tokena).
- **Input:** `bg-input border-input` + vidljiv `focus-visible:ring-2` / `ring-ring`.
- **Modal:** `bg-popover` iznad `bg-overlay` (kad uvedemo overlay token).

Detalji i prošireni inventar: [`bm-semantic-tokens-proposal.md`](./bm-semantic-tokens-proposal.md).

## 6. Tamni način

Semantika mora imati smislen **dark** par (u `@layer base` / `.dark` ili kroz usklađen `dark:` pristup). Nema polovičnih tokena bez noćne varijante.

## 7. Migracija i provjera

- **Komponenta po komponenta**, ne cijela stranica odjednom — lakše za review i regresije.
- Pri širenja: **grep** na `gray-`, `zinc-`, `text-[`, `bg-[#` u feature kodu; rezultat vodi sljedeći val tokena.
- **Storybook / galerija tokena** (preporuka): jedan ekran sa svim semantičkim swatch-evima + light/dark.

## 8. Paketi i naslijeđe

- **`sip18-forum`:** Nema DaisyUI; koristi Tailwind utilityje. I dalje može sadržavati **starije** kombinacije boja — cilj je postupno uskladiti s `bm-design` u posebnom prolazu.
- **`docs/technical/08_ui_element_analysis.md`:** Checklist za elemente; provjeri redak „Tech stack“ (npr. Skeleton u `bm-ui`) kad mijenjaš ovisnosti.
- **Referenca konkurenta (postupak + bilješke):** [`polymarket-ui-audit.md`](./polymarket-ui-audit.md) (+ slike u `docs/design/assets/polymarket/`).

## 9. Redoslijed rada (groundwork → dokaz → čišćenje)

1. **Analiza** — CSS / vizual prema uputama u `polymarket-ui-audit.md` (ili interni audit); sažetak u isti MD ili povezani doc.
2. **Groundwork** — proširenje `tokens.ts` + `theme.css`; ažuriranje `bm-semantic-tokens-proposal.md` ako se mijenja koncept ključeva.
3. **Ovaj contract** — ostaje referenca; mijenja se rijetko i eksplicitno (PR opis).
4. **Dokaz u kodu** — jedna vidljiva promjena (npr. **header** / shell) koja koristi nove tokene end-to-end.
5. **Per-komponentni prolaz** — ostale komponente jedna po jedna; bilješka u `08_ui_element_analysis.md` po potrebi.

## 10. Što je izvan opsega ovog contracta

- Poslovna logika u `bm-ui` (zabranjeno i dalje).
- Promjene bez use case-a gdje pravilo projekta to zahtijeva (`/docs/use-cases/`).
