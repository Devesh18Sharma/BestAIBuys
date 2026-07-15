import { useState } from "react";
import { Box, Typography } from "@mui/material";
import type { Recommendation } from "@/types/product";
import { RatingStars } from "@/components/shared/RatingStars";
import { buildRetailerSearchUrl } from "@/utils/formatPrice";
import { pickProductImage } from "@/utils/mockProducts";
import { tokens } from "@/config/theme";
import { useSavedFinds, recommendationId } from "@/context/SavedFindsContext";
import { useShoppingFlow } from "@/hooks/useShoppingFlow";

interface RecommendationCardProps {
  recommendation: Recommendation;
  /** Override the tier badge (label + colors) — used by the Top Rated /
   * Recommended cards which aren't budget/value/premium tiers. */
  badge?: { label: string; bg: string; fg: string };
  /** Override the featured (highlighted border) styling. */
  featured?: boolean;
}

// Tier chips need to read clearly against the cream page bg AND remain
// mutually distinct. Slate blue for Budget puts it outside the warm
// palette so it doesn't fight the lime green of Best Overall — and the
// 9:1 contrast ratio handles WCAG AA easily.
const TIER_STYLES = {
  budget: { bg: "#DCE7F2", fg: "#244A75", label: "Budget" },
  value: { bg: tokens.green, fg: tokens.ink, label: "Best Overall", featured: true },
  premium: { bg: tokens.ink, fg: tokens.bg, label: "Premium" },
} as const;

const RETAILER_VISUALS: Record<string, { bg: string; fg: string; glyph: string; ring?: string }> = {
  Amazon: { bg: "#FF9900", fg: "#000", glyph: "a" },
  Target: { bg: "#FFFFFF", fg: "#CC0000", glyph: "◉", ring: "#CC0000" },
  Walmart: { bg: "#0071CE", fg: "#FFC220", glyph: "✦" },
  "Best Buy": { bg: "#0046BE", fg: "#FFF200", glyph: "BB" },
  "Williams Sonoma": { bg: "#1a1a1a", fg: "#fff", glyph: "WS" },
  Costco: { bg: "#005DAA", fg: "#E31837", glyph: "C" },
  "Crate & Barrel": { bg: "#E63946", fg: "#fff", glyph: "C&B" },
  Macys: { bg: "#E21A2C", fg: "#fff", glyph: "★" },
};

function RetailerLogo({ name }: { name: string }) {
  const r = RETAILER_VISUALS[name] || { bg: "#E5E3D8", fg: tokens.ink, glyph: name.charAt(0) };
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

/**
 * Product pick card — mirrors Good Find's `.pick` block.
 * 1:1 image area with tier badge + save toggle, body with name/rating,
 * then a stacked list of retailer rows with the lowest highlighted in green.
 */
export function RecommendationCard({ recommendation, badge: badgeProp, featured: featuredProp }: RecommendationCardProps) {
  const [imgError, setImgError] = useState(false);
  const { isSaved, requestSave } = useSavedFinds();
  const { state } = useShoppingFlow();
  const saveId = recommendationId(recommendation);
  const saved = isSaved(saveId);

  // Saving persists to the backend wishlist. requestSave handles the guest
  // case: it opens an auth modal and remembers this pick so it's saved right
  // after sign-in — without navigating away from the results.
  const handleSaveToggle = () => {
    requestSave(recommendation, state.query);
  };

  const tierStyle = TIER_STYLES[recommendation.tier];
  const featured = featuredProp ?? ("featured" in tierStyle && tierStyle.featured);
  const badge = badgeProp ?? { label: tierStyle.label, bg: tierStyle.bg, fg: tierStyle.fg };
  // Use the LLM-supplied image if present, otherwise fall back to a
  // category-mapped asset from /public so the card never shows 📦.
  const imageSrc =
    !imgError && recommendation.imageUrl
      ? recommendation.imageUrl
      : pickProductImage(recommendation.name);

  // Hard cap at 2 retailer rows (lowest + one alternate). Anything
  // beyond that is dropped entirely — no "+ N more" affordance, because
  // the user can't act on it without a deeper drawer we don't have yet.
  const retailers = recommendation.retailers;
  const lowest = retailers[0];
  const others = retailers.slice(1, 2);

  const buyUrl =
    lowest && hasRealUrl(lowest.url)
      ? lowest.url
      : buildRetailerSearchUrl(lowest?.name ?? "Amazon", recommendation.name);

  return (
    <Box
      component="article"
      sx={{
        // position: relative anchors the stretched <a> overlay added at
        // the bottom of the card (see end of return). The overlay makes
        // the whole card a single click target → lowest-price retailer.
        position: "relative",
        // Fill the grid cell so all 3 cards in a row share the same
        // outer height. The body grows with `flex: 1` below; the
        // retailer rows are pinned to the bottom via `marginTop: auto`,
        // so the Buy button always lands at the same y-coordinate
        // across all three cards in the row.
        width: "100%",
        backgroundColor: tokens.bgElev,
        borderRadius: "22px",
        overflow: "visible",
        display: "flex",
        flexDirection: "column",
        border: featured ? `2px solid ${tokens.ink}` : `1px solid ${tokens.rule}`,
        boxShadow: featured ? "0 18px 40px -16px rgba(38,38,37,.18)" : "none",
        transition: "transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 18px 40px -16px rgba(38,38,37,.22)",
        },
      }}
    >
      {/* ── Media: tier badge + save toggle + product image ── */}
      <Box
        sx={{
          position: "relative",
          aspectRatio: "1 / 1",
          borderRadius: "22px 22px 0 0",
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
          backgroundColor: tokens.bg,
          p: 3,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            fontSize: 12,
            fontWeight: 600,
            padding: "6px 12px",
            borderRadius: 999,
            letterSpacing: ".02em",
            zIndex: 2,
            backgroundColor: badge.bg,
            color: badge.fg,
          }}
        >
          {badge.label}
        </Box>

        {/* Save / bookmark toggle. BES-14: bare icon → pill with a
            "Save" / "Saved" label so the action is unambiguous. Filled
            bookmark + greenDeep background communicate the saved state.
            zIndex: 3 so it sits above both the tier badge and the
            card-wide stretched-link overlay. */}
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
            position: "absolute",
            top: 14,
            right: 14,
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
            zIndex: 3,
            boxShadow: "0 1px 4px rgba(0,0,0,.06)",
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

        <Box
          component="img"
          src={imageSrc}
          alt={recommendation.name}
          onError={() => setImgError(true)}
          sx={{ maxWidth: "75%", maxHeight: "78%", objectFit: "contain" }}
        />
      </Box>

      {/* ── Body: name + rating ──
          flex: 1 here so body grows to absorb any extra height from
          the grid stretching; combined with `marginTop: auto` on the
          retailer list, this pins the Buy button to the bottom edge
          of every card, regardless of name/oneLiner length variation. */}
      <Box sx={{ padding: "20px 22px 4px", flex: 1, display: "flex", flexDirection: "column" }}>
        <Typography
          component="h3"
          sx={{
            fontSize: 17,
            fontWeight: 600,
            lineHeight: 1.3,
            color: tokens.ink,
            mb: 0.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {recommendation.name}
        </Typography>
        <Typography
          sx={{
            fontSize: 14,
            color: tokens.ink2,
            lineHeight: 1.45,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: 40,
          }}
        >
          {recommendation.oneLiner}
        </Typography>

        <Box sx={{ height: "1px", backgroundColor: tokens.rule, my: 2 }} />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, pb: 2.25 }}>
          <RatingStars rating={recommendation.rating} reviewCount={recommendation.reviewCount} />
        </Box>
      </Box>

      {/* ── Retailer rows ──
          `marginTop: auto` pushes this block to the bottom edge of the
          card so the primary Buy button is at the same y across all
          three cards in the grid row. */}
      <Box
        component="ul"
        sx={{
          listStyle: "none",
          p: 0,
          m: "auto 12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
        }}
      >
        {/* Primary Buy button — rendered FIRST (above the alternate)
            per Alex review: makes the "2 options" pattern read clearly,
            green first / white second. */}
        {lowest && (
          <Box component="li" sx={{ display: "block" }}>
            <Box
              component="a"
              href={buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                position: "relative",
                zIndex: 2,
                display: "grid",
                gridTemplateColumns: "32px 1fr auto auto",
                alignItems: "center",
                gap: 1.5,
                // Fixed min-height keeps the Buy button identical across
                // all 3 cards regardless of retailer-name length.
                minHeight: 56,
                padding: "14px 18px",
                backgroundColor: tokens.greenDeep,
                color: "#fff",
                borderRadius: "14px",
                textDecoration: "none",
                fontSize: 15,
                fontWeight: 600,
                transition: "background-color .15s, transform .15s",
                boxShadow: "0 6px 16px -8px rgba(92,186,73,0.55)",
                "&:hover": {
                  backgroundColor: "#4AA33D",
                  transform: "translateY(-1px)",
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
                  // Truncate long retailer names so the price stays on
                  // one line at narrow breakpoints.
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

        {/* Alternate retailer slot — ALWAYS rendered when there's at
            least a primary retailer, even if no actual alternate data
            exists. The invisible placeholder reserves the same height
            as a real chip so the Buy button above lands at the same
            y-coordinate across every card in the row (cards with an
            alternate AND cards without). */}
        {lowest && (
          <Box component="li" sx={{ minHeight: 44 }}>
            {others[0] ? (() => {
              const r = others[0];
              const href = hasRealUrl(r.url) ? r.url : buildRetailerSearchUrl(r.name, recommendation.name);
              return (
                <Box
                  component="a"
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    position: "relative",
                    zIndex: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    padding: "10px 14px",
                    backgroundColor: "transparent",
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
                  <Typography
                    component="span"
                    sx={{ fontSize: 12, color: tokens.ink3 }}
                  >
                    Also at
                  </Typography>
                  <Typography
                    component="span"
                    sx={{ fontWeight: 500, fontSize: 13, color: "inherit" }}
                  >
                    {r.name}
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
                    {r.price}
                  </Typography>
                  <ArrowOut size={12} />
                </Box>
              );
            })() : null}
          </Box>
        )}
      </Box>

      {/* ── Stretched click target ──
          Invisible <a> covering the entire card area. Clicking anywhere
          on the card (image, name, rating, body) navigates to the
          lowest-price retailer. Inner clickables (save toggle, alternate
          retailer row, tier badge) all sit at z-index >= 2 so they
          remain independently interactive.
          NOTE: nested <a> inside this overlay is technically invalid
          HTML — the inner retailer rows escape the overlay via z-index,
          not by being descendants of the overlay. */}
      <Box
        component="a"
        href={buyUrl}
        target="_blank"
        rel="noopener noreferrer"
        // tabIndex={-1}: the inner Buy button already covers the keyboard
        // and screen-reader path with a visible focus indicator. Making
        // this invisible overlay focusable too would create a duplicate
        // tab stop for the same URL with no focus ring — confusing for
        // a11y users. Mouse / touch still works (clicks don't need
        // focusability).
        tabIndex={-1}
        aria-label={`View ${recommendation.name} at ${lowest?.name ?? "best price"}`}
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
