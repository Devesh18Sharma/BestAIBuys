import { Box, Typography } from "@mui/material";
import { tokens } from "@/config/theme";
import type { Retailer } from "@/types/product";
import type { PriceSummary } from "@/services/api/wishlist";

/**
 * BES-50 — price intelligence on result cards.
 *
 * Two INDEPENDENT signals:
 *
 *   1. SavingsPill (uses `listPrice` from Oxylabs — BES-53). A green
 *      "You Save $X / Y% OFF" pill over the image, when current < list.
 *
 *   2. PriceInsight (uses `avg30Day` from the Keepa-backed
 *      PriceSummary.median — BES-56). A SINGLE fixed-height verdict row
 *      that ALWAYS renders in one of four balanced states — good / high /
 *      fair / unknown — so the two result cards are always the same
 *      height and green vs red take identical space, regardless of the
 *      data situation.
 */

// ────────────────────────────────────────────────────────────────────
// Domain model
// ────────────────────────────────────────────────────────────────────

export interface PriceIntelligence {
  /** Current/sell price the user sees on the card (always present). */
  currentPrice: number;
  /** Retail/MSRP price from Oxylabs (BES-53). Omitted when absent. */
  listPrice?: number;
  /** 30-day median from Keepa (BES-56). Omitted when absent. */
  avg30Day?: number;
}

/** Discount threshold below which we suppress the savings pill (rounding noise). */
const MIN_SAVINGS_PCT = 1;
/** Threshold above/below avg30Day at which we flip out of the neutral band. */
const AVG_BAND_PCT = 0.01; // ±1%

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

/** Parse "$129.99" / "129" → 129.99. Returns NaN when no number. */
function parseUSD(price: string | undefined): number {
  if (!price) return NaN;
  const m = price.replace(/,/g, "").match(/[\d.]+/);
  return m ? parseFloat(m[0]) : NaN;
}

/**
 * Derive the PriceIntelligence shape from the card's data sources.
 *
 * Dev-mode fallback: in `import.meta.env.DEV` ONLY we fill deterministic
 * mock values per product so the signals render locally before/without a
 * live backend. Real data always wins (we never replace a real value).
 * The `dev*` block is dead code in production — Vite tree-shakes it out.
 */
export function derivePriceIntelligence(
  retailer: Retailer | undefined,
  summary: PriceSummary | null | undefined,
): PriceIntelligence {
  const currentPrice = parseUSD(retailer?.price);
  let list = parseUSD(retailer?.listPrice);
  let avg = summary?.median ?? NaN;

  if (import.meta.env.DEV && retailer) {
    const mock = devMockFor(retailer.url ?? retailer.name, currentPrice);
    if (!isFinite(list) || list <= 0) list = mock.listPrice ?? list;
    if (!isFinite(avg) || avg <= 0) avg = mock.avg30Day ?? avg;
  }

  return {
    currentPrice: isFinite(currentPrice) ? currentPrice : 0,
    listPrice: isFinite(list) && list > 0 ? list : undefined,
    avg30Day: isFinite(avg) && avg > 0 ? avg : undefined,
  };
}

/**
 * DEV-ONLY deterministic mock so the BES-50 UI renders without a live
 * backend. Hashes the seedKey into a small bucket so different products
 * land in different verdicts (deal / expensive / neutral / no-data) —
 * handy for eyeballing every permutation on one screen. Tree-shaken out
 * of production via the `import.meta.env.DEV` short-circuit above.
 */
function devMockFor(
  seedKey: string,
  currentPrice: number,
): { listPrice?: number; avg30Day?: number } {
  if (!isFinite(currentPrice) || currentPrice <= 0) return {};

  let h = 0;
  for (let i = 0; i < seedKey.length; i++) {
    h = (h << 5) - h + seedKey.charCodeAt(i);
    h |= 0;
  }
  // 4 buckets so a single screen can show good / high / fair / no-data.
  const bucket = Math.abs(h) % 4;

  if (bucket === 0) {
    // Deal: below 30-day avg + a real discount vs list.
    return { listPrice: round2(currentPrice * 1.4), avg30Day: round2(currentPrice * 1.15) };
  }
  if (bucket === 1) {
    // Expensive: above the 30-day average.
    return { avg30Day: round2(currentPrice * 0.9) };
  }
  if (bucket === 2) {
    // Fair: right at the 30-day average.
    return { avg30Day: round2(currentPrice) };
  }
  // bucket 3 → no data at all (unknown state).
  return {};
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ────────────────────────────────────────────────────────────────────
// SavingsPill — top-left of image area.
// Shown only when listPrice is present AND currentPrice < listPrice.
// ────────────────────────────────────────────────────────────────────

export function SavingsPill({ intel }: { intel: PriceIntelligence }) {
  if (intel.listPrice == null) return null;
  if (intel.currentPrice >= intel.listPrice) return null;

  const savedAmount = intel.listPrice - intel.currentPrice;
  const savedPct = Math.round((savedAmount / intel.listPrice) * 100);
  if (savedPct < MIN_SAVINGS_PCT) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        top: 12,
        left: 12,
        zIndex: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 0.5,
        pointerEvents: "none",
      }}
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.75,
          px: 1.25,
          py: 0.875,
          borderRadius: "14px",
          backgroundColor: "#E8F5E9",
          border: "1px solid #BFE3C2",
          color: "#1B7A2F",
          boxShadow: "0 4px 12px -6px rgba(34,162,59,.35)",
        }}
      >
        <Box
          aria-hidden
          sx={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            backgroundColor: "#22A23B",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width={14}
            height={14}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
            <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
          </svg>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: "#3F8F4D",
              letterSpacing: ".02em",
            }}
          >
            You Save
          </Typography>
          <Typography
            sx={{
              fontSize: 17,
              fontWeight: 800,
              color: "#1B7A2F",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1.1,
            }}
            aria-label={`You save ${usd.format(savedAmount)}`}
          >
            {usd.format(savedAmount)}
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          px: 1.125,
          py: 0.5,
          borderRadius: 999,
          backgroundColor: "#CFEAD2",
          color: "#1B7A2F",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: ".02em",
        }}
        aria-label={`${savedPct}% off the list price`}
      >
        {savedPct}% OFF
      </Box>
    </Box>
  );
}

// ────────────────────────────────────────────────────────────────────
// PriceInsight — the 30-day-history verdict. ONE fixed-height row that
// ALWAYS renders, in four balanced states, so both result cards stay the
// same height and green/red take identical space no matter the data:
//   good    — clearly below the 30-day average   (green)
//   high    — clearly above the 30-day average    (red)
//   fair    — within ±1% of the average           (neutral)
//   unknown — no Keepa history (Amazon-less/DTC)   (neutral)
// Replaces the old GoodBuyFooter + AboveAverageBlock, whose very
// different heights left one card gapped next to the other.
// ────────────────────────────────────────────────────────────────────

type InsightState = "good" | "high" | "fair" | "unknown";

interface InsightStyle {
  bg: string;
  border: string;
  iconBg: string;
  title: string;
  sub: string;
}

/** Resolve the verdict + copy from the intel. Pure — no side effects. */
function resolveInsight(intel: PriceIntelligence): {
  state: InsightState;
  style: InsightStyle;
} {
  const avg = intel.avg30Day;
  if (avg == null || avg <= 0) {
    return { state: "unknown", style: INSIGHT_STYLES.unknown };
  }
  const ratio = intel.currentPrice / avg;
  const pct = Math.max(1, Math.round(Math.abs(ratio - 1) * 100));
  if (ratio < 1 - AVG_BAND_PCT) {
    return {
      state: "good",
      style: { ...INSIGHT_STYLES.good, sub: `${pct}% below its 30-day average` },
    };
  }
  if (ratio > 1 + AVG_BAND_PCT) {
    return {
      state: "high",
      style: { ...INSIGHT_STYLES.high, sub: `${pct}% above its 30-day average` },
    };
  }
  return { state: "fair", style: INSIGHT_STYLES.fair };
}

const INSIGHT_STYLES: Record<InsightState, InsightStyle> = {
  good: {
    bg: "#F0F8F1",
    border: "#CFE7D2",
    iconBg: "#22A23B",
    title: "Good Buy",
    sub: "Below its 30-day average",
  },
  high: {
    bg: "#FEF4F2",
    border: "#F7D2CC",
    iconBg: "#EF5340",
    title: "Priced High",
    sub: "Above its 30-day average",
  },
  fair: {
    // Amber = neutral / fair — neither a deal nor a warning. Warmer and
    // clearer than grey (which read as "disabled").
    bg: "#FEF6E4",
    border: "#F3E1AE",
    iconBg: "#E3A324",
    title: "Fair Price",
    sub: "Right at its 30-day average",
  },
  unknown: {
    bg: "#F5F5F2",
    border: "#E5E4DF",
    iconBg: "#B4B4AE",
    title: "No Price History",
    sub: "Not tracked for this item",
  },
};

function InsightIcon({ state }: { state: InsightState }) {
  const p = {
    viewBox: "0 0 24 24",
    width: 15,
    height: 15,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (state === "good") return <svg {...p}><path d="M20 6 9 17l-5-5" /></svg>;
  if (state === "high")
    return (
      <svg {...p}>
        <polyline points="3 17 9 11 13 15 21 7" />
        <polyline points="15 7 21 7 21 13" />
      </svg>
    );
  if (state === "fair") return <svg {...p}><path d="M5 12h14" /></svg>;
  // unknown — a clock ("no history yet")
  return (
    <svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4l2.5 2.5" />
    </svg>
  );
}

export function PriceInsight({ intel }: { intel: PriceIntelligence }) {
  const { state, style } = resolveInsight(intel);
  const showStat = intel.avg30Day != null && intel.avg30Day > 0;

  return (
    <Box
      role="status"
      aria-label={`${style.title} — ${style.sub}`}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        px: 1.5,
        py: 1,
        // Fixed footprint → every card matches regardless of verdict.
        minHeight: 54,
        borderRadius: 12,
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 26,
          height: 26,
          flexShrink: 0,
          borderRadius: "50%",
          backgroundColor: style.iconBg,
          color: "#fff",
          display: "grid",
          placeItems: "center",
        }}
      >
        <InsightIcon state={state} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{ fontSize: 13, fontWeight: 700, color: tokens.ink, lineHeight: 1.2 }}
        >
          {style.title}
        </Typography>
        <Typography
          sx={{
            fontSize: 11.5,
            color: tokens.ink2,
            lineHeight: 1.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {style.sub}
        </Typography>
      </Box>

      {showStat && (
        <Box
          sx={{
            flexShrink: 0,
            textAlign: "right",
            pl: 1.25,
            borderLeft: `1px solid ${style.border}`,
          }}
        >
          <Typography
            sx={{
              fontSize: 9.5,
              fontWeight: 600,
              letterSpacing: ".04em",
              textTransform: "uppercase",
              color: tokens.ink3,
              lineHeight: 1.1,
            }}
          >
            30-Day Avg
          </Typography>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 800,
              color: tokens.ink,
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1.2,
            }}
          >
            {usd.format(intel.avg30Day!)}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
