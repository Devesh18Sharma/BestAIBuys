import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { useShoppingFlow } from "@/hooks/useShoppingFlow";
import { tokens } from "@/config/theme";
import { ChatBubble } from "./ChatBubble";
import { GeneratingMessage } from "./messages/GeneratingMessage";
import { ThinkingMessage } from "./messages/ThinkingMessage";
import { BotQuestionMessage } from "./messages/BotQuestionMessage";
import { UserAnswerBubble } from "./messages/UserAnswerBubble";
import { ExtraInputMessage } from "./messages/ExtraInputMessage";
import { PreviewResultsMessage } from "./messages/PreviewResultsMessage";
import { ResultsMessage } from "./messages/ResultsMessage";
import { PriceResultsMessage } from "./messages/PriceResultsMessage";
import { ImageLoadingMessage } from "./messages/ImageLoadingMessage";
import { ImageResultsMessage } from "./messages/ImageResultsMessage";
import { ErrorMessage } from "./messages/ErrorMessage";
import type { ChatMessage } from "@/types/chat";

/**
 * ChatShell layout matches Natalya's followup.css:
 * - .fprog: 3px progress bar under nav
 * - .fmain: grid with 760px center column
 * - .fcrumb: back button + step counter
 * - .fquery: "You searched" pill (999px radius)
 * - .fconv: conversation column (gap: 14px)
 * - .ffoot: sticky footer CTA bar
 */
export function ChatShell() {
  const messages = useChatMessages();
  const { state, goBack, skipQuestions } = useShoppingFlow();
  const scrollRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { setFollowing } = useAutoScroll(scrollRef, messages.length);

  // When the picks layout first appears (the moment the user clicks
  // "Find deals" and screen transitions to "searching"), pause
  // auto-tail and scroll the picks panel to the TOP of the viewport so
  // the "Your Best Picks" heading + both cards are visible. Runs once
  // per picks session — not again when results arrive, since the
  // panel's already in view.
  const resultsLandedRef = useRef(false);
  useEffect(() => {
    const isPicksLayout =
      state.screen === "searching" || state.screen === "results";
    if (!isPicksLayout) {
      resultsLandedRef.current = false;
      return;
    }
    if (resultsLandedRef.current) return;
    resultsLandedRef.current = true;
    setFollowing(false);
    // Wait for layout + framer enter animations to commit before scrolling.
    const id = setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
    return () => clearTimeout(id);
  }, [state.screen, setFollowing]);

  // When the user advances to the next question, anchor that question's
  // bubble to the TOP of the scroll viewport. The default auto-tail
  // would drop them at the bottom of the option chips — readable, but
  // it hides the question text the chips belong to. Pausing follow +
  // scrolling the bubble into view at block:"start" matches the same
  // pattern used when the final results land (above) so the chat
  // behaves consistently as the user progresses.
  //
  // Index 0 is intentionally skipped: question 0 enters along with the
  // "You searched" pill on the first render of the questionnaire — the
  // user is already at the top of the conversation. Scrolling there
  // would just yank the page for no benefit.
  useEffect(() => {
    if (state.screen !== "questionnaire") return;
    if (state.currentQuestionIndex <= 0) return;
    setFollowing(false);
    // Defer until after the framer enter animation on the new bubble
    // commits — without the wait the target's box is still its
    // pre-animation position and scrollIntoView lands a hair off.
    const id = setTimeout(() => {
      const target = scrollRef.current?.querySelector(
        `[data-question-index="${state.currentQuestionIndex}"]`,
      ) as HTMLElement | null;
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
    return () => clearTimeout(id);
  }, [state.currentQuestionIndex, state.screen, setFollowing]);

  const isQuestionnaire = state.screen === "questionnaire" || state.screen === "extra_input";
  const totalQ = state.questions.length;
  const stepNum = Math.min(state.currentQuestionIndex + 1, totalQ);

  return (
    <Box
      sx={{
        // FIXED height (not minHeight) so the inner flex:1 child becomes
        // the actual scroll container. Without this the WINDOW scrolls
        // instead of scrollRef and every programmatic scrollTo no-ops.
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* ── Progress bar — .fprog (3px, green fill) ── */}
      {isQuestionnaire && totalQ > 0 && (
        <Box sx={{ flexShrink: 0, height: "3px", backgroundColor: tokens.rule }}>
          <Box
            sx={{
              height: "100%",
              backgroundColor: tokens.green,
              width: `${(stepNum / totalQ) * 100}%`,
              transition: "width .5s cubic-bezier(.2,.8,.2,1)",
            }}
          />
        </Box>
      )}

      {/* ── Scrollable main area ──
          `minHeight: 0` is critical: a flex child won't shrink below its
          content's natural height without it, which would silently disable
          internal overflow scrolling. */}
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overscrollBehavior: "contain",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {/* Center column — max 760px matching .fmain grid */}
        <Box
          sx={{
            maxWidth: 760,
            mx: "auto",
            pt: "32px",
            pb: "60px",
            px: { xs: "18px", sm: "24px" },
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            position: "relative",
          }}
        >
          {/* ── Breadcrumb — .fcrumb ── */}
          {isQuestionnaire && (
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: "10px" }}>
              <Box
                onClick={goBack}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  p: "8px 14px",
                  borderRadius: 999,
                  border: "1px solid transparent",
                  fontSize: "13.5px",
                  color: tokens.ink,
                  cursor: "pointer",
                  transition: "all .15s ease",
                  "&:hover": { backgroundColor: tokens.ink, color: "#fff", borderColor: tokens.ink },
                }}
              >
                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                Back
              </Box>
              <Typography sx={{ fontSize: "12px", letterSpacing: ".08em", textTransform: "uppercase", color: tokens.ink3 }}>
                Step {stepNum} of {totalQ}
              </Typography>
            </Box>
          )}

          {/* ── "You searched" pill — .fquery ── */}
          {state.query && state.screen !== "home" && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                p: { xs: "16px 20px", sm: "18px 22px" },
                backgroundColor: tokens.bgElev,
                border: `1px solid ${tokens.rule}`,
                borderRadius: 999,
                mb: "12px",
              }}
            >
              <Typography sx={{ fontSize: "11.5px", color: tokens.ink3, textTransform: "uppercase", letterSpacing: ".1em", flexShrink: 0 }}>
                You searched
              </Typography>
              <Typography
                sx={{
                  fontFamily: tokens.fontSerif,
                  fontSize: { xs: "18px", sm: "22px" },
                  fontWeight: 500,
                  letterSpacing: "-.01em",
                  color: tokens.greenDeep,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                "{state.query}"
              </Typography>
            </Box>
          )}

          {/* ── Messages (incl. the 2-card Top Rated + Recommended block) ── */}
          {messages.map((msg) => renderMessage(msg))}
        </Box>

        {/* Results panel — owns BOTH the searching (skeletons) and
            results (real cards) states (BES-39). Renders the moment
            the user submits, so they never see a separate "loading"
            screen; instead they see the final 2-card layout with
            placeholders that fill in as data lands. Refed so we can
            scrollIntoView to its TOP when results arrive. */}
        {(state.screen === "searching" || state.screen === "results") && (
          <Box
            ref={resultsRef}
            sx={{
              // 1100 px keeps the two cards at ~500 px each + 24 px gap,
              // matching the visual footprint the old 3-card grid used
              // to occupy. Going wider made each card stretch past the
              // sensible product-card ratio and the whole layout broke
              // the viewport on common widths.
              maxWidth: 1100,
              mx: "auto",
              px: { xs: 2, sm: 4, md: 5 },
              pt: { xs: 2, sm: 3 },
              pb: 6,
              // Sticky AppBar is ~64–72 px tall. 96 px scroll-margin
              // keeps the "Your Best Picks" headline visible BELOW the
              // header instead of tucked behind its translucent
              // backdrop-filter.
              scrollMarginTop: "96px",
            }}
          >
            <ResultsMessage />
          </Box>
        )}
      </Box>

      {/* ── Footer CTA — .ffoot ──
          flexShrink: 0 keeps this pinned to the bottom of the column
          (the outer Box's overflow: hidden makes sticky positioning a
          no-op, so this is the equivalent layout). */}
      {isQuestionnaire && (
        <Box
          sx={{
            flexShrink: 0,
            borderTop: `1px solid ${tokens.rule}`,
            p: "18px 24px",
            background: `color-mix(in oklab, ${tokens.bg} 92%, transparent)`,
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
        >
          <Box sx={{ maxWidth: 760, mx: "auto", display: "flex", gap: 2, alignItems: "center" }}>
            <Box
              onClick={skipQuestions}
              sx={{
                fontSize: "14px",
                color: tokens.ink2,
                p: "10px 16px",
                borderRadius: 999,
                cursor: "pointer",
                transition: "all .15s ease",
                "&:hover": { color: tokens.ink, backgroundColor: tokens.bgElev },
              }}
            >
              Skip question
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

function renderMessage(msg: ChatMessage) {
  switch (msg.type) {
    case "user-search":
      // Shown in "You searched" pill, not as bubble
      return null;

    case "generating":
    case "price-validating":
    case "price-loading":
      // GeneratingMessage renders its own card — must NOT be wrapped in a
      // 999px-radius ChatBubble or the tall task list becomes an oval.
      return (
        <Box key={msg.id} sx={{ width: "100%" }}>
          <GeneratingMessage />
        </Box>
      );

    case "thinking":
      return (
        <ChatBubble key={msg.id} role="bot">
          <ThinkingMessage />
        </ChatBubble>
      );

    case "greeting":
      return (
        <ChatBubble key={msg.id} role="bot" variant="intro">
          {/* AI label like the design's intro bubble */}
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: tokens.ink3, textTransform: "uppercase", letterSpacing: ".1em", mb: "8px" }}>
            <svg viewBox="0 0 24 24" width={11} height={11} fill={tokens.greenDeep}><path d="M12 4l1.8 6.2L20 12l-6.2 1.8L12 20l-1.8-6.2L4 12l6.2-1.8L12 4z" /></svg>
            BestAIBuys · AI assistant
          </Box>
          <Box sx={{ color: tokens.ink }} dangerouslySetInnerHTML={{ __html: (msg.text ?? "").replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:700">$1</strong>') }} />
        </ChatBubble>
      );

    case "bot-question":
      // BotQuestionMessage owns its own bubble + options layout — don't wrap
      // again, or the pill stretches into a giant oval around the chips.
      return <BotQuestionMessage key={msg.id} questionIndex={msg.questionIndex!} />;

    case "user-answer":
      return (
        <ChatBubble key={msg.id} role="user">
          <UserAnswerBubble questionId={msg.questionId!} optionId={msg.optionId!} />
        </ChatBubble>
      );

    case "extra-input-prompt":
      // Owns its own bubble + form layout — don't wrap in a pill ChatBubble.
      return <ExtraInputMessage key={msg.id} />;

    case "user-extra-input":
      return (
        <ChatBubble key={msg.id} role="user">
          <Box sx={{ color: "inherit" }}>{msg.text}</Box>
        </ChatBubble>
      );

    case "preview-results":
      return (
        <Box key={msg.id} sx={{ width: "100%" }}>
          <PreviewResultsMessage />
        </Box>
      );

    case "results":
      // BES-39: the 2-card layout (Top Rated + Best Match) is owned
      // by ResultsMessage, rendered directly off state.screen above —
      // NOT through this chat-message pipeline.
      return null;

    case "product-not-specific":
      return (
        <ChatBubble key={msg.id} role="bot">
          <ProductNotSpecificInline />
        </ChatBubble>
      );

    case "price-results":
      return (
        <Box key={msg.id} sx={{ width: "100%" }}>
          <PriceResultsMessage />
        </Box>
      );

    case "image-loading":
      return (
        <Box key={msg.id} sx={{ width: "100%" }}>
          <ImageLoadingMessage />
        </Box>
      );

    case "image-results":
      return (
        <Box key={msg.id} sx={{ width: "100%" }}>
          <ImageResultsMessage />
        </Box>
      );

    case "error":
      return (
        <ChatBubble key={msg.id} role="bot">
          <ErrorMessage text={msg.text} />
        </ChatBubble>
      );

    case "search-again":
      // Standalone "Start new search" for the price-search / search-by-image
      // flows (they have no refine box). The recommendation flow puts this
      // button inside ResultsMessage's refine box instead.
      return <StartNewSearchMessage key={msg.id} />;

    default:
      return null;
  }
}

/** Lone "Start new search" pill shown under price/image results. */
function StartNewSearchMessage() {
  const { reset } = useShoppingFlow();
  const navigate = useNavigate();
  // Navigate home explicitly (not just reset): on a shared `/s/:id` page there's
  // no `/search`→`/` redirect to fall back on, so resetting in place would leave
  // a blank home-state page at the shared URL.
  const onClick = () => {
    reset();
    navigate("/");
  };
  return (
    <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
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
    </Box>
  );
}

function ProductNotSpecificInline() {
  const { state, reset, submitSearch } = useShoppingFlow();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <Box sx={{ lineHeight: 1.45 }}>
        🤔 "{state.query}" is a bit too broad for a price check. I need a specific product name with brand and model.
      </Box>
      {state.productSuggestion && (
        <Box sx={{ backgroundColor: tokens.bg, border: `1px solid ${tokens.rule}`, borderRadius: "16px", p: "14px 16px" }}>
          <Typography sx={{ fontSize: "12px", fontWeight: 600, color: tokens.ink3, textTransform: "uppercase", letterSpacing: ".08em", mb: "4px" }}>
            Suggestion
          </Typography>
          <Typography sx={{ fontSize: "14px", color: tokens.ink, lineHeight: 1.5 }}>
            {state.productSuggestion}
          </Typography>
        </Box>
      )}
      <Box sx={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <Box
          onClick={reset}
          sx={{
            p: "10px 18px",
            borderRadius: 999,
            backgroundColor: tokens.ink,
            color: tokens.bg,
            fontSize: "14.5px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "background .15s",
            "&:hover": { backgroundColor: "#000" },
          }}
        >
          Try specific product
        </Box>
        <Box
          onClick={submitSearch}
          sx={{
            p: "10px 18px",
            borderRadius: 999,
            border: `1.5px solid ${tokens.rule}`,
            color: tokens.ink,
            fontSize: "14.5px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all .15s",
            "&:hover": { borderColor: tokens.ink },
          }}
        >
          Help me choose
        </Box>
      </Box>
    </Box>
  );
}
