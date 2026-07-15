import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useShoppingFlow } from "@/hooks/useShoppingFlow";
import { useSavedFinds, recommendationId } from "@/context/SavedFindsContext";
import { tokens } from "@/config/theme";
import type { PreviewProduct, Recommendation } from "@/types/product";

/**
 * Adapter: the preview cards carry a different shape than the
 * recommendation cards (PreviewProduct ≠ Recommendation) but the save
 * pipeline only knows how to persist Recommendation. We synthesize a
 * minimal Recommendation here so the same SavedFindsContext (and the
 * same backend wishlist row) handles both sources of saves.
 *
 * Tier defaults to "value" so the deterministic save id
 * (`${tier}::${name}`) collapses with a future "Best Overall" recommendation
 * of the same product — no duplicate entries when the user saves the
 * same item from Top Rated and again from the final picks.
 */
function previewToRecommendation(p: PreviewProduct): Recommendation {
  return {
    tier: "value",
    tierLabel: "Top Rated",
    name: p.name,
    price: p.price,
    rating: p.rating,
    reviewCount: p.reviewCount,
    oneLiner: "",
    pros: [],
    cons: [],
    whyItWorks: "",
    retailers: [{ name: p.retailer, price: p.price, url: p.url }],
    imageUrl: p.imageUrl,
  };
}

/**
 * "Top Rated in this Category:" preview block.
 *
 *  ╭────────────────────────╮
 *  │ Top Rated in this Cat. │   ← bot bubble (pill)
 *  ╰────────────────────────╯
 *  ┌──────┐ ┌──────┐ ┌──────┐
 *  │ img  │ │ img  │ │ img  │
 *  │ name │ │ name │ │ name │
 *  │ $$$  │ │ $$$  │ │ $$$  │
 *  └──────┘ └──────┘ └──────┘
 *
 * All three cards are visually uniform. This component is purely a
 * render of three quick-search preview products. The final two-card
 * picks layout (with the "Finding your best match…" skeleton during
 * the wait) is owned by ResultsMessage, rendered by ChatShell off
 * state.screen — not through this chat-message pipeline.
 */
export function PreviewResultsMessage() {
  const { state } = useShoppingFlow();
  const { isSaved, requestSave } = useSavedFinds();
  const products = state.previewProducts;
  if (!products || products.length === 0) return null;

  const display = products.slice(0, 3);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, width: "100%" }}>
      {/* Header bubble */}
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        style={{ display: "flex", justifyContent: "flex-start" }}
      >
        <Box
          sx={{
            p: "16px 22px",
            borderRadius: "999px",
            fontSize: "16.5px",
            lineHeight: 1.45,
            backgroundColor: tokens.bgElev,
            border: `1px solid ${tokens.rule}`,
            color: tokens.ink,
            fontWeight: 500,
          }}
        >
          Top Rated in this Category:
        </Box>
      </motion.div>

      {/* Card grid — minmax(0, 1fr) (NOT plain 1fr) so a long retailer
          name inside a card can't blow that column's width out. Plain
          1fr has an implicit min-width: auto = min-content; with a
          `whiteSpace: nowrap` retailer Typography, that min-content
          equals the un-wrapped text width and pushes the column wider
          than its share. The retailer text already truncates with
          ellipsis, so allowing the column to shrink to 0 is safe. */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "minmax(0, 1fr) minmax(0, 1fr)",
            md: `repeat(${display.length}, minmax(0, 1fr))`,
          },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        {display.map((product, i) => (
          <motion.a
            key={`${product.retailer}-${i}`}
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            // display: flex + flexDirection: column on the link wrapper,
            // and `flex: 1` on the inner card below — together they make
            // the visible card surface fill the full grid-cell height,
            // so all three cards share an identical outer height
            // regardless of intrinsic content variation.
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                flex: 1,
                backgroundColor: tokens.bgElev,
                borderRadius: "22px",
                border: `1px solid ${tokens.rule}`,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                transition: "transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s, border-color .25s",
                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow: tokens.shadowMd,
                  borderColor: tokens.ink2,
                },
              }}
            >
              {/* Image area */}
              <Box
                sx={{
                  position: "relative",
                  aspectRatio: "1 / 1",
                  backgroundColor: tokens.bgElev,
                  display: "grid",
                  placeItems: "center",
                  p: 3,
                }}
              >
                {/* BES-17: save pill, top-right of the image. Wires
                    through the same requestSave path as the
                    recommendation cards so saved items land in the
                    same Saved Finds list and the deterministic
                    `${tier}::${name}` id dedupes naturally. */}
                {(() => {
                  const rec = previewToRecommendation(product);
                  const saveId = recommendationId(rec);
                  const saved = isSaved(saveId);
                  const onToggle = (e: React.SyntheticEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    requestSave(rec, state.query);
                  };
                  return (
                    <Box
                      role="button"
                      aria-label={saved ? "Unsave this pick" : "Save this pick"}
                      aria-pressed={saved}
                      tabIndex={0}
                      onClick={onToggle}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") onToggle(e);
                      }}
                      sx={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        zIndex: 3,
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
                  );
                })()}
                {product.imageUrl ? (
                  <Box
                    component="img"
                    src={product.imageUrl}
                    alt={product.retailer}
                    // width/height (not max-*) so the IMG element always
                    // occupies the same 78%×82% slot across every card —
                    // tiny thumbnails scale UP, oversized covers scale
                    // DOWN, both via object-fit: contain so the source
                    // aspect ratio is preserved. Kills the "tiny image
                    // floating in a huge empty card" inconsistency.
                    sx={{ width: "78%", height: "82%", objectFit: "contain" }}
                  />
                ) : (
                  <Typography
                    sx={{
                      fontFamily: tokens.fontSerif,
                      fontSize: 48,
                      fontWeight: 500,
                      color: tokens.greenDeep,
                      opacity: 0.6,
                    }}
                  >
                    {product.retailer.charAt(0)}
                  </Typography>
                )}
              </Box>

              {/* Footer — marginTop: auto pins it to the card's bottom
                  edge so any leftover space from the flex stretch goes
                  between the image and the footer, not below the price. */}
              <Box sx={{ px: 2.5, pb: 2.5, pt: 0.5, mt: "auto" }}>
                <Typography
                  sx={{
                    fontSize: 13.5,
                    color: tokens.ink2,
                    lineHeight: 1.3,
                    mb: 0.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {product.retailer}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: tokens.fontSerif,
                    fontSize: { xs: 22, sm: 26 },
                    fontWeight: 500,
                    color: tokens.ink,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {product.price}
                </Typography>
              </Box>
            </Box>
          </motion.a>
        ))}
      </Box>
    </Box>
  );
}
