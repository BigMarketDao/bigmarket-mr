# BigMarket — prijedlog semantičkih tokena

Cilj: proširiti postojeće (`primary`, `secondary`, `muted`, `border`, `background` u `tokens.ts` / `theme.css`) u **potpuniju rolu** bez dupliciranja cijele Tailwind skale. Imena su **uloge**, ne boje; vrijednosti dolaze iz primitiva (npr. paleta [`skeleton-theme-nouveau.md`](./skeleton-theme-nouveau.md)).

## Kontekst (zašto)

- U produktu se često koriste **primitivi** (`gray-*`, `zinc-*`) uz **proizvoljne veličine teksta** — teško održavati i tamni način.
- **Više-ishodna skalarna tržišta** trebaju **jedan** skup kategorijskih boja za badge, karticu i crtu u grafu.
- **Trgovački UI** mora razlikovati: Yes/No, **smjer cijene**, status (live), i **odabir** (ring) bez vizualnog nestajanja.

## Već imate (zadržati)

| Ključ | Uloga |
|--------|--------|
| `primary` / `primary-foreground` | Glavni akcent (CTA, jak naglasak) |
| `secondary` / `secondary-foreground` | Sekundarne površine / alternativni gumb |
| `muted` / `muted-foreground` | Prigušena pozadina, sekundarni tekst |
| `border` | Zadani obrubi |
| `background` | Stranica / root pozadina |

## Usklađivanje s Tailwind/shadcn površinama

U implementaciji često koristimo **shadcn imena** koje su već u ekosustavu:

| Koncept iz ranog prijedloga | Tipično u `@theme` | Namjena |
|----------------------------|---------------------|--------|
| Jedan nivo iznad stranice | `card` / `card-foreground` | Kartice, paneli, glavni kontejneri sadržaja |
| Iznad kartice (floating) | `popover` / `popover-foreground` | Tooltip, dropdown, kontekstni sloj |
| “Elevated” unutar utopljenog | `card` unutar `muted` | Aktivni pill tab na sivoj traci |
| Utopljeno / well | `muted` | Polja unutar kartice, filter traka |
| Pozadina modala | `overlay` (kad se uvede) | Zatamnjenje iza dijaloga |

`header` / `nav-active` / `nav-inactive` **uvodite tek ako** zasebna uloga stvarno štedi dosljednost; često je dovoljno `foreground` + `muted-foreground` + `accent` za aktivni link.

## Predloženo proširenje — tekst

| Token | Namjena |
|--------|---------|
| `foreground` | Zadani tekst na `background` |
| `muted-foreground` | Meta, sekundarni tekst (postojeće) |
| `subtle-foreground` | Caption, sitni footer — **ako** trebate treći nivo; inače ne širiti paletu |

*(Ako `muted-foreground` pokriva sve “sekundarno”, `subtle-foreground` možete izostaviti do prvog vizualnog dokaza.)*

## Predloženo proširenje — akcent i signal

| Token | Namjena |
|--------|---------|
| `accent` / `accent-foreground` | Link, info naglasak, “live” highlight (mapira se na brand `secondary` gdje ima smisla) |
| `success` / `success-foreground` | Pozitivan ishod, “Yes” |
| `warning` / `warning-foreground` | Upozorenje, rizik |
| `destructive` / `destructive-foreground` | Brisanje, greška, “No” |
| `info` / `info-foreground` | Informativna poruka (često alias na sekundarni ton) |

### Quad uzorak za status uloge

Za uloge **`success`**, **`warning`**, **`destructive`**, **`info`**, **`accent`** (gdje treba badge/pill):

| Sufiks | Namjena |
|--------|---------|
| `*` (DEFAULT) | Puna površina / ikona |
| `*-foreground` | Tekst na punoj površini |
| `*-soft` | Blaga tint pozadina (light/dark mogu koristiti različitu alfa logiku) |
| `*-border` | Obrub badge-a / kartice |

## Predloženo proširenje — interakcija

| Token | Namjena |
|--------|---------|
| `ring` | Focus ring (pristupačnost) |
| `input` | Pozadina polja |
| `input-border` | Obrub polja |

## Predloženo proširenje — brand / zajednica

Paleta `nouveau` ima **`secondary`** (kobalt) i **`tertiary`** (violet). Predlažemo:

| Token | Namjena |
|--------|---------|
| `accent` | Inline link, “live”, KPI naglasak → tipično **secondary** |
| `community` / `community-foreground` (+ po potrebi `-soft`, `-border`) | Governance, Karma, ljubičasti banneri → **tertiary** |

`destructive` u kodu = Tailwind konvencija; u CSS sloju primitivi mogu ostati `error-*` — bitno je jedno semantičko ime u potrošnji.

## Domena predviđanja (obavezno razdvojiti od statusa)

| Token | Namjena | Napomena |
|--------|---------|----------|
| `price-up` | Cijena porasla | Može biti alias na `success`; **ime ostaje** |
| `price-down` | Cijena pala | Može dijeliti vrijednost s `destructive`; **nije** “greška” |
| `price-neutral` | Nema smjera / flat | Često alias na `muted-foreground` |
| `live-indicator` | “Uživo” (ako trebate odvojeno od `accent`) | Može biti alias na `success` |
| `selected` | Prsten / stanje odabira kartice | Tipično kontrastan u odnosu na `primary` na obojenoj kartici (npr. kobalt) |

## Outcome serije (kategorijske boje, ne Yes/No)

Za skalarna tržišta s više raspona: **`outcome-1` … `outcome-6`** (minimalni set). Svaki slot dobiva po potrebi `*-foreground`, `*-soft`, `*-border` i upotrebu u grafu (`stroke-outcome-N`, `fill-outcome-N`).

| Slot | Smjernica (mapiranje na paletu) |
|------|--------------------------------|
| `outcome-1` | Topla / prva serija — npr. `warning` |
| `outcome-2` | Zelena serija — npr. `success` |
| `outcome-3` | Kobalt — `secondary` |
| `outcome-4` | Violet — `tertiary` |
| `outcome-5` | Brand žuto-zlato — `primary` |
| `outcome-6` | Dodatni hue (npr. cyan) ako ga paleta inače nema |

Za **7+** ishoda: generirane boje u komponenti / utilu; ne nužno ručno imenovani token iznad 6 u prvom valu.

## Chart struktura (neovisno o serijama)

Tokeni za mrežu, osi, tooltip, kursor — da grafovi ne uvode jednokratne hex vrijednosti:

| Token | Namjena |
|--------|---------|
| `chart-grid` | Linije mreže |
| `chart-axis` | Os |
| `chart-axis-label` | Label osi |
| `chart-tooltip-bg` | Pozadina tooltipa (često = `popover`) |
| `chart-cursor` | Vertikala / crosshair |
| `chart-area-opacity` | Numerička konstanta u temi (light/dark može razlikovati) |

Implementacija grafikona: **biblioteka po izboru** (npr. Svelte-friendly); bitno je čitati boje iz CSS varijabli / `tokens.ts`.

## Tipografija (opcionalno u `@theme`)

| Pristup | Namjena |
|---------|---------|
| Zadržati `text-sm` / `text-base` … | Brzo, već poznato |
| Uvesti uloge `text-body-xs`, `text-body-sm`, `text-heading-lg`, … | Usklađeno s referentnim prediction UI-jem; smanjuje `text-[11px]` |

## Implementacijski redoslijed (preporuka)

1. U `tokens.ts` pod `colors` dodati **samo** ono što prvi prolaz stvarno koristi (npr. `card`, `popover`, `foreground`, `accent`, `destructive`, `ring`, `input`, par `outcome-*`).
2. Zrcaliti u `theme.css` unutar `@theme { }`.
3. U `@layer base` ili `.dark` definirati **dark** vrijednosti za iste ključeve.
4. Migrirati **jednu vertikalu** (npr. header + jedna stranica) prije širenja na cijeli app.
5. Drugi val: **evidencijski** — grep primitiva i proizvoljnih klasa otkriva što još treba imenovati.

## Napomena

Ne morate imati 30 semantičkih boja na startu — **manje imena, dosljednija upotreba** bolje od velike tablice koju nitko ne pridržava. Detaljna pravila imenovanja i potrošnje: [`styling-contract.md`](./styling-contract.md).
