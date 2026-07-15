import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { tokens } from "@/config/theme";
import { useShoppingFlow } from "@/hooks/useShoppingFlow";

const STEPS = [
  "Looking at your photo",
  "Matching it to real products",
  "Finding the best live prices",
] as const;

const STEP_DELAY = 1400; // ms

/**
 * Loader shown while the backend runs reverse-image search on the uploaded
 * photo. Mirrors GeneratingMessage's card aesthetic (22px rounded-rect, NOT a
 * ChatBubble pill) but shows a thumbnail of the user's photo alongside
 * image-appropriate steps.
 */
export function ImageLoadingMessage() {
  const { state } = useShoppingFlow();
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step >= STEPS.length - 1) {
        setCompletedCount(STEPS.length - 1);
        clearInterval(interval);
      } else {
        setCompletedCount(step);
      }
    }, STEP_DELAY);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      style={{ display: "flex", justifyContent: "flex-start", width: "100%" }}
    >
      <Box
        sx={{
          maxWidth: { xs: "92%", sm: "78%" },
          borderRadius: "22px",
          p: "16px 22px",
          backgroundColor: tokens.bgElev,
          border: `1px solid ${tokens.rule}`,
          color: tokens.ink,
          display: "flex",
          gap: 2,
          alignItems: "flex-start",
        }}
      >
        {state.imagePreviewUrl && (
          <Box
            component="img"
            src={state.imagePreviewUrl}
            alt="Your photo"
            sx={{
              width: 72,
              height: 72,
              borderRadius: "14px",
              objectFit: "cover",
              border: `1px solid ${tokens.rule}`,
              flexShrink: 0,
            }}
          />
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 13.5, color: tokens.ink, fontWeight: 500, mb: 0.5 }}>
            Searching by photo…
          </Typography>

          {STEPS.map((step, i) => {
            const isDone = i < completedCount;
            const isActive = i === completedCount;
            if (!isDone && !isActive) return null;

            return (
              <Box key={step} sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 0.5 }}>
                {isDone ? (
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      backgroundColor: `color-mix(in oklab, ${tokens.green} 18%, ${tokens.bgElev})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Box component="svg" width={12} height={12} viewBox="0 0 24 24" fill="none" sx={{ color: tokens.greenDeep }}>
                      <path d="M3 12l5 5L21 4" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: `2px solid ${tokens.rule}`,
                      borderTopColor: tokens.greenDeep,
                      animation: "imgSpin 0.8s linear infinite",
                      flexShrink: 0,
                      "@keyframes imgSpin": { to: { transform: "rotate(360deg)" } },
                    }}
                  />
                )}
                <Typography sx={{ fontSize: 13.5, color: isDone ? tokens.ink2 : tokens.ink, fontWeight: isActive ? 500 : 400 }}>
                  {step}
                  {isActive && "…"}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </motion.div>
  );
}
