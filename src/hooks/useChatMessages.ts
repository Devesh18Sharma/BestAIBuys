import { useMemo } from "react";
import { useShoppingFlow } from "./useShoppingFlow";
import type { ChatMessage } from "@/types/chat";
import type { DynamicQuestion } from "@/types/questionnaire";

/**
 * Derives an ordered array of chat messages from the current FlowState.
 * No message state is stored — this is a pure function of the reducer state,
 * so the conversation history stays in sync with the state machine for free.
 */
export function useChatMessages(): ChatMessage[] {
  const { state } = useShoppingFlow();

  return useMemo(() => {
    const msgs: ChatMessage[] = [];
    let id = 0;
    const next = (): string => `msg-${id++}`;

    const screen = state.screen;
    if (screen === "home") return msgs;

    // 1. User's search query
    msgs.push({ id: next(), role: "user", type: "user-search", text: state.query });

    // ── PRICE FLOW ──

    if (screen === "validating_product") {
      msgs.push({ id: next(), role: "bot", type: "price-validating" });
      return msgs;
    }
    if (screen === "product_not_specific") {
      msgs.push({ id: next(), role: "bot", type: "product-not-specific" });
      return msgs;
    }
    if (screen === "price_searching") {
      msgs.push({ id: next(), role: "bot", type: "price-loading" });
      return msgs;
    }
    if (screen === "price_results") {
      msgs.push({ id: next(), role: "bot", type: "price-results" });
      msgs.push({ id: next(), role: "system", type: "search-again" });
      return msgs;
    }

    // ── IMAGE (SEARCH BY PHOTO) FLOW ──

    if (screen === "image_searching") {
      msgs.push({ id: next(), role: "bot", type: "image-loading" });
      return msgs;
    }
    if (screen === "image_results") {
      msgs.push({ id: next(), role: "bot", type: "image-results" });
      msgs.push({ id: next(), role: "system", type: "search-again" });
      return msgs;
    }

    // ── RECOMMENDATION FLOW ──

    // Buffer 1: generating questions
    if (screen === "generating") {
      msgs.push({ id: next(), role: "bot", type: "generating" });
      return msgs;
    }

    // Error — show whatever conversation happened before, then the error
    if (screen === "error") {
      if (state.productName) {
        msgs.push({
          id: next(), role: "bot", type: "greeting",
          text: `Let me help you find the perfect ${state.productName}...`,
        });
        buildQuestionHistory(msgs, next, state, state.questions);
      }
      msgs.push({ id: next(), role: "bot", type: "error", text: state.error ?? undefined });
      return msgs;
    }

    if (!state.productName) return msgs;

    // Greeting
    msgs.push({
      id: next(), role: "bot", type: "greeting",
      text: `Let's find the right **${state.productName}**`,
    });

    // Build Q&A conversation
    buildQuestionHistory(msgs, next, state, state.questions);

    // While the next sequential question is loading, show a typing indicator
    // so the chat doesn't look frozen on the previously-answered question.
    if (screen === "questionnaire" && state.isFetchingNext) {
      msgs.push({ id: next(), role: "bot", type: "thinking" });
    }

    // Questionnaire — done, just show questions + current active one
    if (screen === "questionnaire") return msgs;

    // Extra input — free-text prompt + (when the head-start
    // quickSearch has landed) the "Top Rated in this Category" preview
    // rail so the user has a real product visual while they write
    // notes. Past this screen the 2-card ResultsMessage layout owns
    // the picks presentation, so we deliberately stop emitting the
    // preview rail here — see the comment further down.
    if (screen === "extra_input") {
      msgs.push({ id: next(), role: "bot", type: "extra-input-prompt" });
      if (state.previewProducts && state.previewProducts.length > 0) {
        msgs.push({ id: next(), role: "bot", type: "preview-results" });
      }
      return msgs;
    }

    // Past extra input (searching or results) — show submitted notes in
    // the chat history if the user added any. The redundant "Thank you"
    // greeting is intentionally removed: the design's rhythm is user
    // answer → "Top Rated in this Category" → loading card, no filler.
    if (state.extraNotes) {
      msgs.push({ id: next(), role: "bot", type: "extra-input-prompt" });
      msgs.push({ id: next(), role: "user", type: "user-extra-input", text: state.extraNotes });
    }

    // BES-39: main's `top-picks` chat-message rendering and the older
    // "Working on…" loader-card message are both removed. The 2-card
    // ResultsMessage layout (rendered by ChatShell directly off
    // state.screen, NOT through this message pipeline) owns its own
    // placeholder ↔ real swap during both `searching` and `results`
    // screens.
    //
    // The recommendation flow's post-result affordances (refine box with
    // "Continue search" + "Start new search") live INSIDE ResultsMessage
    // now, after the last turn — so we deliberately emit nothing here for
    // the results screen. (price/image flows still push their own
    // "search-again" earlier, which renders a standalone "Start new search".)

    return msgs;
  }, [
    state.screen,
    state.query,
    state.productName,
    state.questions,
    state.currentQuestionIndex,
    state.isFetchingNext,
    state.answers,
    state.extraNotes,
    state.results,
    state.previewProducts,
    state.priceResults,
    state.imageResults,
    state.imagePreviewUrl,
    state.error,
    state.productSuggestion,
  ]);
}

/** Builds the back-and-forth Q&A portion of the conversation */
function buildQuestionHistory(
  msgs: ChatMessage[],
  next: () => string,
  state: { screen: string; currentQuestionIndex: number; answers: Record<string, string> },
  questions: DynamicQuestion[],
) {
  const isOnQuestionnaire = state.screen === "questionnaire";
  const maxIndex = isOnQuestionnaire
    ? state.currentQuestionIndex
    : questions.length - 1;

  for (let i = 0; i <= maxIndex && i < questions.length; i++) {
    const q = questions[i];
    msgs.push({ id: next(), role: "bot", type: "bot-question", questionIndex: i });

    const answerId = state.answers[q.id];
    if (answerId) {
      msgs.push({
        id: next(), role: "user", type: "user-answer",
        questionId: q.id, optionId: answerId,
      });
    }
  }
}
