import { Box, TextField } from "@mui/material";
import { motion } from "framer-motion";
import { useShoppingFlow } from "@/hooks/useShoppingFlow";
import { tokens } from "@/config/theme";

/**
 * Post-result refinement step. Shown under the recommendation once it lands:
 * if the user isn't happy, they describe what they actually want and we search
 * again — excluding the product they just saw (see `refineRecommendations`).
 *
 *  ┌───────────────────────────────────────────────────┐
 *  │ Not quite right? Tell me more and I'll find        │   ← bot pill bubble
 *  │ a different pick.                                  │
 *  └───────────────────────────────────────────────────┘
 *  ┌───────────────────────────────────────────────────┐
 *  │  e.g. lighter, different brand, more battery…      │   ← input card
 *  │                              [Search again →]      │
 *  └───────────────────────────────────────────────────┘
 *
 * Renders its own layout — must NOT be wrapped in ChatBubble or the input
 * card collapses into a 999px-radius oval.
 */
export function RefineResultMessage() {
  const { state, setRefineNotes, refineRecommendations, reset } = useShoppingFlow();
  const canSubmit = state.refineNotes.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    void refineRecommendations();
  };

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
          Not quite right? Tell me more and I'll find a different pick.
        </Box>
      </motion.div>

      {/* Input card — outside the pill */}
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
          value={state.refineNotes}
          onChange={(e) => setRefineNotes(e.target.value)}
          onKeyDown={(e) => {
            // Cmd/Ctrl+Enter submits; plain Enter keeps adding lines.
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="What would make this a better fit? e.g. lighter, different brand, more battery life…"
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
          {/* Start a completely fresh search — back to the home screen. */}
          <Box
            onClick={reset}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                reset();
              }
            }}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              px: 2.5,
              py: 1.25,
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 500,
              border: `1px solid ${tokens.rule}`,
              color: tokens.ink2,
              cursor: "pointer",
              transition: "all .15s",
              "&:hover": { color: tokens.ink, borderColor: tokens.ink2 },
            }}
          >
            Start new search
          </Box>
          <Box
            onClick={submit}
            role="button"
            tabIndex={0}
            aria-disabled={!canSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                submit();
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
              fontWeight: 500,
              backgroundColor: canSubmit ? tokens.ink : tokens.rule,
              color: canSubmit ? tokens.bg : tokens.ink3,
              cursor: canSubmit ? "pointer" : "not-allowed",
              transition: "background .15s",
              "&:hover": canSubmit ? { backgroundColor: "#000" } : {},
            }}
          >
            Continue search
            <Box component="svg" width={14} height={14} viewBox="0 0 76 76" fill="currentColor">
              <path d="M51.2,41.5H6.1v-6.9h45.2l-12.4-20.4h7.2c6.4,10.2,14.3,17.2,23.8,21.8v4.4c-9.4,4.6-17.4,11.7-23.8,21.9h-7.2c0,0,12.3-20.6,12.3-20.6Z" />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
