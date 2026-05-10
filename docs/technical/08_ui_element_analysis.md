# UI Element Analysis

> **Maintenance:** When changing `bm-ui` dependencies or design stack, re-check the **Tech Stack Reference** table below (e.g. Skeleton). For current styling rules and rollout order, see [`docs/design/styling-contract.md`](../design/styling-contract.md) and [`CLAUDE.md`](../../CLAUDE.md).

This document tracks a page-by-page audit of every UI element in BigMarket.
For each element it records: what component renders it, what classes are hardcoded,
which tokens it should use, and what logic is embedded vs what belongs in `bm-ui`.

The goal is to use this as a **working checklist** for the design-token cleanup pass.

---

## Tech Stack Reference

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | SvelteKit | ^2.57.0 |
| Language | Svelte (runes mode) | ^5.55.2 |
| Styling | Tailwind CSS | ^4.2.2 |
| Build | Vite | ^8.0.7 |
| TypeScript | TypeScript | ^6.0.2 |
| Icon library | lucide-svelte | (app dep) |
| Class utilities | tailwind-merge, tailwind-variants | (bm-ui dep) |
| Design tokens | @bigmarket/bm-design | workspace |
| UI components | @bigmarket/bm-ui | workspace |
| Component library | @skeletonlabs/skeleton | ^4.15.2 (bm-ui dep) |

### Rendering levels

**Low level — primitives**
Raw HTML elements (`<button>`, `<a>`, `<input>`) styled directly with Tailwind classes.
No Svelte reactivity. No props. Lives inside `bm-ui` components or inline in pages.

**Mid level — `bm-ui` components**
Presentational Svelte components: accept props, emit events, no stores, no API calls.
Examples: `HeaderButton`, `HeaderButtonReputation`, `Banner`, `ParaContainer`, `Card`.
Source: `packages/bm-ui/src/lib/components/`.

**High level — application components**
Composed from mid-level components + business logic. Read stores, call SDK, handle
navigation. Examples: `Header.svelte`, `CreateMarket.svelte`, route `+page.svelte` files.
Source: `apps/frontend-c1/src/lib/components/` and `src/routes/`.

**Touchpoints between levels**
- High → Mid: props passed down, callbacks emitted up, no store access in mid level
- Mid → Low: Tailwind classes applied directly, slots for composition
- High → Stores: `$state`, `$derived`, store subscriptions live only at high level
- High → SDK: `@bigmarket/sdk`, `@bigmarket/bm-common` calls stay in high level

---

## HOMEPAGE SCAN

### Element: Global Navigation Bar

**File:** `apps/frontend-c1/src/lib/components/template/Header.svelte`
**Rendering level:** High level (contains logic) — wraps Mid-level `bm-ui` components

---

#### Sub-components used

| Component | Source | Level |
|-----------|--------|-------|
| `HeaderButton` | `@bigmarket/bm-ui` | Mid |
| `HeaderButtonReputation` | `@bigmarket/bm-ui` | Mid |
| `ConnectMenuDropdown` | local `template/` | High |
| `ConnectLanes` | local `template/` | High |
| `SlotModal` | local `template/` | High |
| Icons (`Menu`, `X`, `Sun`, `Moon`, `Trophy`, `Crown`, `Settings`, `Power`, `BarChart3`, `DollarSign`) | `lucide-svelte` | Low |

---

#### SvelteKit APIs used

| API | Import | Purpose |
|-----|--------|---------|
| `resolve()` | `$app/paths` | Build internal hrefs |
| `page.url.pathname` | `$app/state` | Current route for active tab highlight |
| `afterNavigate()` | `$app/navigation` | Update `currentPath` on route change |
| `onMount` / `onDestroy` | `svelte` | Attach/detach window event listeners |

---

#### Logic in `<script>` block — DO NOT TOUCH during UI pass

| Function | Purpose |
|----------|---------|
| `toggleDarkMode()` | Reads/writes `document.documentElement.classList` + `localStorage.theme` |
| `checkDarkMode()` | Initialises `isDarkMode` state from DOM on mount |
| `toggleMenu()` | Toggles `isOpen` mobile menu state |
| `closeMenu()` | Sets `isOpen = false` |
| `handleClickOutside()` | Closes menu when clicking outside `dropdownRef` |
| `handleResize()` | Closes mobile menu when viewport ≥ 768px |
| `disWallet()` | Calls `disconnectWallet()` + page reload |
| `isLoggedIn()` | Gate for login-only nav items |
| `getStxAddress()` | Wallet address for dynamic hrefs + display |
| `isCoordinator()` | Gate for "Create" link visibility |
| `mainNavLinks` | Centralised nav link list from `$lib/core/tools/site` |

⚠️ Two debug `console.log` calls remain in `toggleMenu()` (lines 44 & 46) — remove during cleanup.

---

#### Hardcoded color classes — full inventory

**Brand / primary (orange)**

| Class | Location | Semantic meaning |
|-------|----------|-----------------|
| `bg-orange-500` | Logo icon background | `color-brand` |
| `bg-orange-600` | Logo icon hover | `color-brand-hover` |
| `bg-orange-100` | Mobile menu button active state (light) | `color-brand-subtle` |
| `bg-orange-900` | Mobile menu button active state (dark) | `color-brand-subtle-dark` |
| `text-orange-500` | Reputation link text | `color-brand` |
| `text-orange-700` | STX badge text (light) | `color-brand-emphasis` |
| `text-orange-400` | STX badge text (dark) | `color-brand-muted` |
| `bg-orange-500/20` | STX badge background (dark) | `color-brand-subtle` |
| `focus-visible:ring-orange-500` | Focus rings (×2 elements) | `color-brand` |

**Surface (backgrounds)**

| Class | Semantic meaning |
|-------|-----------------|
| `bg-white` | Header background (light) | `color-surface` |
| `bg-gray-900` | Header background (dark) | `color-surface-dark` |
| `bg-gray-50` | Mobile menu item hover (light) | `color-surface-hover` |
| `bg-gray-100` | Icon backgrounds, button hover (light) | `color-surface-raised` |
| `bg-gray-800` | Icon backgrounds, button hover (dark) | `color-surface-raised-dark` |
| `bg-gray-200` | Dark mode toggle active (light) | `color-surface-active` |
| `bg-gray-700` | Dark mode toggle active (dark) | `color-surface-active-dark` |

**Border**

| Class | Semantic meaning |
|-------|-----------------|
| `border-gray-200` | Header bottom border (light) | `color-border` |
| `border-gray-700` | Header bottom border (dark) | `color-border-dark` |

**Text**

| Class | Semantic meaning |
|-------|-----------------|
| `text-gray-900` | Primary text (light) | `color-text-default` |
| `text-white` | Primary text (dark) | `color-text-default-dark` |
| `text-gray-700` | Secondary text (light) | `color-text-secondary` |
| `text-gray-300` | Secondary text (dark) | `color-text-secondary-dark` |
| `text-gray-600` | Muted text (light) | `color-text-muted` |
| `text-gray-400` | Muted text (dark) | `color-text-muted-dark` |
| `text-gray-500` | Subtle text | `color-text-subtle` |
| `text-gray-100` | Text on dark surfaces | `color-text-on-dark` |

**Total hardcoded color references: ~28**
**Unique semantic roles needed: 6 surface + 4 text + 1 brand + 1 border = ~12 tokens**

---

#### Cleanup actions for this element

- [ ] Replace all `orange-*` with a `brand` semantic token
- [ ] Replace all `gray-*` surfaces with `surface`, `surface-hover`, `surface-raised` tokens
- [ ] Replace all `gray-*` text with `text-default`, `text-secondary`, `text-muted`, `text-subtle` tokens
- [ ] Replace `border-gray-*` with `border-default` token
- [ ] Move logo `<div>` (BM icon) into a `<Logo>` component in `bm-ui`
- [ ] Remove `console.log` calls in `toggleMenu()` (lines 44 & 46)
- [ ] Verify dark mode: all `dark:` variants should map to the same token (dark mode value), not a separate token

---

*Next section: Homepage — Market Listing Grid (to be added)*
