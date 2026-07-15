import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useShoppingFlow } from "@/hooks/useShoppingFlow";
import { ChatOptionButton } from "./ChatOptionButton";
import { tokens } from "@/config/theme";
import { SKIP_OPTION_ID, SKIP_ANSWER_LABEL } from "@/config/constants";

interface BotQuestionMessageProps {
  questionIndex: number;
}

/**
 * Renders a question step as the chat sees it:
 *
 *  ┌────────────────────────────────┐
 *  │  question text (white pill)    │   ← short pill bubble
 *  └────────────────────────────────┘
 *  [ option chip — full width ]
 *  [ option chip — full width ]
 *  [ skip chip — dashed outline  ]
 *
 * The options sit OUTSIDE any bubble so the pill stays tight around the
 * question text only, matching Good Find's follow-up flow.
 */
export function BotQuestionMessage({ questionIndex }: BotQuestionMessageProps) {
  const { state, answerQuestion, skipQuestions } = useShoppingFlow();

  const question = state.questions[questionIndex];
  if (!question) return null;

  const isAnswered = !!state.answers[question.id];
  const isActive =
    state.screen === "questionnaire" &&
    state.currentQuestionIndex === questionIndex &&
    !isAnswered;

  return (
    <Box
      // `data-question-index` is the anchor target ChatShell scrolls to
      // when the user advances to the next step. `scrollMarginTop` adds a
      // small visual gutter above the bubble so it doesn't kiss the top
      // edge of the scroll viewport (where the 3px progress bar sits).
      data-question-index={questionIndex}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        width: "100%",
        scrollMarginTop: "20px",
      }}
    >
      {/* Bot bubble — pill, tight around the question text */}
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        style={{ display: "flex", justifyContent: "flex-start", width: "100%" }}
      >
        <Box
          // Active-question highlight: the bubble visually attaches to
          // the green action chips below via a 1.5px green hairline +
          // soft green-tinted background. A small pulsing green dot at
          // the start of the question text reads as a directional
          // "answer this" cue. Past questions keep the quiet hairline
          // look so the chat history stays calm and only the live
          // question draws the eye. Transitions are 250ms so the
          // highlight gracefully hands off as the user advances.
          sx={{
            maxWidth: { xs: "92%", sm: "78%" },
            p: isActive ? "18px 24px" : "16px 22px",
            borderRadius: "999px",
            fontSize: isActive
              ? { xs: "17px", sm: "17.5px" }
              : "16.5px",
            fontWeight: isActive ? 500 : 400,
            lineHeight: 1.4,
            backgroundColor: isActive
              ? `color-mix(in oklab, ${tokens.green} 8%, ${tokens.bgElev})`
              : tokens.bgElev,
            border: isActive
              ? `1.5px solid ${tokens.green}`
              : `1px solid ${tokens.rule}`,
            color: tokens.ink,
            boxShadow: isActive ? tokens.shadowMd : "none",
            transition:
              "background-color .25s ease, border-color .25s ease, box-shadow .25s ease, padding .25s ease, font-size .25s ease",
          }}
        >
          {isActive && (
            <Box
              component="span"
              aria-hidden
              sx={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: tokens.greenDeep,
                mr: 1.25,
                verticalAlign: "middle",
                position: "relative",
                top: "-1px",
                animation: "activeQuestionDot 1.6s ease-in-out infinite",
                "@keyframes activeQuestionDot": {
                  "0%, 100%": { opacity: 1, transform: "scale(1)" },
                  "50%": { opacity: 0.55, transform: "scale(0.82)" },
                },
              }}
            />
          )}
          {question.question}
        </Box>
      </motion.div>

      {/* Option chips — full width, outside the bubble */}
      {isActive && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "10px", mt: "4px" }}>
          <Typography
            sx={{
              fontSize: 12,
              color: tokens.ink3,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              mb: 0.25,
            }}
          >
            Pick the best fit
          </Typography>
          {question.options.map((opt) => (
            <ChatOptionButton
              key={opt.id}
              option={opt}
              onClick={() => answerQuestion(question.id, opt.id)}
            />
          ))}
          <ChatOptionButton
            option={{
              id: SKIP_OPTION_ID,
              label: SKIP_ANSWER_LABEL,
              desc: "Skip this question",
              icon: "🤷",
            }}
            isSkip
            onClick={skipQuestions}
          />
        </Box>
      )}
    </Box>
  );
}
