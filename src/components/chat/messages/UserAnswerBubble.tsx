import { Box, Typography } from "@mui/material";
import { useShoppingFlow } from "@/hooks/useShoppingFlow";
import { tokens } from "@/config/theme";
import { isLikelyEmoji } from "@/utils/isLikelyEmoji";
import { SKIP_OPTION_ID, SKIP_ANSWER_LABEL } from "@/config/constants";

interface UserAnswerBubbleProps {
  questionId: string;
  optionId: string;
}

/**
 * User-side answer bubble — shows the picked option (icon + label) inside
 * the green chat bubble. Emoji slot uses the color-emoji font stack so
 * icons never collapse to a generic dot.
 */
export function UserAnswerBubble({ questionId, optionId }: UserAnswerBubbleProps) {
  const { state } = useShoppingFlow();
  const question = state.questions.find((q) => q.id === questionId);
  if (!question) return null;

  // Skip sentinel — render the "No preference" pill with the same 🤷
  // icon shown on the skip option chip, so the user's answer history
  // reads consistently with the choice they made.
  if (optionId === SKIP_OPTION_ID) {
    return (
      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
        <Typography
          component="span"
          sx={{ fontSize: 16, lineHeight: 1, fontFamily: tokens.fontEmoji }}
        >
          🤷
        </Typography>
        <Typography
          component="span"
          sx={{ fontWeight: 500, fontSize: 14, color: "inherit" }}
        >
          {SKIP_ANSWER_LABEL}
        </Typography>
      </Box>
    );
  }

  const option = question.options.find((o) => o.id === optionId);
  if (!option) return null;

  // Drop the icon entirely if the LLM emitted non-emoji text — keeps
  // the answer bubble clean instead of showing a stray "•" or a URL.
  const showIcon = isLikelyEmoji(option.icon);

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: showIcon ? 0.75 : 0 }}>
      {showIcon && (
        <Typography
          component="span"
          sx={{
            fontSize: 16,
            lineHeight: 1,
            fontFamily: tokens.fontEmoji,
          }}
        >
          {option.icon}
        </Typography>
      )}
      <Typography
        component="span"
        sx={{
          fontWeight: 500,
          fontSize: 14,
          color: "inherit",
        }}
      >
        {option.label}
      </Typography>
    </Box>
  );
}
