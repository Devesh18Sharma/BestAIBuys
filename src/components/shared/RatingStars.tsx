import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  size?: "small" | "default";
}

const STAR_COLOR = "#E8A200";

function formatReviewCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}K`;
  return count.toLocaleString();
}

export function RatingStars({ rating, reviewCount, size = "default" }: RatingStarsProps) {
  const theme = useTheme();
  const filled = Math.round(Math.min(Math.max(rating, 0), 5));
  const isSmall = size === "small";

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
      <Box
        component="span"
        sx={{ color: STAR_COLOR, fontSize: isSmall ? 11 : 14, letterSpacing: 1, lineHeight: 1 }}
      >
        {"★".repeat(filled)}
        {"☆".repeat(5 - filled)}
      </Box>
      <Typography
        component="span"
        sx={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: isSmall ? 11 : 13,
          color: theme.palette.text.secondary,
          lineHeight: 1,
          ml: 0.3,
        }}
      >
        {rating.toFixed(1)}
        {reviewCount != null && reviewCount > 0 && (
          <Typography
            component="span"
            sx={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: isSmall ? 10 : 12,
              color: theme.palette.text.disabled,
              ml: 0.3,
            }}
          >
            ({formatReviewCount(reviewCount)})
          </Typography>
        )}
      </Typography>
    </Box>
  );
}
