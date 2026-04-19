export const tokens = {
  colors: {
    primary: {
      DEFAULT: "#0f172a",
      foreground: "#ffffff",
    },
    secondary: {
      DEFAULT: "#f1f5f9",
      foreground: "#0f172a",
    },
    muted: {
      DEFAULT: "#e2e8f0",
      foreground: "#64748b",
    },
    border: "#e5e7eb",
    background: "#ffffff",
  },

  radius: {
    sm: "6px",
    md: "10px",
    lg: "14px",
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
    fontFamily: {
      sans: "Inter, sans-serif",
    },
    fontSize: {
      sm: "14px",
      base: "16px",
      lg: "18px",
      xl: "24px",
    },
  },
} as const;
