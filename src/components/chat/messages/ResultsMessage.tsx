import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import { useShoppingFlow } from "@/hooks/useShoppingFlow";
import { ResultsCard, ResultsCardSkeleton } from "@/components/results/ResultsCard";
import { BestMatchLoadingCard } from "@/components/results/BestMatchLoadingCard";
import { ShareMenu } from "@/components/share/ShareMenu";
import { RefineResultMessage } from "./RefineResultMessage";
import type { ResultTurn } from "@/context/ShoppingFlowContext";
import type { PreviewProduct, Recommendation } from "@/types/product";
import { tokens } from "@/config/theme";

/**
 * BES-39 — two-card results layout, extended for the multi-turn refine flow.
 *
 * Each card has its OWN data source, deliberately chosen to match the
 * two API timings so the user sees real content as soon as it's
 * available:
 *
 *  ┌─────────────────────────┬─────────────────────────┐
 *  │ Top Rated  (green star) │ Best Match  (blue dart) │
 *  │ src: /quick-search      │ src: /recommendations   │
 *  │ ~4–9 s, lands FAST      │ ~10–30 s, lands SLOW    │
 *  └─────────────────────────┴─────────────────────────┘
 *
 * The user can refine a result (see RefineResultMessage / refineRecommendations):
 * every refine appends a NEW turn instead of overwriting, so the conversation
 * grows. This component renders one two-card block per `state.resultTurns`
 * entry — each with its own placeholder ↔ real swap — with the user's refine
 * text between turns, and the refine box after the last landed turn.
 *
 * Rendered for BOTH `screen === "searching"` and `screen === "results"`
 * — ChatShell picks it up off state.screen, no chat-message pipeline involved.
 */

/**
 * Convert a /quick-search PreviewProduct into the shape ResultsCard
 * already speaks. The `tier` value is unused at render time (the badge
 * comes from the variant prop in ResultsCard), but kept consistent so
 * SavedFinds dedupes preview-saved and recommendation-saved entries
 * for the same product into a single record.
 */
function previewToTopRated(p: PreviewProduct): Recommendation {
  return {
    tier: "value",
    tierLabel: "Top Rated",
    name: p.name,
    price: p.price,
    rating: p.rating,
    reviewCount: p.reviewCount,
    // PreviewProduct has no description; ResultsCard already skips the
    // oneLiner block when this is empty, so the card lays out cleanly.
    oneLiner: "",
    pros: [],
    cons: [],
    whyItWorks: "",
    retailers: [
      {
        name: p.retailer,
        price: p.price,
        url: p.url,
        // Carry the List price through so the Top Rated card's SavingsPill can
        // compute the discount (BES-53). Omitted when the preview has none.
        ...(p.listPrice && { listPrice: p.listPrice }),
      },
    ],
    imageUrl: p.imageUrl,
  };
}

/**
 * One turn's two-card block.
 *  - Initial turn (isRefine=false): Top Rated (quick-search, fast) + Best Match
 *    (recommendation, slow) — each with its own placeholder ↔ real swap.
 *  - Continue-search turns (isRefine=true): two AI recommendation picks —
 *    Best Match + Alternative — from the single /recommendations call (no
 *    quick-search), so both fill together when the call lands.
 */
function TurnCards({ turn, isRefine, isShared }: { turn: ResultTurn; isRefine: boolean; isShared: boolean }) {
  const reducedMotion = useReducedMotion();

  const animatedCard = (variant: "top-rated" | "best-match" | "alternative", rec: Recommendation, delay = 0) => (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.45, delay: reducedMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: "flex", width: "100%" }}
    >
      <ResultsCard variant={variant} recommendation={rec} />
    </motion.div>
  );

  // A shared page never re-runs the search, so a missing slot must NOT show an
  // animated "loading" card (it would spin forever and read as an active
  // search). Show a static "not available" placeholder instead — this only
  // arises for links shared mid-search before the completion gate existed.
  const placeholder = (variant: "top-rated" | "best-match" | "alternative", loading: ReactNode) =>
    isShared ? (
      <ResultsCardSkeleton variant={variant} statusText="Not available in this shared view" reducedMotion />
    ) : (
      loading
    );

  let left: ReactNode;
  let right: ReactNode;

  if (isRefine) {
    // Both cards come from /recommendations (the single call returns up to 2
    // distinct picks). While it's in flight, show two loaders.
    const recs = turn.results?.recommendations ?? [];
    left = recs[0]
      ? animatedCard("best-match", recs[0])
      : placeholder("best-match", <BestMatchLoadingCard reducedMotion={!!reducedMotion} />);
    right = !turn.results
      ? placeholder("alternative", <ResultsCardSkeleton variant="alternative" statusText="Finding an alternative…" reducedMotion={!!reducedMotion} />)
      : recs[1]
        ? animatedCard("alternative", recs[1], 0.05)
        : null; // rare: only one pick resolved — show a single card
  } else {
    // Left: preview (fast). Fall back to the first recommendation if
    // /quick-search failed/returned empty so the slot isn't stuck on a skeleton
    // once the recommendation has arrived.
    const previewTop = turn.previewProducts?.[0];
    const topRated = previewTop
      ? previewToTopRated(previewTop)
      : turn.results?.recommendations[0] ?? null;
    // Right: prefer the "value" tier ("Best Overall — Our Pick"), else first rec.
    const bestMatch =
      turn.results?.recommendations.find((r) => r.tier === "value") ??
      turn.results?.recommendations[0];
    left = topRated
      ? animatedCard("top-rated", topRated, 0.05)
      : placeholder("top-rated", <ResultsCardSkeleton variant="top-rated" reducedMotion={!!reducedMotion} />);
    right = bestMatch
      ? animatedCard("best-match", bestMatch)
      : placeholder("best-match", <BestMatchLoadingCard reducedMotion={!!reducedMotion} />);
  }

  const slots = [left, right].filter((s) => s != null);
  const twoCol = slots.length > 1;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr)" },
        ...(twoCol && {
          "@media (min-width: 720px)": {
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          },
        }),
        gap: { xs: 2.5, sm: 3 },
        alignItems: "stretch",
      }}
    >
      {slots.map((slot, i) => (
        <Box key={i} sx={{ display: "flex" }}>
          {slot}
        </Box>
      ))}
    </Box>
  );
}

/** The user's refine text, shown as a right-aligned bubble above the turn it produced. */
function RefineTurnHeader({ text }: { text: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
      <Box
        sx={{
          maxWidth: { xs: "92%", sm: "70%" },
          p: "12px 18px",
          borderRadius: "999px",
          fontSize: 15,
          lineHeight: 1.4,
          backgroundColor: tokens.ink,
          color: tokens.bg,
        }}
      >
        {text}
      </Box>
    </Box>
  );
}

/** Read-only CTA shown to a shared-link viewer in place of the refine box. */
function StartYourOwnSearch() {
  const { reset } = useShoppingFlow();
  const navigate = useNavigate();
  const onClick = () => {
    reset();
    navigate("/");
  };
  return (
    <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
      <Box
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          px: 2.5,
          py: 1.25,
          borderRadius: 999,
          fontSize: 14,
          fontWeight: 600,
          backgroundColor: tokens.ink,
          color: tokens.bg,
          cursor: "pointer",
          transition: "background .15s",
          "&:hover": { backgroundColor: "#000" },
        }}
      >
        Start your own search
        <Box component="svg" width={14} height={14} viewBox="0 0 76 76" fill="currentColor">
          <path d="M51.2,41.5H6.1v-6.9h45.2l-12.4-20.4h7.2c6.4,10.2,14.3,17.2,23.8,21.8v4.4c-9.4,4.6-17.4,11.7-23.8,21.9h-7.2c0,0,12.3-20.6,12.3-20.6Z" />
        </Box>
      </Box>
    </Box>
  );
}

export function ResultsMessage() {
  const { state } = useShoppingFlow();
  const turns = state.resultTurns;
  const lastTurn = turns[turns.length - 1];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 3, sm: 4 } }}>
      {/* Header: headline + Share (hidden on a shared, read-only view). */}
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1.5,
        }}
      >
        <Box>
          <Typography
            component="h1"
            sx={{
              fontFamily: tokens.fontSerif,
              fontSize: { xs: 32, sm: "clamp(36px, 5vw, 56px)" },
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              color: tokens.ink,
              maxWidth: 900,
            }}
          >
            Your Best Customized Picks
          </Typography>
          {state.isShared && (
            <Typography sx={{ mt: 0.75, fontSize: 13.5, color: tokens.ink3 }}>
              You're viewing a shared search.
            </Typography>
          )}
        </Box>
        {/* Share only once the latest pick has actually landed — sharing
            mid-search would snapshot an in-progress state (results: null) and
            the shared page, which never re-runs the search, would spin its
            loader forever. */}
        {!state.isShared && lastTurn?.results && <ShareMenu />}
      </Box>

      {turns.map((turn, i) => (
        <Box
          key={i}
          sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, sm: 2.5 } }}
        >
          {i > 0 && turn.refineText && <RefineTurnHeader text={turn.refineText} />}
          <TurnCards turn={turn} isRefine={i > 0} isShared={state.isShared} />
        </Box>
      ))}

      {/* Once the latest turn's AI pick has landed: the refine box for the owner,
          or a "Start your own search" CTA for a shared (read-only) viewer. */}
      {lastTurn?.results &&
        (state.isShared ? <StartYourOwnSearch /> : <RefineResultMessage />)}
    </Box>
  );
}
