/**
 * TypeScript design tokens — use from **`.ts` / `.svelte` `<script>`** when you need values in JS (charts, inline styles, API payloads).
 *
 * **Tailwind class names** (`bg-primary`, `text-muted-foreground`, …) come from **`./theme.css`** (`@theme`). Visual source for brand scales: **`./vendor/skeleton-nouveau.css`** (Skeleton `nouveau`). When you change a semantic mapping, update **`theme.css`** and this file together.
 */
export const tokens = {
  colors: {
    /** Light theme semantics — match `theme.css` (:root / @theme). */
    primary: {
      DEFAULT: "oklch(83.44% 0.16 97deg)",
      foreground: "oklch(45.41% 0.09 96.95deg)",
    },
    secondary: {
      DEFAULT: "oklch(90.72% 0.03 307.1deg)",
      foreground: "oklch(16.6% 0.03 308.28deg)",
    },
    muted: {
      DEFAULT: "oklch(95.48% 0.01 306.17deg)",
      foreground: "oklch(32.09% 0.08 303.77deg)",
    },
    accent: {
      DEFAULT: "oklch(56.7% 0.19 256.45deg)",
      foreground: "oklch(93.03% 0.03 249.76deg)",
    },
    destructive: {
      DEFAULT: "oklch(41.76% 0.16 21.54deg)",
      foreground: "oklch(90.76% 0.02 6.73deg)",
    },
    border: "oklch(90.72% 0.03 307.1deg)",
    background: "oklch(98.18% 0.01 308.72deg)",
    foreground: "oklch(10.09% 0.05 307.48deg)",
    ring: "oklch(62.85% 0.17 253.13deg)",
  },

  radius: {
    sm: "6px",
    md: "6px",
    lg: "12px",
    xl: "20px",
  },

  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },

  typography: {
    /** Skeleton nouveau uses `system-ui` body; headings use condensed stack (see `theme.css` --font-heading). */
    fontFamily: {
      sans: 'system-ui, sans-serif',
      heading:
        "Bahnschrift, 'DIN Alternate', 'Franklin Gothic Medium', 'Nimbus Sans Narrow', sans-serif-condensed, sans-serif",
    },
    fontSize: {
      sm: "14px",
      base: "16px",
      lg: "18px",
      xl: "24px",
    },
  },
} as const;
