import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "@/config/theme";
import { useShoppingFlow } from "@/hooks/useShoppingFlow";
import { RetailerComparison } from "@/components/results/RetailerComparison";

/**
 * Results for the "search by photo" flow. Shows what the user uploaded next to
 * the product we identified, then a live price comparison — reusing the same
 * RetailerComparison component as the price-search flow to keep one design.
 */
export function ImageResultsMessage() {
  const theme = useTheme();
  const { state } = useShoppingFlow();
  const result = state.imageResults;

  if (!result) return null;

  const identified = result.productName && result.retailers.length > 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {/* Identified product header: uploaded photo + product image + name */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        {state.imagePreviewUrl && (
          <Box
            component="img"
            src={state.imagePreviewUrl}
            alt="Your photo"
            sx={{
              width: 64,
              height: 64,
              borderRadius: "14px",
              objectFit: "cover",
              border: `1px solid ${tokens.rule}`,
              flexShrink: 0,
            }}
          />
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.2,
              color: theme.palette.text.secondary,
              mb: 0.25,
            }}
          >
            {identified ? "We found a match" : "Photo search"}
          </Typography>
          <Typography
            sx={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: { xs: 18, sm: 20 },
              color: theme.palette.text.primary,
              lineHeight: 1.2,
            }}
          >
            {identified
              ? result.productName
              : "Couldn't identify this product"}
          </Typography>
        </Box>
      </Box>

      {identified ? (
        <RetailerComparison
          retailers={result.retailers}
          productName={result.productName as string}
        />
      ) : (
        <Typography sx={{ fontSize: 13.5, color: theme.palette.text.secondary }}>
          We couldn't match that photo to a product. Try a clearer, well-lit shot
          of a single item — or search by name instead.
        </Typography>
      )}
    </Box>
  );
}
