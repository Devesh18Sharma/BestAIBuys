import { type ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { tokens } from "@/config/theme";

/**
 * BES-62 — the four value props Alex added below the hero on web.
 * Four cards on desktop, 2×2 on tablet, stacked on mobile. Each card has a
 * custom two-tone green illustration on a soft radial-green halo, a two-line
 * label, and a small green accent bar.
 *
 * The icons are hand-built SVGs (no external asset dependency) styled to match
 * the designer's illustrated set: a "0/$0" coin, a cart + checklist clipboard,
 * a price tag with a rising chart, and a check shield.
 */

// Illustration palette — layered greens for a soft 3D-ish read.
const G_LIGHT = "#8FD05C";
const G_MID = "#5FA83E";
const G_DARK = "#3E842B";
const G_DEEP = "#2C6420";
const G_INK = "#F1FAE8"; // near-white green for glyphs on dark green
const HALO = "#E7F6DC"; // soft green glow behind each illustration
const ACCENT = "#2F852C";

interface Benefit {
  title: string;
  sub: string;
  icon: ReactNode;
}

const svg = {
  viewBox: "0 0 80 80",
  width: 76,
  height: 76,
  "aria-hidden": true as const,
};

const BENEFITS: Benefit[] = [
  {
    title: "100% free",
    sub: "to use",
    icon: (
      <svg {...svg}>
        {/* sparkle accents */}
        <g stroke={G_LIGHT} strokeWidth="3" strokeLinecap="round">
          <path d="M13 21 l5 4" />
          <path d="M10 32 l7 1" />
          <path d="M20 12 l3 6" />
        </g>
        {/* the big "0" ring */}
        <ellipse cx="35" cy="41" rx="16" ry="20" fill="none" stroke={G_MID} strokeWidth="11" />
        {/* subtle shaded arc for depth */}
        <path
          d="M35 61 a16 20 0 0 0 16 -20"
          fill="none"
          stroke={G_DARK}
          strokeWidth="11"
          strokeLinecap="round"
          opacity="0.55"
        />
        {/* "$0" coin */}
        <circle cx="57" cy="54" r="13" fill={G_DARK} />
        <circle cx="57" cy="54" r="13" fill="none" stroke={G_DEEP} strokeWidth="2" />
        <text
          x="57"
          y="58.5"
          fontSize="12"
          fontWeight="800"
          fill={G_INK}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
        >
          $0
        </text>
      </svg>
    ),
  },
  {
    title: "Plan your",
    sub: "purchases",
    icon: (
      <svg {...svg}>
        {/* checklist clipboard (behind, right) */}
        <rect x="42" y="16" width="28" height="40" rx="5" fill={G_LIGHT} />
        <rect x="49" y="12" width="14" height="9" rx="3.5" fill={G_DARK} />
        <g stroke={G_DEEP} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M47 30 l2.4 2.4 4.6 -5.2" />
          <path d="M47 42 l2.4 2.4 4.6 -5.2" />
        </g>
        <g stroke={G_MID} strokeWidth="2.6" strokeLinecap="round">
          <line x1="58" y1="30" x2="65" y2="30" />
          <line x1="58" y1="42" x2="65" y2="42" />
          <line x1="47" y1="52" x2="65" y2="52" />
        </g>
        {/* shopping cart (front, left) */}
        <path d="M21 25 H49 l-4 15 H25 z" fill={G_MID} opacity="0.92" />
        <g fill="none" stroke={G_DEEP} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 15 h6 l6 30 h24 l4 -20 H20" />
        </g>
        <circle cx="26" cy="52" r="4.5" fill={G_DEEP} />
        <circle cx="42" cy="52" r="4.5" fill={G_DEEP} />
      </svg>
    ),
  },
  {
    title: "Know if it's a",
    sub: "good time to buy",
    icon: (
      <svg {...svg}>
        {/* rising chart */}
        <path
          d="M12 55 L28 41 L38 49 L60 26"
          fill="none"
          stroke={G_LIGHT}
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M51 26 h10 v10"
          fill="none"
          stroke={G_LIGHT}
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g fill={G_MID}>
          <circle cx="28" cy="41" r="3" />
          <circle cx="38" cy="49" r="3" />
        </g>
        {/* price tag */}
        <g transform="rotate(-10 34 50)">
          <path
            d="M20 38 h20 a4 4 0 0 1 4 4 v16 a4 4 0 0 1 -4 4 H20 a4 4 0 0 1 -3.4 -1.9 l-6 -10 6 -10 A4 4 0 0 1 20 38 z"
            fill={G_MID}
          />
          <circle cx="16" cy="50" r="2.6" fill={G_INK} />
          <text
            x="30"
            y="55"
            fontSize="14"
            fontWeight="800"
            fill={G_INK}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
          >
            $
          </text>
        </g>
      </svg>
    ),
  },
  {
    title: "Unbiased",
    sub: "recommendations",
    icon: (
      <svg {...svg}>
        {/* sparkle accents */}
        <g stroke={G_LIGHT} strokeWidth="3" strokeLinecap="round">
          <path d="M13 24 l5 3" />
          <path d="M11 36 h6" />
          <path d="M67 24 l-5 3" />
          <path d="M69 36 h-6" />
        </g>
        {/* shield */}
        <path d="M40 11 l21 7 v16 c0 16 -11 25 -21 30 c-10 -5 -21 -14 -21 -30 v-16 z" fill={G_MID} />
        {/* right-side shade for volume */}
        <path d="M40 11 l21 7 v16 c0 16 -11 25 -21 30 z" fill={G_DARK} opacity="0.45" />
        {/* check */}
        <path
          d="M30 40 l7 7 14 -15"
          fill="none"
          stroke={G_INK}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export function Benefits() {
  return (
    <Box
      component="section"
      aria-label="Why BestAIBuys"
      sx={{
        px: { xs: 2.5, sm: 5, md: 9 },
        py: { xs: 6, sm: 8, md: 9 },
        backgroundColor: tokens.bg,
      }}
    >
      <Box
        sx={{
          maxWidth: 1240,
          mx: "auto",
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "repeat(4, 1fr)",
          },
          gap: { xs: 2.5, sm: 3, md: 3.5 },
        }}
      >
        {BENEFITS.map((b) => (
          <Box
            key={b.title}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              px: { xs: 3, md: 3.5 },
              py: { xs: 4, md: 5 },
              backgroundColor: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(255,255,255,0.85)",
              borderRadius: "26px",
              boxShadow: "0 18px 45px rgba(20, 45, 20, 0.08)",
              transition: "transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 24px 55px rgba(20, 45, 20, 0.12)",
              },
              "@media (prefers-reduced-motion: reduce)": {
                transition: "none",
                "&:hover": { transform: "none" },
              },
            }}
          >
            <Box
              aria-hidden
              sx={{
                width: { xs: 96, md: 112 },
                height: { xs: 96, md: 112 },
                mb: { xs: 2, md: 2.5 },
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                // Soft green halo (radial glow) rather than a hard circle, so
                // the illustration reads as floating like the designer's set.
                background: `radial-gradient(circle at 50% 46%, ${HALO} 0%, ${HALO} 40%, transparent 72%)`,
              }}
            >
              {b.icon}
            </Box>

            <Typography
              component="h3"
              sx={{
                fontFamily: tokens.fontSans,
                fontSize: { xs: 22, md: 25 },
                fontWeight: 800,
                lineHeight: 1.15,
                color: tokens.ink,
              }}
            >
              {b.title}
            </Typography>
            <Typography
              sx={{
                fontFamily: tokens.fontSans,
                fontSize: { xs: 17, md: 18 },
                fontWeight: 500,
                lineHeight: 1.25,
                color: tokens.ink2,
                mt: 0.75,
              }}
            >
              {b.sub}
            </Typography>

            {/* Accent bar — Alex's `::after` underline. */}
            <Box
              aria-hidden
              sx={{
                width: 52,
                height: 3,
                mt: { xs: 2.5, md: 3 },
                borderRadius: 10,
                backgroundColor: ACCENT,
              }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
