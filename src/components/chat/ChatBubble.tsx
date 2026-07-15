import { Box } from "@mui/material";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { ChatMessageRole } from "@/types/chat";
import { tokens } from "@/config/theme";

interface ChatBubbleProps {
  role: ChatMessageRole;
  children: ReactNode;
  noBubble?: boolean;
  variant?: "intro";
}

/**
 * Chat bubble matching Good Find's `.fbubble` styling:
 * pill radius, white background for bot, deep-green for user.
 */
export function ChatBubble({ role, children, noBubble, variant }: ChatBubbleProps) {
  const isUser = role === "user";
  const isSystem = role === "system";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : isSystem ? "center" : "flex-start",
        width: "100%",
      }}
    >
      {noBubble ? (
        <Box sx={{ width: "100%" }}>{children}</Box>
      ) : (
        <Box
          sx={{
            maxWidth: { xs: "92%", sm: "78%" },
            p: "16px 22px",
            borderRadius: "999px",
            fontSize: "16.5px",
            lineHeight: 1.45,
            fontFamily: tokens.fontSans,
            wordWrap: "break-word",
            ...(isUser
              ? {
                  alignSelf: "flex-end",
                  backgroundColor: tokens.greenDeep,
                  color: "#fff",
                }
              : {
                  alignSelf: "flex-start",
                  backgroundColor: variant === "intro" ? tokens.bg : tokens.bgElev,
                  border: `1px solid ${tokens.rule}`,
                  color: tokens.ink,
                }),
          }}
        >
          {children}
        </Box>
      )}
    </motion.div>
  );
}
