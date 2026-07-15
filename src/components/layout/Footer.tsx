import { Box, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { tokens } from "@/config/theme";

/**
 * Page footer. Brand wordmark + a few link affordances + copyright.
 * Matches the lightweight `.foot` block in extras.jsx.
 */
export function Footer() {
  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Box
      component="footer"
      sx={{
        px: { xs: 3, sm: 5 },
        py: { xs: 4, sm: "48px 40px 36px" },
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 2,
        fontSize: 13,
        color: tokens.ink2,
        borderTop: `1px solid ${tokens.rule}`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
        <Typography
          sx={{
            fontFamily: tokens.fontSerif,
            fontWeight: 500,
            fontSize: 20,
            color: tokens.ink,
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          BestAIBuys
        </Typography>
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: tokens.green,
          }}
        />
      </Box>

      <Box sx={{ display: "flex", gap: 3 }}>
        <Typography
          component="a"
          onClick={() => handleScrollTo("how")}
          sx={{
            fontSize: 13,
            color: tokens.ink2,
            cursor: "pointer",
            transition: "color .15s",
            "&:hover": { color: tokens.ink },
          }}
        >
          How it works
        </Typography>
        <Box
          component={RouterLink}
          to="/privacy"
          sx={{
            fontSize: 13,
            color: tokens.ink2,
            textDecoration: "none",
            transition: "color .15s",
            "&:hover": { color: tokens.ink },
          }}
        >
          Privacy Policy
        </Box>
        <Box
          component={RouterLink}
          to="/contact"
          sx={{
            fontSize: 13,
            color: tokens.ink2,
            textDecoration: "none",
            transition: "color .15s",
            "&:hover": { color: tokens.ink },
          }}
        >
          Contact
        </Box>
      </Box>

      <Box component="span">© {new Date().getFullYear()} BestAIBuys</Box>
    </Box>
  );
}
