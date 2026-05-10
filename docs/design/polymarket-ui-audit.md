# Polymarket UI — audit (slike + CSS / izvor u pregledniku)

Cilj: iz **screenshotova u repou** i **stvarnog preglednika (DevTools)** izvući **dizajn obrasce** prije nego zaključate BigMarket tokene i komponente.

## 0. Radni tijek s **Claude Cowork** (ili sličnim agentom s preglednikom)

1. **Otvori workspace** ovog repozitorija (`bigmarket-mr`) tako da agent vidi lokalne datoteke.
2. Neka agent **pročita slike** iz:

   `docs/design/assets/polymarket/`

   (PNG-ovi ispod — inventar je ažuriran prema uploadu.)
3. Neka agent u **ugrađenom pregledniku** posjeti [polymarket.com](https://polymarket.com) i, gdje je moguće, **iste vrste ekrana** kao na screenshotovima (home, market detail, modal connect, order book, widgeti).
4. Za svaki takav ekran agent **neka pokuša** (koliko okruženje dopušta):
   - **Elements**: odabir reprezentativnih čvorova (kartica, primarni gumb, naslov, pozadina stranice, border inputa).
   - **Computed**: `color`, `background-color`, `font-family`, `font-size`, `font-weight`, `line-height`, `border-radius`, `border-color`, `box-shadow`, `padding` (ili logički `padding-block` / `padding-inline`).
   - **Styles**: traženje **`var(--...)`** na `:root` / `html` / `body` (dizajn tokeni u CSS-u).
   - **Network** (ili **Sources**): identificiranje **glavnih CSS / JS bundlova**; ako je čitljivo, izdvajanje **ponavljajućih vrijednosti** (npr. isti radius, isti sivi tekst). *Minificirani kod je OK za uzorak — ne treba ručno rasplištati cijeli bundle.*
5. Ako automatizirano skidanje CSS-a nije moguće, agent upute korisnika da **ručno zalijepi** iz DevTools-a:
   - blok **Computed styles** za 2–3 ključna elementa, ili
   - ispis **`getComputedStyle(document.documentElement)`** za CSS varijable (konzola: snippet koji lista `--*` na `:root`).

**Napomena o putanjama:** neka imena datoteka imaju **razmake**; u Markdown linkovima koristi `%20` ili preimenuj datoteke u `kebab-case` za stabilniji preview.

---

## 1. Inventar slika u repou (`docs/design/assets/polymarket/`)

| Datoteka | Kratak opis (za usklađivanje s live stranicom) |
|----------|------------------------------------------------|
| `homepage LIGHT.png` | Home, svijetla tema |
| `homepage DARK.png` | Home, tamna tema |
| `homepage hero binary.png` | Hero / binarni format |
| `homepage hero categorical.png` | Hero / kategorijski |
| `homepage hero PriceUP:DOWN.png` | Hero / Price up down |
| `homepage hero Sports.png` | Hero / sport |
| `widget - trending by market volume.png` | Trending widget |
| `widget buying.png` | Buy / trade widget |
| `market details - BTC Up or Down 5m ... .png` | Detalj tržišta (BTC 5m) |
| `market details - BTC Up or Down 5m ... (1).png` | Varijanta istog tipa |
| `market details - West Ham United FC vs. Arsenal FC ... .png` | Sportski market detail |
| `market details - Hantavirus pandemic in 2026 ... .png` | Market detail (primjer) |
| `market details - US x Iran permanent peace deal by... .png` | Market detail (primjer) |
| `order book.png` | Order book |
| `sign up and connect wallet popup.png` | Modal / wallet |

---

## 2. Prompt za AI (Claude Cowork / Cursor) — **kopiraj cijeli blok**

Priloži **sve relevantne slike** iz mape iznad *i/ili* uputi agenta da ih učita iz repozitorija. Zatim zalijepi:

```text
You are a senior product designer AND a front-end engineer focused on design systems.

## Inputs
1) Screenshots from our repo path: `docs/design/assets/polymarket/` (Polymarket UI). Analyze every image provided.
2) Live verification: use the browser to open https://polymarket.com (and specific market URLs if you can match the screenshots). Align your findings with what you see live.

## Part A — Per screenshot (repeat for EACH image)
1) **Screen name** — what UI this is.
2) **Layout** — grid/flex, max-width feel, density (airy vs compact), key zones (nav, hero, sidebar, main column).
3) **Visual hierarchy** — 1st / 2nd / 3rd focal points (type scale, weight, color).
4) **Inferred color roles** — page bg, surface/card, primary text, muted text, borders, primary CTA, secondary actions, positive/negative odds coloring if visible.
5) **Components** — cards, tabs, charts, tables, order book, modals, inputs; radius and shadow *as seen*.
6) **Motion / state cues** — live numbers, pills, badges (only if visible).
7) **Accessibility** — contrast and target size guesses; note uncertainty.
8) **Adopt vs avoid** — 2–3 bullets each for a prediction-market product (not generic platitudes).

## Part B — CSS / implementation patterns (from DevTools + page, not guesses)
Using the browser’s developer tools on Polymarket (same or equivalent pages as the screenshots):

9) **CSS variables / tokens** — List `:root` (or `html`/`body`) custom properties you can see (`--*`): name + value. If the build hides them, say “not exposed” and rely on computed styles below.
10) **Typography stack** — `font-family`, typical `font-size` / `font-weight` for: page title, body, label, small meta text, button text (from computed styles on samples).
11) **Radius & elevation** — typical `border-radius` and `box-shadow` patterns (e.g. card vs button vs modal).
12) **Spacing rhythm** — infer a rough spacing scale from repeated padding/margin values on cards, sections, and list rows (e.g. multiples of 4/8px). State confidence (high/medium/low).
13) **Color values** — hex/rgb for: background, card, border, primary text, muted text, primary button (from computed styles). Deduplicate into a small palette table.
14) **Class / framework hints** — From HTML source or class names on nodes: note if patterns look Tailwind-like, CSS-modules-like, or custom. Do not reproduce long minified JS; only patterns.
15) **Correlate** — Short paragraph linking Part A (visual) to Part B (measured): e.g. “muted text in UI matches computed #xxxxxx on secondary labels.”

## Part C — Design patterns summary (cross-cutting)
16) **Recurring patterns** — bullets: navigation, market cards, odds display, buy/sell widget, order book, modals.
17) **Semantic token mapping (for OUR design system)** — Markdown table: `UI role` → `suggested semantic token name` (e.g. background, foreground, surface, surface-elevated, border, primary, primary-foreground, muted, muted-foreground, accent, destructive). This is OUR naming, not Polymarket’s internal names.

## Rules
- If something is not visible in screenshots and cannot be verified in the browser, write **“not visible / not verified”** — do not invent.
- Prefer **measured** values from computed styles over eyeballing when the browser is available.
- Output **valid Markdown** with clear headings so we can paste into `docs/design/polymarket-ui-audit.md`.

## Optional console snippet (CSS variables on :root)
If execution is allowed on polymarket.com, something like:
`const css = getComputedStyle(document.documentElement); Array.from(css).filter(p => p.startsWith('--')).forEach(p => console.log(p, css.getPropertyValue(p).trim()));`
Summarize unique `--*` names and values; if CORS or CSP blocks inspection, say so and rely on computed styles from picked elements only.
```

---

## 3. Ugradi slike u ovaj dokument (predložak — uredi putanje)

*Primjer s `%20` za razmake u imenima:*

### Home (light)

![Homepage light](./assets/polymarket/homepage%20LIGHT.png)

### Home (dark)

![Homepage dark](./assets/polymarket/homepage%20DARK.png)

### Hero varijante

![Hero binary](./assets/polymarket/homepage%20hero%20binary.png)

![Hero categorical](./assets/polymarket/homepage%20hero%20categorical.png)

![Hero Price up down](./assets/polymarket/homepage%20hero%20PriceUP:DOWN.png)

![Hero sports](./assets/polymarket/homepage%20hero%20Sports.png)

### Widgeti

![Trending widget](./assets/polymarket/widget%20-%20trending%20by%20market%20volume.png)

![Buying widget](./assets/polymarket/widget%20buying.png)

### Market details & order book

*(Dodaj ostale `market details - ...` i `order book.png` po istom obrascu — duga imena, koristi `%20`.)*

### Modal

![Sign up / wallet](./assets/polymarket/sign%20up%20and%20connect%20wallet%20popup.png)

**AI izlaz (zalijepi ovdje nakon Cowork / chat):**

---

## 4. Sažetak nakon analize

| Tema | Polymarket (vizual + CSS) | BigMarket odluka |
|------|---------------------------|------------------|
| Hijerarhija naslova | | |
| Kartice / obrubi | | |
| CTA | | |
| KPI / brojevi | | |
| Dark vs light | | |

---

## 5. Naši tokeni

- [`bm-semantic-tokens-proposal.md`](./bm-semantic-tokens-proposal.md)
- `packages/bm-design/src/tokens.ts` + `theme.css`
