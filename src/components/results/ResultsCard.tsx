import { useState, type ReactElement } from "react";
import { Box, Typography } from "@mui/material";
import type { Recommendation } from "@/types/product";
import { RatingStars } from "@/components/shared/RatingStars";
import { buildRetailerSearchUrl } from "@/utils/formatPrice";
import { pickProductImage } from "@/utils/mockProducts";
import { tokens } from "@/config/theme";
import { useSavedFinds, recommendationId } from "@/context/SavedFindsContext";
import { useShoppingFlow } from "@/hooks/useShoppingFlow";
import { useResultsPriceSummary } from "@/hooks/useResultsPriceSummary";
import { extractAsin } from "@/utils/amazon";
import {
  derivePriceIntelligence,
  SavingsPill,
  PriceInsight,
} from "@/components/results/PriceContext";
import { AddToPlannerButton } from "@/components/planner/AddToPlannerButton";

export type ResultsCardVariant = "top-rated" | "best-match" | "alternative";

interface ResultsCardProps {
  variant: ResultsCardVariant;
  recommendation: Recommendation;
}

/**
 * BES-39 product card — single reusable surface for the two-card
 * results layout. Variant drives the badge styling (green star for
 * Top Rated; blue target for Best Match) and the Best Match's caption
 * beneath the badge. Everything else is shared between variants so
 * the cards read as siblings.
 */

/**
 * Variant-driven styling for the two card variants.
 *
 * Per Alex's 2026-06-21 review:
 *   - Best Match is the personalised pick — should read as DOMINANT.
 *     Green palette (badge + Buy button) — green is BestAIBuys' primary
 *     accent and immediately communicates "this is the recommended one".
 *   - Top Rated is the category leader — supporting. Blue palette
 *     (badge + Buy button) — cooler, less assertive than green so it
 *     doesn't fight the Best Match for attention.
 *
 * `dominant` drives a small visual emphasis bump (slightly heavier
 * border + a brand-coloured outer ring on the card) so Best Match
 * reads as the lead pick even before the user notices the badges.
 */
const VARIANT_STYLES: Record<
  ResultsCardVariant,
  {
    badgeBg: string;
    badgeFg: string;
    badgeLabel: string;
    icon: (size: number) => ReactElement;
    caption?: string;
    /** Buy-button background colour. */
    buyBg: string;
    /** Buy-button hover background colour (slightly darker). */
    buyBgHover: string;
    /** Soft brand-coloured glow under the buy button. */
    buyShadow: string;
    /** Whether this card carries the extra visual prominence. */
    dominant: boolean;
  }
> = {
  "top-rated": {
    badgeBg: tokens.blueSoft,
    badgeFg: tokens.blueDeep,
    badgeLabel: "Top Rated",
    icon: (size) => (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
        <path d="M12 2l2.9 6.6 7.1.7-5.4 4.9 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.3l7.1-.7L12 2z" />
      </svg>
    ),
    buyBg: tokens.blueDeep,
    buyBgHover: "#1B3A5C",
    buyShadow: "0 6px 16px -8px rgba(36,74,117,0.6)",
    dominant: false,
  },
  "best-match": {
    badgeBg: tokens.greenDeep,
    badgeFg: "#fff",
    badgeLabel: "Best Match for You",
    icon: (size) => (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    ),
    caption: "Selected based on your answers and preferences.",
    buyBg: tokens.greenDeep,
    buyBgHover: "#4AA33D",
    buyShadow: "0 6px 16px -8px rgba(92,186,73,0.6)",
    dominant: true,
  },
  // Runner-up pick shown alongside Best Match on Continue-search turns.
  // Supporting (blue, non-dominant) so it reads as the secondary option.
  alternative: {
    badgeBg: tokens.blueSoft,
    badgeFg: tokens.blueDeep,
    badgeLabel: "Alternative",
    icon: (size) => (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M4 7h13M4 7l3-3M4 7l3 3" />
        <path d="M20 17H7M20 17l-3-3M20 17l-3 3" />
      </svg>
    ),
    caption: "Another strong match for your answers.",
    buyBg: tokens.blueDeep,
    buyBgHover: "#1B3A5C",
    buyShadow: "0 6px 16px -8px rgba(36,74,117,0.6)",
    dominant: false,
  },
};

const RETAILER_VISUALS: Record<string, { bg: string; fg: string; glyph: string; ring?: string }> = {
  Amazon: { bg: "#FF9900", fg: "#000", glyph: "a" },
  Target: { bg: "#FFFFFF", fg: "#CC0000", glyph: "◉", ring: "#CC0000" },
  Walmart: { bg: "#0071CE", fg: "#FFC220", glyph: "✦" },
  "Best Buy": { bg: "#0046BE", fg: "#FFF200", glyph: "BB" },
  Nordstrom: { bg: "#000", fg: "#fff", glyph: "N" },
  "Famous Footwear": { bg: "#E53935", fg: "#fff", glyph: "F" },
  Zappos: { bg: "#001E5F", fg: "#fff", glyph: "Z" },
  adidas: { bg: "#000", fg: "#fff", glyph: "a" },
  REI: { bg: "#3E5E3F", fg: "#fff", glyph: "R" },
};

function RetailerLogo({ name }: { name: string }) {
  const r =
    RETAILER_VISUALS[name] ?? { bg: tokens.bgElev, fg: tokens.ink, glyph: name.charAt(0).toUpperCase() };
  return (
    <Box
      sx={{
        width: 28,
        height: 28,
        borderRadius: "6px",
        display: "grid",
        placeItems: "center",
        fontSize: 13,
        fontWeight: 700,
        flexShrink: 0,
        backgroundColor: r.bg,
        color: r.fg,
        border: r.ring ? `2px solid ${r.ring}` : "none",
        fontFamily: tokens.fontSans,
      }}
    >
      {r.glyph}
    </Box>
  );
}

function hasRealUrl(url: string | undefined): boolean {
  return !!url && url.startsWith("http") && url.length > 20;
}

function ArrowOut({ size = 14 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

function Badge({ variant }: { variant: ResultsCardVariant }) {
  const v = VARIANT_STYLES[variant];
  // BES-49: type + pill metrics are explicit constants here so both
  // variants render at the exact same size, and so they match the
  // Best Match LOADING badge in BestMatchLoadingCard (weight 700, gap
  // 7px, padding 7×13). Without that the loaded Top Rated badge
  // (which sits next to the loading Best Match badge for ~10–30 s)
  // looked subtly lighter.
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        px: "13px",
        py: "7px",
        borderRadius: 999,
        backgroundColor: v.badgeBg,
        color: v.badgeFg,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.005em",
        fontFamily: tokens.fontSans,
      }}
    >
      {v.icon(14)}
      {v.badgeLabel}
    </Box>
  );
}

export function ResultsCard({ variant, recommendation }: ResultsCardProps) {
  const [imgError, setImgError] = useState(false);
  const { isSaved, requestSave } = useSavedFinds();
  const { state } = useShoppingFlow();
  const saveId = recommendationId(recommendation);
  const saved = isSaved(saveId);

  const handleSaveToggle = () => {
    requestSave(recommendation, state.query);
  };

  const v = VARIANT_STYLES[variant];

  const imageSrc =
    !imgError && recommendation.imageUrl
      ? recommendation.imageUrl
      : pickProductImage(recommendation.name);

  const lowest = recommendation.retailers[0];
  const alt = recommendation.retailers[1];
  const buyUrl =
    lowest && hasRealUrl(lowest.url)
      ? lowest.url
      : buildRetailerSearchUrl(lowest?.name ?? "Amazon", recommendation.name);

  // BES-50 — price intelligence on result cards.
  //   - listPrice (Oxylabs / BES-53) drives the "You Save / % OFF" pill.
  //   - 30-day median (Keepa / BES-56) drives "Good Buy" or "Above 30-Day
  //     Average".
  // BOTH data sources are AMAZON-ONLY (Keepa history keyed by ASIN; Oxylabs
  // MSRP on the Amazon/Walmart listing). The displayed `lowest` retailer is
  // often eBay / Best Buy / a DTC store with neither — so don't look up against
  // it. Source the Keepa curve from whichever retailer resolves to an ASIN, and
  // the list price from whichever retailer actually returned one, then compare
  // against the price the user sees (`lowest`). Renders nothing when no retailer
  // carries the data (e.g. Amazon-less DTC products) — the soft-fail is in
  // useResultsPriceSummary / derivePriceIntelligence.
  const keepaRetailer = recommendation.retailers.find((r) => extractAsin(r.url));
  const retailerListPrice = recommendation.retailers.find((r) => r.listPrice)?.listPrice;
  const { summary: priceSummary } = useResultsPriceSummary(keepaRetailer?.url);
  const priceIntel = derivePriceIntelligence(
    lowest ? { ...lowest, listPrice: lowest.listPrice ?? retailerListPrice } : lowest,
    priceSummary,
  );

  return (
    <Box
      component="article"
      aria-label={`${v.badgeLabel}: ${recommendation.name}`}
      sx={{
        position: "relative",
        width: "100%",
        backgroundColor: tokens.bgElev,
        borderRadius: "22px",
        // Best Match is the dominant pick: thicker green-tinted border
        // + a soft green glow so the eye lands on it before the Top
        // Rated card next to it. Top Rated keeps the quiet 1px rule
        // border so it reads as supporting context, not competing.
        border: v.dominant
          ? `2px solid ${tokens.green}`
          : `1px solid ${tokens.rule}`,
        boxShadow: v.dominant
          ? `${tokens.shadowMd}, 0 0 0 4px color-mix(in oklab, ${tokens.green} 14%, transparent)`
          : tokens.shadowMd,
        display: "flex",
        flexDirection: "column",
        // Clip everything to the rounded outer — prevents tall product
        // images (e.g. shampoo bottles) from bleeding past the image
        // slot and overlapping the title underneath.
        overflow: "hidden",
        transition: "transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: v.dominant
            ? `${tokens.shadowLg}, 0 0 0 4px color-mix(in oklab, ${tokens.green} 22%, transparent)`
            : tokens.shadowLg,
        },
      }}
    >
      {/* Top row: badge + action cluster (Plan + Save). The cluster wraps
          below the badge on very narrow cards so neither pill is clipped. */}
      <Box
        sx={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: { xs: "wrap", sm: "nowrap" },
          rowGap: 1,
          gap: 1.5,
          px: { xs: 2.25, sm: 2.5 },
          pt: { xs: 2.25, sm: 2.5 },
          zIndex: 2,
        }}
      >
        <Badge variant={variant} />

        {/* Plan + Save sit together — two sibling lists, two accents
            (blue = Plan, green = Save). Plan leads so Save keeps its
            established far-right corner position. */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            flexShrink: 0,
            ml: { xs: "auto", sm: 0 },
          }}
        >
          <AddToPlannerButton recommendation={recommendation} query={state.query} variant="pill" />

          <Box
            role="button"
            aria-label={saved ? "Unsave this pick" : "Save this pick"}
          aria-pressed={saved}
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSaveToggle();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              handleSaveToggle();
            }
          }}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            px: "10px",
            py: "6px",
            borderRadius: 999,
            backgroundColor: saved ? tokens.greenDeep : tokens.bgElev,
            color: saved ? "#fff" : tokens.ink,
            border: saved ? "none" : `1px solid ${tokens.rule}`,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: tokens.fontSans,
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(0,0,0,.05)",
            transition: "background-color .15s, color .15s, transform .15s",
            userSelect: "none",
            "&:hover": { transform: "translateY(-1px)" },
            "&:focus-visible": {
              outline: `2px solid ${tokens.greenDeep}`,
              outlineOffset: 2,
            },
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width={14}
            height={14}
            fill={saved ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
            {saved ? "Saved" : "Save"}
          </Box>
        </Box>
      </Box>

      {v.caption && (
        <Typography
          sx={{
            position: "relative",
            zIndex: 2,
            mt: 0.5,
            px: { xs: 2.25, sm: 2.5 },
            fontSize: 12.5,
            color: tokens.ink2,
            lineHeight: 1.4,
          }}
        >
          {v.caption}
        </Typography>
      )}

      {/* Product image — FIXED height (not aspect-ratio).
          Aspect-ratio scaled the image vertically as the card got
          wider, making a 500 px-wide card produce a 400 px-tall image
          block and a 700 px+ total card. A fixed-height slot keeps
          the image legible and the whole card inside one viewport.
          `overflow: hidden` clips any image that tries to grow taller
          than the slot — without it, tall portraits (shampoo bottles)
          escape downward and overlap the title underneath. */}
      <Box
        sx={{
          position: "relative",
          // Compact heights so both cards fit the viewport without scrolling,
          // even in the taller "above 30-day average" state.
          height: { xs: 138, sm: 156, md: 172 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: tokens.bgElev,
          px: { xs: 2, sm: 3 },
          py: 1,
          overflow: "hidden",
        }}
      >
        {/* Savings overlay — top-left of image area when the current
            price is below the 30-day average (or vs list price). */}
        <SavingsPill intel={priceIntel} />
        <Box
          component="img"
          src={imageSrc}
          alt={recommendation.name}
          onError={() => setImgError(true)}
          sx={{
            display: "block",
            maxWidth: "78%",
            maxHeight: "100%",
            objectFit: "contain",
          }}
        />
      </Box>

      {/* Body */}
      <Box
        sx={{
          px: { xs: 2.5, sm: 3 },
          pb: 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography
          component="h3"
          sx={{
            fontSize: { xs: 18, sm: 20 },
            fontWeight: 700,
            lineHeight: 1.25,
            color: tokens.ink,
            mb: 0.75,
            // Clamp to 2 lines with a reserved height so 1-line and 2-line
            // titles occupy the same space — keeps the two cards aligned.
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "2.5em",
          }}
        >
          {recommendation.name}
        </Typography>
        {/* Always reserve the description slot (2 lines) even when a preview
            (Top Rated) product has no oneLiner — so the two cards' bodies are
            the same height and everything below lines up. */}
        <Typography
          sx={{
            fontSize: 14,
            color: tokens.ink2,
            lineHeight: 1.45,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "2.9em",
            mb: 1,
          }}
        >
          {recommendation.oneLiner}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
          <RatingStars rating={recommendation.rating} reviewCount={recommendation.reviewCount} />
        </Box>
      </Box>

      {/* Retailer block (pinned to bottom). The unified PriceInsight verdict
          sits directly above the Buy button and ALWAYS renders (one of four
          fixed-height states) so both cards stay the same height regardless
          of the price situation. */}
      <Box
        component="ul"
        sx={{
          listStyle: "none",
          p: 0,
          m: { xs: "auto 14px 16px", sm: "auto 16px 18px" },
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
        }}
      >
        <Box component="li" sx={{ display: "block" }}>
          <PriceInsight intel={priceIntel} />
        </Box>
        {lowest && (
          <Box component="li" sx={{ display: "block" }}>
            <Box
              component="a"
              href={buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Buy ${recommendation.name} at ${lowest.name} for ${lowest.price}`}
              sx={{
                position: "relative",
                zIndex: 2,
                display: "grid",
                gridTemplateColumns: "32px 1fr auto auto",
                alignItems: "center",
                gap: 1.5,
                minHeight: 56,
                padding: "14px 18px",
                // Buy button picks up the variant colour — green for
                // the dominant Best Match pick, deep blue for Top
                // Rated — so the two cards differentiate even at a
                // glance (per Alex's 2026-06-21 review).
                backgroundColor: v.buyBg,
                color: "#fff",
                borderRadius: "14px",
                textDecoration: "none",
                fontSize: 15,
                fontWeight: 600,
                transition: "background-color .15s, transform .15s",
                boxShadow: v.buyShadow,
                "&:hover": {
                  backgroundColor: v.buyBgHover,
                  transform: "translateY(-1px)",
                },
                "&:focus-visible": {
                  outline: `2px solid ${tokens.ink}`,
                  outlineOffset: 2,
                },
              }}
            >
              <RetailerLogo name={lowest.name} />
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: 13.5,
                  color: "#fff",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                BUY AT {lowest.name}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: 15,
                  fontVariantNumeric: "tabular-nums",
                  color: "#fff",
                }}
              >
                {lowest.price}
              </Typography>
              <ArrowOut size={16} />
            </Box>
          </Box>
        )}

        {lowest && (
          <Box component="li" sx={{ minHeight: 44 }}>
            {alt && (() => {
              const href = hasRealUrl(alt.url)
                ? alt.url
                : buildRetailerSearchUrl(alt.name, recommendation.name);
              return (
                <Box
                  component="a"
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Also at ${alt.name} for ${alt.price}`}
                  sx={{
                    position: "relative",
                    zIndex: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    padding: "10px 14px",
                    backgroundColor: tokens.bg,
                    border: `1px solid ${tokens.rule}`,
                    borderRadius: "14px",
                    textDecoration: "none",
                    color: tokens.ink2,
                    fontSize: 13,
                    transition: "all .15s",
                    "&:hover": {
                      borderColor: tokens.ink2,
                      color: tokens.ink,
                      transform: "translateX(2px)",
                    },
                  }}
                >
                  <Typography component="span" sx={{ fontSize: 12, color: tokens.ink3 }}>
                    Also at
                  </Typography>
                  <Typography
                    component="span"
                    sx={{ fontWeight: 500, fontSize: 13, color: "inherit" }}
                  >
                    {alt.name}
                  </Typography>
                  <Box component="span" sx={{ flex: 1 }} />
                  <Typography
                    component="span"
                    sx={{
                      fontSize: 13,
                      fontVariantNumeric: "tabular-nums",
                      color: "inherit",
                    }}
                  >
                    {alt.price}
                  </Typography>
                  <ArrowOut size={12} />
                </Box>
              );
            })()}
          </Box>
        )}
      </Box>

      <Box
        component="a"
        href={buyUrl}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={-1}
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          borderRadius: "inherit",
        }}
      />
    </Box>
  );
}

/**
 * Skeleton placeholder that fills the slot of a ResultsCard while the
 * backend is still working. The ChatGPT-style status text — a centered,
 * softly pulsing label like "Finding your best match…" — makes it
 * obvious the slot is reserved (not empty) and tells the user what
 * we're doing. Same border + radius + height as the real card so the
 * eventual swap is jump-free.
 */
export function ResultsCardSkeleton({
  variant,
  statusText,
  reducedMotion = false,
}: {
  variant: ResultsCardVariant;
  /** Centered status message. If absent, only the shimmer renders. */
  statusText?: string;
  reducedMotion?: boolean;
}) {
  return (
    <Box
      role="status"
      aria-live="polite"
      aria-label={statusText ?? "Loading"}
      sx={{
        position: "relative",
        width: "100%",
        backgroundColor: tokens.bgElev,
        borderRadius: "22px",
        border: `1px solid ${tokens.rule}`,
        boxShadow: tokens.shadowMd,
        display: "flex",
        flexDirection: "column",
        minHeight: { xs: 460, sm: 540 },
        overflow: "hidden",
      }}
    >
      {/* Soft shimmer overlay so the surface visibly "breathes" */}
      {!reducedMotion && (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(90deg, transparent 0%, ${tokens.bg} 50%, transparent 100%)`,
            backgroundSize: "200% 100%",
            animation: "skeletonShimmer 2.4s ease-in-out infinite",
            opacity: 0.55,
            pointerEvents: "none",
            "@keyframes skeletonShimmer": {
              "0%": { backgroundPosition: "-200% 0" },
              "100%": { backgroundPosition: "200% 0" },
            },
          }}
        />
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", p: 2.5, position: "relative", zIndex: 1 }}>
        <Badge variant={variant} />
        <Box
          sx={{
            width: 76,
            height: 28,
            borderRadius: 999,
            backgroundColor: tokens.bg,
            border: `1px solid ${tokens.rule}`,
          }}
        />
      </Box>

      {/* Center: pulsing status text + dots */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
          px: 3,
          position: "relative",
          zIndex: 1,
        }}
      >
        {statusText && (
          <>
            <Box
              aria-hidden
              sx={{
                display: "inline-flex",
                gap: 0.5,
              }}
            >
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor:
                      variant === "best-match" ? tokens.blueDeep : tokens.greenDeep,
                    ...(reducedMotion
                      ? { opacity: 0.5 }
                      : {
                          animation: `statusDot 1.2s ease-in-out ${i * 0.15}s infinite`,
                          "@keyframes statusDot": {
                            "0%, 100%": { opacity: 0.25, transform: "translateY(0)" },
                            "50%": { opacity: 1, transform: "translateY(-3px)" },
                          },
                        }),
                  }}
                />
              ))}
            </Box>
            <Typography
              sx={{
                fontFamily: tokens.fontSans,
                fontSize: { xs: 15, sm: 16 },
                fontWeight: 500,
                color: tokens.ink,
                textAlign: "center",
                ...(reducedMotion
                  ? {}
                  : {
                      animation: "statusTextPulse 2.2s ease-in-out infinite",
                      "@keyframes statusTextPulse": {
                        "0%, 100%": { opacity: 0.7 },
                        "50%": { opacity: 1 },
                      },
                    }),
              }}
            >
              {statusText}
            </Typography>
          </>
        )}
      </Box>

      {/* Bottom placeholder rows so the card has weight */}
      <Box sx={{ px: 3, pb: 2.5, position: "relative", zIndex: 1 }}>
        <Box sx={{ height: 14, borderRadius: 7, backgroundColor: tokens.bg, width: "70%", mb: 1 }} />
        <Box sx={{ height: 12, borderRadius: 6, backgroundColor: tokens.bg, width: "50%", mb: 2 }} />
        <Box
          sx={{
            height: 48,
            borderRadius: "12px",
            backgroundColor: `color-mix(in oklab, ${tokens.green} 18%, ${tokens.bgElev})`,
            border: `1px dashed ${tokens.rule}`,
          }}
        />
      </Box>
    </Box>
  );
}
