import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { tokens } from "@/config/theme";

/**
 * Newsletter CTA strip — green rounded block with email capture.
 * Mirrors the `.cta` block from extras.jsx.
 */
export function CTAStrip() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <Box
      component="section"
      sx={{
        mx: { xs: 3, sm: 5 },
        mb: { xs: 7, sm: 10 },
        backgroundColor: tokens.green,
        borderRadius: { xs: "24px", sm: "32px" },
        p: { xs: "56px 32px", sm: "80px 56px" },
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr" },
          gap: 5,
          alignItems: "center",
        }}
      >
        <Box>
          <Typography
            component="h2"
            sx={{
              fontFamily: tokens.fontSerif,
              fontSize: { xs: "clamp(32px, 8vw, 44px)", sm: "clamp(36px, 4.4vw, 60px)" },
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: "-0.025em",
              color: tokens.ink,
            }}
          >
            Get good news.
          </Typography>
          <Typography
            sx={{
              color: "rgba(38,38,37,0.7)",
              fontSize: 17,
              mt: 2,
              maxWidth: "40ch",
              lineHeight: 1.5,
            }}
          >
            One short email a week — the best new finds, biggest price drops, and
            a smarter way to shop.
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            if (email.trim()) setSent(true);
          }}
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "center",
            backgroundColor: tokens.bgElev,
            p: "8px 8px 8px 24px",
            borderRadius: 999,
            boxShadow: "0 8px 24px rgba(38,38,37,0.12)",
          }}
        >
          <Box
            component="input"
            type="email"
            placeholder="you@somewhere.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={sent}
            sx={{
              flex: 1,
              minWidth: 0,
              border: 0,
              outline: 0,
              background: "transparent",
              fontSize: 16,
              fontFamily: tokens.fontSans,
              padding: "14px 0",
              color: tokens.ink,
            }}
          />
          <Box
            component="button"
            type="submit"
            sx={{
              backgroundColor: tokens.ink,
              color: tokens.bg,
              padding: "14px 22px",
              borderRadius: 999,
              fontWeight: 500,
              fontSize: 14.5,
              border: 0,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              transition: "background .15s ease",
              fontFamily: tokens.fontSans,
              "&:hover": { backgroundColor: "#000" },
            }}
          >
            {sent ? (
              "On the list ✓"
            ) : (
              <>
                Notify me
                <Box component="svg" viewBox="0 0 76 76" width={14} height={14} fill="currentColor">
                  <path d="M51.2,41.5H6.1v-6.9h45.2l-12.4-20.4h7.2c6.4,10.2,14.3,17.2,23.8,21.8v4.4c-9.4,4.6-17.4,11.7-23.8,21.9h-7.2c0,0,12.3-20.6,12.3-20.6Z" />
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
