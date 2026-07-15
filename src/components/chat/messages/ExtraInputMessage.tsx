import { Box, TextField } from "@mui/material";
import { motion } from "framer-motion";
import { useShoppingFlow } from "@/hooks/useShoppingFlow";
import { tokens } from "@/config/theme";

/**
 * Free-text preferences step.
 *
 *  ┌───────────────────────────────────────────────────┐
 *  │ Anything else I should know?                      │   ← bot pill bubble
 *  └───────────────────────────────────────────────────┘
 *  ┌───────────────────────────────────────────────────┐
 *  │  Tell us what matters to you — quality,           │
 *  │  features, brands, or anything else (placeholder) │   ← descriptive helper
 *  │                                                   │     inside the input
 *  │                        [Skip] [Find deals →]      │
 *  └───────────────────────────────────────────────────┘
 *
 * Renders its own layout — must NOT be wrapped in ChatBubble or the input
 * card collapses into a 999px-radius oval.
 */
export function ExtraInputMessage() {
  const { state, setExtraNotes, submitForRecommendations } = useShoppingFlow();
  const isActive = state.screen === "extra_input";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%" }}>
      {/* Pill bubble for the prompt */}
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        style={{ display: "flex", justifyContent: "flex-start", width: "100%" }}
      >
        <Box
          sx={{
            maxWidth: { xs: "92%", sm: "78%" },
            p: "16px 22px",
            borderRadius: "999px",
            fontSize: "16.5px",
            lineHeight: 1.45,
            backgroundColor: tokens.bgElev,
            border: `1px solid ${tokens.rule}`,
            color: tokens.ink,
          }}
        >
          Anything else I should know?
        </Box>
      </motion.div>

      {/* Input card — outside the pill */}
      {isActive && (
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            p: { xs: 2, sm: 2.5 },
            backgroundColor: tokens.bgElev,
            border: `1px solid ${tokens.rule}`,
            borderRadius: "22px",
          }}
        >
          <TextField
            multiline
            minRows={2}
            maxRows={5}
            fullWidth
            value={state.extraNotes}
            onChange={(e) => setExtraNotes(e.target.value)}
            placeholder="Tell us what matters to you — quality, features, brands, or anything else"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "16px",
                fontSize: 15,
                backgroundColor: tokens.bg,
                padding: "14px 16px",
                "& fieldset": { borderColor: tokens.rule },
                "&:hover fieldset": { borderColor: tokens.ink2 },
                "&.Mui-focused fieldset": { borderColor: tokens.ink, borderWidth: "1px" },
              },
              "& .MuiOutlinedInput-input": {
                color: tokens.ink,
                "&::placeholder": { color: tokens.ink3, opacity: 1 },
              },
            }}
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Box
              onClick={submitForRecommendations}
              role="button"
              tabIndex={0}
              sx={{
                px: 2.5,
                py: 1.25,
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 500,
                color: tokens.ink2,
                cursor: "pointer",
                transition: "all .15s",
                "&:hover": { color: tokens.ink, backgroundColor: tokens.bg },
              }}
            >
              Skip
            </Box>
            <Box
              onClick={submitForRecommendations}
              role="button"
              tabIndex={0}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                px: 2.5,
                py: 1.25,
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 500,
                backgroundColor: tokens.ink,
                color: tokens.bg,
                cursor: "pointer",
                transition: "background .15s",
                "&:hover": { backgroundColor: "#000" },
              }}
            >
              Find deals
              <Box component="svg" width={14} height={14} viewBox="0 0 76 76" fill="currentColor">
                <path d="M51.2,41.5H6.1v-6.9h45.2l-12.4-20.4h7.2c6.4,10.2,14.3,17.2,23.8,21.8v4.4c-9.4,4.6-17.4,11.7-23.8,21.9h-7.2c0,0,12.3-20.6,12.3-20.6Z" />
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
