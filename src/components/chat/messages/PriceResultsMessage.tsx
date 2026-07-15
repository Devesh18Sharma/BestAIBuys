import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useShoppingFlow } from "@/hooks/useShoppingFlow";
import { RetailerComparison } from "@/components/results/RetailerComparison";

export function PriceResultsMessage() {
  const theme = useTheme();
  const { state } = useShoppingFlow();
  const priceResults = state.priceResults;

  if (!priceResults) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Typography
        sx={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: { xs: 18, sm: 20 },
          color: theme.palette.text.primary,
        }}
      >
        Prices for "{priceResults.productName}"
      </Typography>

      {priceResults.retailers.length > 0 ? (
        <RetailerComparison
          retailers={priceResults.retailers}
          productName={priceResults.productName}
        />
      ) : (
        <Typography sx={{ fontSize: 13.5, color: theme.palette.text.secondary }}>
          No prices found for this product. Try a more specific name.
        </Typography>
      )}
    </Box>
  );
}
