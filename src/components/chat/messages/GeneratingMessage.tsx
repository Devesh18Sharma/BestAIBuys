import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { tokens } from "@/config/theme";

const STEPS = [
  "Understanding what you need",
  "Crafting smart questions",
  "Personalizing your experience",
] as const;

const STEP_DELAY = 1200; // ms — gen is ~3-5s

/**
 * Compact "Give me a moment…" loader shown while the first question is
 * being generated (also reused for price-search validation/loading).
 *
 * Renders its own bot-side container with a 22px rounded-rect radius —
 * NOT wrapped in ChatBubble. ChatBubble's 999px pill radius collapses a
 * tall task list into an ellipse, which is why earlier wrappers were
 * removed here.
 */
export function GeneratingMessage() {
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step >= STEPS.length - 1) {
        // Last step keeps spinning — never auto-complete.
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
          // Rounded-rect — NOT a 999px pill, so tall stacks don't oval.
          borderRadius: "22px",
          p: "16px 22px",
          backgroundColor: tokens.bgElev,
          border: `1px solid ${tokens.rule}`,
          color: tokens.ink,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: 13.5,
            color: tokens.ink,
            fontWeight: 500,
            mb: 0.5,
          }}
        >
          Give me a moment…
        </Typography>

        {STEPS.map((step, i) => {
          const isDone = i < completedCount;
          const isActive = i === completedCount;
          // Don't render steps that haven't started yet.
          if (!isDone && !isActive) return null;

          return (
            <AnimatePresence key={step}>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 0.5 }}>
                  {isDone ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
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
                        <Box
                          component="svg"
                          width={12}
                          height={12}
                          viewBox="0 0 24 24"
                          fill="none"
                          sx={{ color: tokens.greenDeep }}
                        >
                          <path
                            d="M3 12l5 5L21 4"
                            stroke="currentColor"
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Box>
                      </Box>
                    </motion.div>
                  ) : (
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: `2px solid ${tokens.rule}`,
                        borderTopColor: tokens.greenDeep,
                        animation: "genSpin 0.8s linear infinite",
                        flexShrink: 0,
                        "@keyframes genSpin": { to: { transform: "rotate(360deg)" } },
                      }}
                    />
                  )}
                  <Typography
                    sx={{
                      fontSize: 13.5,
                      color: isDone ? tokens.ink2 : tokens.ink,
                      fontWeight: isActive ? 500 : 400,
                    }}
                  >
                    {step}
                    {isActive && "…"}
                  </Typography>
                </Box>
              </motion.div>
            </AnimatePresence>
          );
        })}
      </Box>
    </motion.div>
  );
}
