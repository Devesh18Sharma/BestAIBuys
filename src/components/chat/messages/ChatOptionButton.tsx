import { Box, Typography } from "@mui/material";
import type { QuestionOption } from "@/types/questionnaire";
import { tokens } from "@/config/theme";
import { isLikelyEmoji } from "@/utils/isLikelyEmoji";

interface ChatOptionButtonProps {
  option: QuestionOption;
  selected?: boolean;
  isSkip?: boolean;
  onClick: () => void;
}

/**
 * Question option chip — matches Good Find's `.fopt` styling.
 * Defaults to the lime-green primary look; switches to deep-green when
 * selected; transparent + ruled outline for "skip" variant.
 */
export function ChatOptionButton({ option, selected, isSkip, onClick }: ChatOptionButtonProps) {
  return (
    <Box
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        p: "18px 22px",
        borderRadius: "999px",
        textAlign: "left",
        fontSize: "16px",
        color: selected ? "#fff" : tokens.ink,
        cursor: "pointer",
        transition: "all .15s ease",
        ...(isSkip
          ? {
              backgroundColor: "transparent",
              border: `1.5px solid ${tokens.rule}`,
              "&:hover": { borderColor: tokens.ink2 },
            }
          : selected
            ? {
                backgroundColor: tokens.greenDeep,
                border: `1.5px solid ${tokens.greenDeep}`,
              }
            : {
                backgroundColor: tokens.greenSoft,
                border: `1.5px solid ${tokens.greenDeep}`,
                "&:hover": {
                  borderColor: tokens.ink2,
                  transform: "translateY(-1px)",
                  boxShadow: tokens.shadowSm,
                },
              }),
      }}
    >
      {/* Emoji slot — width is reserved so alignment stays uniform across
          options even when the LLM-emitted icon isn't a valid emoji
          (in which case we render blank rather than show garbage). */}
      <Box
        sx={{
          fontSize: "22px",
          width: 30,
          flexShrink: 0,
          textAlign: "center",
          fontFamily: tokens.fontEmoji,
          lineHeight: 1,
        }}
      >
        {isLikelyEmoji(option.icon) ? option.icon : ""}
      </Box>

      {/* Label + description */}
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
        <Typography sx={{ fontWeight: 500, fontSize: "16px", color: "inherit", lineHeight: 1.3 }}>
          {option.label}
        </Typography>
        {option.desc && (
          <Typography
            sx={{
              fontSize: "13px",
              color: selected ? "rgba(255,255,255,0.78)" : tokens.ink3,
              lineHeight: 1.35,
            }}
          >
            {option.desc}
          </Typography>
        )}
      </Box>

      {/* Selected indicator */}
      {selected && (
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            backgroundColor: "#fff",
            color: tokens.greenDeep,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </Box>
      )}
    </Box>
  );
}
