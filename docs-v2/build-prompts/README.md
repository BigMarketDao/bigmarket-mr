# Build prompts — the cheap, fast path

Prompts are organized **one folder per page/section**, run in strict order. Each subfolder has its own README with the component list and run order. Read `../tokens-and-rules.lock.md` before starting anything.

## Folder structure

| Folder | Page / Scope | Components | Status |
|--------|-------------|-----------|--------|
| [`00-token-wiring/`](./00-token-wiring/) | Design tokens (no UI) | 3 files | **Ready** |
| [`01-app-chrome/`](./01-app-chrome/) | Layout, header, footer, banners | 10 files | **Ready** |
| [`02-homepage/`](./02-homepage/) | `/` — market cards, leaderboard | 9 components | Ready (full sweep) / Pending (per-component split) |
| [`03-market-detail/`](./03-market-detail/) | `/market/[id]/[type]` | 20 components | Ready (full sweep) / Pending (per-component split) |
| [`04-dao/`](./04-dao/) | `/dao`, `/dao/proposals/[slug]` | 14 components | **Pending** |
| [`05-reputation/`](./05-reputation/) | `/reputation`, `/reputation/leader-board` | 4 components | **Pending** |
| [`06-market-creation/`](./06-market-creation/) | `/market-mgt` | 11 components | **Pending** |
| [`07-my-markets/`](./07-my-markets/) | `/my-markets/[address]` | 2 components | **Pending** |

**Total prompts needed:** ~60–80 (component-by-component) or ~10 (full sweeps). See below.

---

## Run order

```
00-token-wiring     ← must land first, everything depends on it
      ↓
01-app-chrome       ← must land second, fixes bm-ui primitives all pages share
      ↓
02 / 03 / 04 / 05 / 06 / 07   ← can run in any order after 00+01 land
```

### Recommended model per step

| Step | Model | Why |
|------|-------|-----|
| `00` token wiring | **Haiku 4.5** | Mechanical — values are spelled out |
| `01` app chrome | **Haiku 4.5** | Clear checklist, no judgment needed |
| `02–07` component sweeps | **Haiku 4.5** | Per-component, one file at a time |
| Any step with color intent judgment | **Sonnet 4.6** | Escalate only when needed |

---

## Full sweep vs component-by-component

Each page folder contains both options:

| Option | Files per prompt | Risk | Review time |
|--------|-----------------|------|-------------|
| **Full sweep** (`B-homepage.md`, `C-market-detail.md`) | 8–20 | Medium–High | 20–40 min |
| **Per-component** (`B-01`, `B-02`, …) | 1 | Low | 2–5 min |

**Recommendation:** use per-component prompts. They are easier to test in the browser, easier to revert, and give you a clean commit per component. The full sweep files are kept as a fallback if you want speed over granularity.

---

## Legacy files (root level — kept for reference)

The original flat-file prompts are still here. The subfolder copies are identical — do not edit both.

| File | Now lives in |
|------|-------------|
| `A-token-wiring.md` | `00-token-wiring/` |
| `B0-header-chrome.md` | `01-app-chrome/` |
| `0-pre-run-audit.md` | `01-app-chrome/` |
| `sanity-check-prompt.md` | `01-app-chrome/` |
| `B-homepage.md` | `02-homepage/` |
| `C-market-detail.md` | `03-market-detail/` |
| `audits/` | still at root |

---

## When to escalate to the long version

Switch to [`../section-by-section-prompts.md`](../section-by-section-prompts.md) for:
- Trade widget redesign (Buy/Sell tabs, quick chips, pre-flight modal).
- Real order book vs recent-trades decision.
- Chart structure tokens and series wiring.
- Toast / notification redesign.
- `bm-ui/Panel.svelte` fix (Panel's container class is in `$derived` — logic boundary).
- Six-variant Button (`tertiary` + `soft` variants).
