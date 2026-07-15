import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { tokens } from "@/config/theme";
import { pickProductImage } from "@/utils/mockProducts";
import type { PlannerItem } from "@/types/planner";

/** Amber accent for "wait" / future-event states — no token exists for it. */
const AMBER = "#C77D2E";

interface Props {
  item: PlannerItem;
  /** When provided, the trailing column shows a remove button instead of the chevron. */
  onRemove?: () => void;
}

/**
 * One planner table row. Reads, per item:
 *   imageUrl, name, category            → Item column
 *   action, recommendation              → Recommendation column (badge + text)
 *   bestTimeLabel, bestTimeWindow        → Best Time to Buy column
 *   savings                              → You'll Save column
 * Built as a CSS-grid <li> (no MUI Table), mirroring SavedFindsPage's rows.
 */
export function PlannerRow({ item, onRemove }: Props) {
  const isBuy = item.action === "buy";
  const accent = isBuy ? tokens.greenDeep : AMBER;

  // The backend sends `imageUrl: ""` for items without an image, so fall back to
  // a category image (via `||`, since "" is falsy) and catch dead URLs too.
  const [imgError, setImgError] = useState(false);
  const imageSrc =
    !imgError && item.imageUrl ? item.imageUrl : pickProductImage(item.name);

  return (
    <Box
      component="li"
      sx={{
        display: "grid",
        gridTemplateColumns: {
          // xs: the Item cell (image+name, flexible), savings, and — when the
          // row is removable — a trailing remove button. Recommendation and
          // best-time are display:none here, so the track count must match the
          // visible cells exactly or the Item cell collapses (BES fix).
          xs: onRemove ? "1fr auto auto" : "1fr auto",
          // md: full 4-column table + trailing chevron / remove button. The
          // You'll-Save and trailing tracks are FIXED (not `auto`) so this grid
          // resolves to the same column x-positions as the page's column header
          // (whose auto content — "YOU'LL SAVE" — is wider than a row's "$3"),
          // otherwise the two grids drift and the headers stop lining up.
          md: "minmax(220px, 1.6fr) minmax(180px, 1.4fr) minmax(150px, 1fr) 100px 28px",
        },
        alignItems: "center",
        gap: { xs: 1.5, md: 2 },
        backgroundColor: tokens.bgElev,
        border: `1px solid ${tokens.rule}`,
        borderRadius: "18px",
        p: { xs: 1.5, md: 2 },
        transition: "border-color .15s, box-shadow .15s",
        "&:hover": { borderColor: tokens.green, boxShadow: tokens.shadowSm },
      }}
    >
      {/* Item — image + name + category */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
        <Box
          sx={{
            flexShrink: 0,
            width: { xs: 48, md: 60 },
            height: { xs: 48, md: 60 },
            borderRadius: "12px",
            backgroundColor: tokens.bg,
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
            p: 0.75,
          }}
        >
          <Box
            component="img"
            src={imageSrc}
            alt={item.name}
            onError={() => setImgError(true)}
            sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
          />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h3"
            sx={{
              fontSize: { xs: 14, md: 15 },
              fontWeight: 600,
              color: tokens.ink,
              lineHeight: 1.25,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.name}
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: tokens.ink3, mt: 0.25 }}>
            {item.category}
          </Typography>
        </Box>
      </Box>

      {/* Recommendation — badge beside the rationale, one line (hidden on xs) */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          gap: 1.25,
          minWidth: 0,
        }}
      >
        <Badge isBuy={isBuy} />
        <Typography sx={{ fontSize: 13, color: tokens.ink2, lineHeight: 1.4, minWidth: 0 }}>
          {item.recommendation}
        </Typography>
      </Box>

      {/* Best Time to Buy — label + window, left-aligned (hidden on xs) */}
      <Box sx={{ display: { xs: "none", md: "block" }, textAlign: "left" }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: accent }}>
          {item.bestTimeLabel}
        </Typography>
        {item.bestTimeWindow && (
          <Typography sx={{ fontSize: 12, color: tokens.ink3, mt: 0.25 }}>
            {item.bestTimeWindow}
          </Typography>
        )}
      </Box>

      {/* You'll Save — matches the price cell on Saved Finds (18/700/greenDeep). */}
      <Box sx={{ textAlign: "right", whiteSpace: "nowrap" }}>
        <Typography
          sx={{
            fontSize: 18,
            fontWeight: 700,
            color: tokens.greenDeep,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ${item.savings}
        </Typography>
        <Typography sx={{ fontSize: 11, color: tokens.ink3, mt: 0.25 }}>
          {isBuy ? "now" : "if you wait"}
        </Typography>
      </Box>

      {/* Trailing column: remove button when removable, else a chevron (md only) */}
      {onRemove ? (
        <Box
          component="button"
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${item.name} from planner`}
          title="Remove from planner"
          sx={{
            display: "grid",
            placeItems: "center",
            width: 28,
            height: 28,
            p: 0,
            border: 0,
            borderRadius: "50%",
            backgroundColor: "transparent",
            color: tokens.ink3,
            cursor: "pointer",
            transition: "background-color .15s, color .15s",
            "&:hover": { backgroundColor: tokens.bg, color: tokens.ink },
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width={16}
            height={16}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </Box>
      ) : (
        <Box
          sx={{
            display: { xs: "none", md: "grid" },
            placeItems: "center",
            color: tokens.ink3,
          }}
          aria-hidden
        >
          <svg
            viewBox="0 0 24 24"
            width={18}
            height={18}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Box>
      )}
    </Box>
  );
}

function Badge({ isBuy }: { isBuy: boolean }) {
  return (
    <Box
      component="span"
      sx={{
        flexShrink: 0,
        display: "inline-block",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.04em",
        padding: "3px 10px",
        borderRadius: 999,
        backgroundColor: isBuy ? tokens.green : "#F6E4CE",
        color: isBuy ? tokens.ink : AMBER,
      }}
    >
      {isBuy ? "BUY NOW" : "WAIT"}
    </Box>
  );
}
