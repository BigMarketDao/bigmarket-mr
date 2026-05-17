# 01 — App Chrome

**Depends on:** `00-token-wiring` landed.

The app shell — shared across every page. Fix this once, every page benefits.

| File | Model | What it does |
|------|-------|--------------|
| `0-pre-run-audit.md` | Sonnet 4.6 | Read-only audit — run before B0 to catch path/class mismatches |
| `sanity-check-prompt.md` | Sonnet 4.6 | Quick 10-min gut-check alternative to full audit |
| `B0-header-chrome.md` | Haiku 4.5 | `+layout.svelte`, `AlphaBanner`, `HeaderMenuTailwind`, `ReputationCommunityBanner`, `Footer`, `TxModal`, splash in `app.html`, `bm-ui` Card + Button + PageContainer |

**Components covered (10 files):**
- `apps/frontend-c1/src/routes/+layout.svelte`
- `apps/frontend-c1/src/app.html` (splash inline CSS only)
- `HeaderMenuTailwind.svelte`
- `AlphaBanner.svelte`
- `ReputationCommunityBanner.svelte`
- `Footer.svelte`
- `TxModal.svelte`
- `bm-ui/Card.svelte`
- `bm-ui/Button.svelte`
- `bm-ui/PageContainer.svelte`

**Definition of done:** zero Tier-1 palette utilities in the chrome; dark-mode parity; no behavior change.
