import { Box, Typography, Button } from "@mui/material";
import { useShoppingFlow } from "@/hooks/useShoppingFlow";

interface ErrorMessageProps {
  text?: string;
}

export function ErrorMessage({ text }: ErrorMessageProps) {
  const { state, submitSearch, submitPriceSearch, submitForRecommendations } =
    useShoppingFlow();

  const handleRetry = () => {
    if (state.priceResults === null && !state.productName) {
      submitPriceSearch();
    } else if (state.results === null && state.productName) {
      submitForRecommendations();
    } else {
      submitSearch();
    }
  };

  const displayMessage =
    text && text.length < 120 && !text.includes("Error:")
      ? text
      : "Something went wrong. Please try again.";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Typography sx={{ fontSize: 13.5, color: "#1A1A1A", lineHeight: 1.5 }}>
        😕 {displayMessage}
      </Typography>
      <Button
        onClick={handleRetry}
        sx={{
          alignSelf: "flex-start",
          backgroundColor: "#5CBA49",
          color: "#fff",
          borderRadius: 999,
          textTransform: "none",
          fontWeight: 600,
          fontSize: 13,
          px: 2.5,
          py: 1,
          "&:hover": { backgroundColor: "#4AA33D" },
        }}
      >
        Try Again
      </Button>
    </Box>
  );
}
