import { createTheme } from "@mui/material/styles";

/**
 * BestAIBuys design system — based on Natalya's Good Find tokens.
 *
 *  Surfaces: cream (#F1EEDA) page, white (#FFFFFF) cards.
 *  Ink: graphite (#262625) primary, mid-grey (#5D5D5D), light (#7F8080).
 *  Accent: green (#7BC362 light / #5CBA49 deep) for confirmations,
 *  success states, CTAs and the brand mark.
 *  Type: Fraunces serif for display, Inter for UI text.
 *  Radii: 999px pills, 16/22px cards, 10/16/24px graduated.
 */

export const tokens = {
  bg: "#F1EEDA",
  bgElev: "#FFFFFF",
  ink: "#262625",
  ink2: "#5D5D5D",
  ink3: "#7F8080",
  rule: "#CCCBCA",
  green: "#7BC362",
  greenDeep: "#5CBA49",
  greenSoft: "#D9F876",
  // Blue family used by the "Best Match for You" badge on the two-card
  // results layout (BES-39). Soft pastel surface + deep navy text keep
  // the badge legible (>9:1 contrast) and distinct from the green / ink
  // palette used elsewhere.
  blueSoft: "#DCE7F2",
  blueDeep: "#244A75",
  error: "#F0694D",
  shadowSm: "0 1px 2px rgba(38,38,37,0.04), 0 2px 6px rgba(38,38,37,0.04)",
  shadowMd: "0 4px 12px rgba(38,38,37,0.06), 0 12px 32px rgba(38,38,37,0.06)",
  shadowLg: "0 8px 24px rgba(38,38,37,0.08), 0 24px 64px rgba(38,38,37,0.08)",
  radiusSm: 10,
  radiusMd: 16,
  radiusLg: 24,
  radiusPill: 999,
  fontSerif: "'Fraunces', Georgia, serif",
  fontSans: "'Inter', -apple-system, system-ui, sans-serif",
  // Color-emoji fallback stack: ensures option icons (🥖 🇺🇸 ✨ etc.)
  // render as native color glyphs instead of the host text font's
  // best-guess fallback (which often looks like a tiny dot).
  fontEmoji:
    "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'EmojiOne Color', 'Twemoji Mozilla', sans-serif",
} as const;

export const theme = createTheme({
  palette: {
    primary: {
      main: tokens.greenDeep,
      light: tokens.green,
      dark: "#4AA33D",
      contrastText: tokens.ink,
    },
    secondary: {
      main: tokens.ink,
      light: tokens.ink2,
      dark: "#000000",
    },
    background: {
      default: tokens.bg,
      paper: tokens.bgElev,
    },
    text: {
      primary: tokens.ink,
      secondary: tokens.ink2,
      disabled: tokens.ink3,
    },
    error: {
      main: tokens.error,
      light: "#FEE2E2",
    },
    divider: tokens.rule,
  },
  typography: {
    fontFamily: tokens.fontSans,
    h1: {
      fontFamily: tokens.fontSerif,
      fontWeight: 500,
      fontSize: "2.5rem",
      letterSpacing: "-0.025em",
      lineHeight: 1.05,
    },
    h2: {
      fontFamily: tokens.fontSerif,
      fontWeight: 500,
      fontSize: "1.75rem",
      letterSpacing: "-0.02em",
      lineHeight: 1.15,
    },
    h3: {
      fontFamily: tokens.fontSans,
      fontWeight: 600,
      fontSize: "1.25rem",
    },
    body1: { fontSize: "1rem", lineHeight: 1.55 },
    body2: { fontSize: "0.875rem", lineHeight: 1.5 },
    caption: { fontSize: "0.75rem" },
    button: {
      fontFamily: tokens.fontSans,
      fontWeight: 500,
      textTransform: "none" as const,
    },
  },
  shape: { borderRadius: tokens.radiusMd },
  components: {
    // Root-level background so no dark browser canvas / scrollbar shows
    // through (was the "black patch" at the bottom). colorScheme: light
    // stops the browser painting dark defaults in OS dark mode.
    MuiCssBaseline: {
      styleOverrides: {
        html: { colorScheme: "light", backgroundColor: tokens.bg },
        body: { backgroundColor: tokens.bg, overflowX: "hidden" },
        "#root": { backgroundColor: tokens.bg, minHeight: "100vh" },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radiusPill,
          padding: "10px 22px",
          fontSize: "0.9375rem",
        },
        contained: {
          boxShadow: "none",
          "&:hover": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 22,
          border: `1px solid ${tokens.rule}`,
          boxShadow: tokens.shadowSm,
          backgroundColor: tokens.bgElev,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: { "& .MuiOutlinedInput-root": { borderRadius: tokens.radiusPill } },
      },
    },
  },
});
