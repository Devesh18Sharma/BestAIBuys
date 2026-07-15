import { Box } from "@mui/material";
import { motion } from "framer-motion";

/**
 * Small chat-native "typing" indicator — three pulsing dots in a bot bubble.
 * Shown while the next sequential question is being fetched so the UI doesn't
 * look frozen on the previously-answered question.
 */
export function ThinkingMessage() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, py: 0.25 }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -3, 0], opacity: [0.35, 1, 0.35] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.18,
          }}
        >
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: "#5D5D5D",
            }}
          />
        </motion.div>
      ))}
    </Box>
  );
}
