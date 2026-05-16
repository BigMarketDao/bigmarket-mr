# Market Detail · C-05 — StakingButton

**File:** `packages/bm-market/src/lib/market/version2/do-stake/StakingButton.svelte`
**Model:** Haiku 4.5
**Time:** ~5 min
**Depends on:** `00-token-wiring` landed.

---

## Guardrails

DO NOT change behavior. Touch ONLY the one file listed in Scope. Use only Tier-2 semantic tokens. Never raw palette. No arbitrary values. No DaisyUI. Output: one file diff + 3-bullet PR summary.

---

## Scope

`packages/bm-market/src/lib/market/version2/do-stake/StakingButton.svelte`

## Tier-1 classes to replace

| Current | Intent | Replace with |
|---|---|---|
| `text-gray-600`, `text-gray-400` | Muted / disabled text | `text-muted-foreground` |
| `secondary-600`, `secondary-100`, `secondary-800` | These look like Skeleton theme tokens — verify they resolve. If they do NOT resolve, replace with `bg-secondary` / `text-secondary-foreground`. |

> **Note:** `secondary-600/100/800` are non-standard Tailwind classes. Read the file first — if they are custom classes that work, leave them. If they are broken/not resolving, map to `bg-secondary text-secondary-foreground`.

## UX additions — CTA touch target

If this is the **primary submit / buy button** (not the cool-down refund), apply the full CTA shape:

```svelte
<button
  type="button"
  disabled={…existing binding…}
  class="w-full inline-flex items-center justify-center gap-2 rounded-md
         bg-accent text-accent-foreground
         h-11 md:h-10 px-4 text-sm font-medium
         hover:bg-accent/90 active:scale-[0.98] transition
         disabled:opacity-50 disabled:pointer-events-none
         focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
         focus-visible:ring-offset-background focus-visible:outline-none">
  <!-- preserve existing label / slot exactly -->
</button>
```

- `h-11` = 44px on mobile (WCAG touch target minimum).
- `h-10` = 40px on desktop.
- `active:scale-[0.98]` = subtle press feedback.

If this is a **secondary cool-down/refund button** (not the trade CTA), just do the token sweep — do not apply the CTA shape. Read the file first to determine which it is.

## Verification

```bash
rg -n '\b(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret)-(gray|zinc|slate|neutral|stone|orange|red|green|blue|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|lime|emerald|teal|cyan)-(50|100|200|300|400|500|600|700|800|900|950)\b' \
  packages/bm-market/src/lib/market/version2/do-stake/StakingButton.svelte

rg -n '(bg|text|border|ring|fill|stroke|shadow|outline)-\[' \
  packages/bm-market/src/lib/market/version2/do-stake/StakingButton.svelte
```

## Definition of done

- Zero broken or Tier-1 palette utilities.
- Primary CTA: `h-11 md:h-10`, `bg-accent text-accent-foreground`, focus ring present.
- Disabled state: `opacity-50 pointer-events-none`.
