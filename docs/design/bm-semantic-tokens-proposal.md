# BigMarket — prijedlog semantičkih tokena

Cilj: proširiti postojeće (`primary`, `secondary`, `muted`, `border`, `background` u `tokens.ts` / `theme.css`) u **potpuniju rolu** bez dupliciranja cijele Tailwind skale.

## Već imate (zadržati)

| Ključ | Uloga |
|--------|--------|
| `primary` / `primary-foreground` | Glavni akcent (CTA, jak naglasak) |
| `secondary` / `secondary-foreground` | Sekundarne površine / alternativni gumb |
| `muted` / `muted-foreground` | Prigušena pozadina, sekundarni tekst |
| `border` | Zadani obrubi |
| `background` | Stranica / root pozadina |

## Predloženo proširenje (semantika → Tailwind `@theme`)

Imena su **uloge**, ne boje. Vrijednosti mapirate na postojeće primitivne skale ili hex u jednom mjestu.

### Površine (layering)

| Token | Namjena |
|--------|---------|
| `surface` | Kartice, paneli, modali — jedan nivo iznad `background` |
| `surface-elevated` | Tooltip, dropdown, sticky subheader — “iznad” kartice |
| `surface-inset` | Polja unutar kartice (well), filter bar |

### Tekst

| Token | Namjena |
|--------|---------|
| `foreground` | Zadani tekst na `background` (često zamjenjuje “random gray-900”) |
| `foreground-subtle` | Manje važan tekst (meta, caption) — strože od `muted-foreground` ako treba |

*(Opcionalno: ako `muted-foreground` pokriva caption, `foreground-subtle` možete izostaviti.)*

### Akcent i signal

| Token | Namjena |
|--------|---------|
| `accent` | Drugi akcent (npr. link, highlight KPI, “live” stanje) |
| `accent-foreground` | Tekst na `accent` |
| `success` / `success-foreground` | Pozitivni ishod, “Yes” |
| `warning` / `warning-foreground` | Upozorenje, rizik |
| `destructive` / `destructive-foreground` | Brisanje, greška, “No” |

### Interakcija

| Token | Namjena |
|--------|---------|
| `ring` | Focus ring (pristupačnost) |
| `input` | Pozadina inputa |
| `input-border` | Obrub polja |

### Navigacija / chrome

| Token | Namjena |
|--------|---------|
| `header` / `header-foreground` | Top bar (opcionalno ako želite odvojiti od `surface`) |
| `nav-active` | Aktivni link u navigaciji |
| `nav-inactive` | Neaktivni link |

### Tipografija (opcionalno u `@theme`)

| Token | Namjena |
|--------|---------|
| `font-sans` | Već imate (Inter) |
| Veličine | Ostaju Tailwind `text-sm` … ili `text-body`, `text-heading-sm` ako želite strogo tokenizirane uloge |

## Implementacijski redoslijed (preporuka)

1. Dodati u `tokens.ts` pod `colors` samo ono što ćete **stvarno** koristiti u prvom prolazu (npr. `surface`, `foreground`, `accent`, `destructive`, `ring`).
2. Zrcaliti u `theme.css` unutar `@theme { }`.
3. U `@layer base` ili `.dark` definirati **dark** vrijednosti za iste ključeve.
4. Migrirati jednu površinu (npr. header + jedna stranica) prije širenja na cijeli app.

## Napomena

Ne morate imati 30 semantičkih boja na startu — **manje imena, dosljednija upotreba** bolje od velike tablice koju nitko ne pridržava.
