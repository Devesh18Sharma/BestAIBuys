import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { Retailer } from "@/types/product";
import { buildRetailerSearchUrl } from "@/utils/formatPrice";

function hasRealUrl(url: string | undefined): boolean {
  return !!url && url.startsWith("http") && url.length > 20;
}

interface RetailerComparisonProps {
  retailers: Retailer[];
  productName: string;
}

export function RetailerComparison({
  retailers,
  productName,
}: RetailerComparisonProps) {
  const theme = useTheme();

  return (
    <Box>
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1.2,
          color: theme.palette.text.secondary,
          mb: 1,
        }}
      >
        Price Comparison
      </Typography>

      <Box
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {retailers.map((retailer, index) => {
          const href = hasRealUrl(retailer.url)
            ? retailer.url
            : buildRetailerSearchUrl(retailer.name, productName);

          return (
            <Box
              key={`${retailer.name}-${index}`}
              component="a"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 1.5,
                py: 1,
                textDecoration: "none",
                color: "inherit",
                cursor: "pointer",
                borderBottom:
                  index < retailers.length - 1
                    ? `1px solid ${theme.palette.divider}`
                    : "none",
                transition: "background-color 0.15s ease",
                "&:hover": {
                  backgroundColor: theme.palette.background.default,
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: theme.palette.text.primary,
                  }}
                >
                  {retailer.name}
                </Typography>
                {retailer.note && (
                  <Box
                    component="span"
                    sx={{
                      fontSize: 10,
                      backgroundColor: theme.palette.background.default,
                      color: theme.palette.text.secondary,
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 1,
                      lineHeight: 1.4,
                    }}
                  >
                    {retailer.note}
                  </Box>
                )}
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: theme.palette.primary.main,
                  }}
                >
                  {retailer.price}
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    fontSize: 14,
                    color: theme.palette.text.secondary,
                    ml: 0.25,
                  }}
                >
                  →
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Typography
        sx={{
          fontSize: 11,
          color: theme.palette.text.disabled,
          mt: 0.75,
          fontStyle: "italic",
        }}
      >
        Prices from Google Shopping — click to buy from retailer
      </Typography>
    </Box>
  );
}
