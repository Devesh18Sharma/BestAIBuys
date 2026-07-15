import { useContext, useCallback, useRef, useEffect } from "react";
import { ShoppingFlowContext, type FlowState, type SharedSnapshot } from "@/context/ShoppingFlowContext";
import { trackEvent } from "@/services/analytics";
import {
  getNextQuestion,
  getRecommendations,
  validateProduct,
  searchPrices,
  searchByImage,
  quickSearch,
  createShareLink,
} from "@/services/api/client";
import type { AnswerItem } from "@/services/api/client";
import type { DynamicQuestion } from "@/types/questionnaire";

/**
 * Pick the render-relevant subset of state for a share snapshot — exactly the
 * fields the shared page needs to reproduce the page. Kept in one place so it
 * stays in sync with the SharedSnapshot type and HYDRATE_SHARED_STATE.
 */
function buildSnapshot(s: FlowState): SharedSnapshot {
  return {
    screen: s.screen,
    query: s.query,
    productName: s.productName,
    emoji: s.emoji,
    questions: s.questions,
    answers: s.answers,
    currentQuestionIndex: s.currentQuestionIndex,
    questionsComplete: s.questionsComplete,
    extraNotes: s.extraNotes,
    excludedNames: s.excludedNames,
    resultTurns: s.resultTurns,
    results: s.results,
    previewProducts: s.previewProducts,
    priceResults: s.priceResults,
    imageResults: s.imageResults,
    productSuggestion: s.productSuggestion,
  };
}
import {
  AUTO_ADVANCE_DELAY,
  SKIP_OPTION_ID,
  SKIP_ANSWER_LABEL,
} from "@/config/constants";

/**
 * Single source of truth for the AnswerItem[] payload sent to every
 * backend endpoint that needs the user's prior answers
 * (/next-question, /quick-search, /recommendations).
 *
 * Rules encoded here:
 *  - Skipped questions (SKIP_OPTION_ID sentinel) translate to an
 *    explicit { answerLabel: "No preference" } entry — the LLM needs
 *    to see the question was asked or it'll re-emit it.
 *  - Missing or unresolvable answers are dropped silently (the API
 *    rejects empty/null answerLabels with 400).
 *  - `upToIndex` (optional, default = all) caps the iteration; used by
 *    `advanceFromAnswer` to send only the answers gathered so far.
 *
 * Pure module-level function so it can be called from useCallbacks
 * without entering their dep arrays.
 */
function buildAnswerItems(
  questions: DynamicQuestion[],
  answers: Record<string, string>,
  upToIndex: number = questions.length,
): AnswerItem[] {
  const items: AnswerItem[] = [];
  const limit = Math.min(upToIndex, questions.length);
  for (let i = 0; i < limit; i++) {
    const q = questions[i];
    if (!q) continue;
    const optionId = answers[q.id];
    if (!optionId) continue;
    if (optionId === SKIP_OPTION_ID) {
      items.push({ question: q.question, answerLabel: SKIP_ANSWER_LABEL });
      continue;
    }
    const opt = q.options.find((o) => o.id === optionId);
    if (!opt || !opt.label) continue;
    items.push({
      question: q.question,
      answerLabel: opt.label,
      answerDesc: opt.desc,
    });
  }
  return items;
}

export function useShoppingFlow() {
  const context = useContext(ShoppingFlowContext);
  if (!context) {
    throw new Error(
      "useShoppingFlow must be used within a ShoppingFlowProvider"
    );
  }

  const { state, dispatch } = context;
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The setTimeout callbacks below need to read the LATEST state, but their
  // closures are captured at scheduling time — before the just-dispatched
  // action has been applied. Mirror the live state into a ref so the timer
  // callback can always read fresh values.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  /**
   * Build the AnswerItem[] payload from currently-collected answers,
   * up to (but not including) `upToIndex`. Thin wrapper around the
   * module-level `buildAnswerItems` — all the translation logic
   * (skip sentinel, missing-answer skip) lives in one place.
   */
  const collectAnswers = useCallback((upToIndex: number): AnswerItem[] => {
    const s = stateRef.current;
    return buildAnswerItems(s.questions, s.answers, upToIndex);
  }, []);

  const setQuery = useCallback(
    (query: string) => {
      dispatch({ type: "SET_QUERY", query });
    },
    [dispatch]
  );

  /**
   * Kick off the question phase by requesting the FIRST question. Subsequent
   * questions are fetched on-demand as the user answers (see advanceFromAnswer).
   */
  const submitSearch = useCallback(async () => {
    const query = stateRef.current.query;
    try {
      trackEvent("search_submit", { query });
      dispatch({ type: "START_GENERATING" });
      const r = await getNextQuestion(query, []);

      if (r.done || !r.question) {
        dispatch({ type: "QUESTIONS_COMPLETE" });
        return;
      }

      dispatch({
        type: "FIRST_QUESTION_READY",
        productName: r.productName ?? query,
        emoji: r.emoji ?? "🛒",
        question: r.question,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      dispatch({
        type: "SET_ERROR",
        error: `Failed to generate questions. ${message}`,
      });
    }
  }, [dispatch]);

  /**
   * Fire-and-forget Top Rated (quick-search) preview. Sends the same payload as
   * the /recommendations call so the preview lines up with the final picks.
   * Fired from submitForRecommendations (on "Find deals"), in parallel with the
   * recommendation — NOT during the questionnaire, so no product preview shows
   * before the user chooses to search.
   */
  const fetchPreviewProducts = useCallback(() => {
    const s = stateRef.current;
    const productName = s.productName ?? s.query;
    const answerItems = buildAnswerItems(s.questions, s.answers);

    quickSearch(s.query, productName, answerItems)
      .then((preview) => {
        // Pass real products straight through — even when empty. We do NOT
        // substitute mock cards: those linked to a bare amazon.com/s?k=<query>
        // search page, which leaked into production whenever quick-search came
        // back empty. On an empty preview the ResultsMessage Top Rated slot
        // falls back to the real /recommendations pick instead.
        dispatch({ type: "PREVIEW_READY", products: preview.products });
      })
      .catch(() => {
        // Backend unreachable — leave the preview empty (Top Rated falls back
        // to the recommendation). Screen-aware reducer no-ops off-screen.
        dispatch({ type: "PREVIEW_READY", products: [] });
      });
  }, [dispatch]);

  /**
   * Called after the user answers the current question. Reads the latest
   * state from the ref so it sees the just-dispatched ANSWER_QUESTION even
   * when invoked from a setTimeout closure.
   */
  const advanceFromAnswer = useCallback(async () => {
    const s = stateRef.current;
    const nextIndex = s.currentQuestionIndex + 1;

    // Already fetched (user navigated back, then forward).
    if (nextIndex < s.questions.length) {
      dispatch({ type: "ADVANCE_INDEX", index: nextIndex });
      return;
    }

    // Already complete — go to extra_input.
    if (s.questionsComplete) {
      dispatch({ type: "GO_TO_EXTRA_INPUT" });
      return;
    }

    dispatch({ type: "FETCH_NEXT_START" });
    try {
      const priorAnswers = collectAnswers(nextIndex);
      const r = await getNextQuestion(s.query, priorAnswers);

      if (r.done || !r.question) {
        // Do NOT head-start quick-search here. Firing it on the extra_input
        // ("Anything else?") step surfaced a Top Rated preview that read like a
        // finished result with a single product — users stopped there without
        // clicking "Find deals", so /recommendations never ran. Quick-search now
        // fires alongside /recommendations in submitForRecommendations instead.
        dispatch({ type: "QUESTIONS_COMPLETE" });
        return;
      }
      dispatch({ type: "NEXT_QUESTION_READY", question: r.question });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      dispatch({
        type: "SET_ERROR",
        error: `Failed to load next question. ${message}`,
      });
    }
  }, [dispatch, collectAnswers]);

  const answerQuestion = useCallback(
    (questionId: string, optionId: string) => {
      trackEvent("answer_question", { question_id: questionId, option_id: optionId });
      dispatch({ type: "ANSWER_QUESTION", questionId, optionId });

      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }

      autoAdvanceTimer.current = setTimeout(() => {
        // advanceFromAnswer is stable (no state deps) and reads from
        // stateRef, so it sees the just-dispatched answer.
        void advanceFromAnswer();
      }, AUTO_ADVANCE_DELAY);
    },
    [dispatch, advanceFromAnswer]
  );

  const goBack = useCallback(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }
    dispatch({ type: "GO_BACK" });
  }, [dispatch]);

  const setExtraNotes = useCallback(
    (notes: string) => {
      dispatch({ type: "SET_EXTRA_NOTES", notes });
    },
    [dispatch]
  );

  const submitForRecommendations = useCallback(async () => {
    const s = stateRef.current;
    try {
      dispatch({ type: "START_SEARCHING" });

      const productName = s.productName ?? s.query;
      const answerItems = buildAnswerItems(s.questions, s.answers);

      // Kick off the Top Rated preview (quick-search) here — in parallel with
      // the AI recommendation below — so nothing loads until the user actually
      // clicks "Find deals". Fire-and-forget: it lands into the active turn via
      // PREVIEW_READY. (Skip if it somehow already ran, e.g. re-entry.)
      if (!s.previewProducts || s.previewProducts.length === 0) {
        fetchPreviewProducts();
      }

      // Main LLM recommendations (the real deal)
      const data = await getRecommendations(
        s.query,
        productName,
        answerItems,
        s.extraNotes,
      );

      dispatch({ type: "RESULTS_READY", data });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      dispatch({
        type: "SET_ERROR",
        error: `Failed to get recommendations. ${message}`,
      });
    }
  }, [dispatch, fetchPreviewProducts]);

  const setRefineNotes = useCallback(
    (notes: string) => {
      dispatch({ type: "SET_REFINE_NOTES", notes });
    },
    [dispatch],
  );

  /**
   * Post-result refinement. The user wasn't happy with the current turn and
   * typed more detail into the refine box. We append a NEW turn (keeping prior
   * turns in the conversation) and re-run BOTH cards for it — quick-search (Top
   * Rated) and /recommendations (AI pick) — with the accumulated notes and the
   * names of everything already shown, so both come back different.
   */
  const refineRecommendations = useCallback(async () => {
    const s = stateRef.current;
    const refineText = s.refineNotes.trim();
    if (!refineText) return;

    const activeTurn = s.resultTurns[s.resultTurns.length - 1];

    // Everything already shown in the active turn — both the AI pick(s) and the
    // Top Rated card — so neither re-appears on the next pass.
    const rejected = [
      ...(activeTurn?.results?.recommendations ?? []).map((r) => r.name),
      activeTurn?.previewProducts?.[0]?.name,
    ].filter((n): n is string => Boolean(n));
    const excludeNames = Array.from(new Set([...s.excludedNames, ...rejected]));

    // Accumulate every refinement the user has typed so far (each turn carries
    // the text that produced it) plus the new one, on top of the original notes.
    const combinedNotes = [
      s.extraNotes,
      ...s.resultTurns.map((t) => t.refineText),
      refineText,
    ]
      .filter(Boolean)
      .join(". ");

    trackEvent("refine_result", {
      query: s.query,
      turn: s.resultTurns.length,
      excluded: excludeNames.length,
    });
    dispatch({ type: "START_REFINING", rejectedNames: rejected });

    const productName = s.productName ?? s.query;
    const answerItems = buildAnswerItems(s.questions, s.answers);

    // Continue-search turns show TWO recommendation picks (Best Match +
    // Alternative) — no quick-search/Top Rated card — so we only call
    // /recommendations, which now returns up to 2 distinct picks.
    try {
      const data = await getRecommendations(
        s.query,
        productName,
        answerItems,
        combinedNotes,
        excludeNames,
      );
      dispatch({ type: "RESULTS_READY", data });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      dispatch({
        type: "SET_ERROR",
        error: `Failed to refine recommendations. ${message}`,
      });
    }
  }, [dispatch]);

  const submitPriceSearch = useCallback(async () => {
    const query = stateRef.current.query;
    try {
      trackEvent("price_search_submit", { query });
      dispatch({ type: "START_VALIDATING_PRODUCT" });
      const validation = await validateProduct(query);

      if (!validation.isSpecificProduct) {
        dispatch({
          type: "PRODUCT_NOT_SPECIFIC",
          suggestion: validation.suggestion || "Try a specific product name like 'Sony WH-1000XM5' or 'Nike Pegasus 41'",
        });
        return;
      }

      const normalizedName = validation.productName || query;
      dispatch({ type: "PRODUCT_VALIDATED", normalizedQuery: normalizedName });

      const priceData = await searchPrices(normalizedName, validation.searchTerms);

      dispatch({ type: "PRICE_RESULTS_READY", data: priceData });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      dispatch({
        type: "SET_ERROR",
        error: `Failed to search prices. ${message}`,
      });
    }
  }, [dispatch]);

  /**
   * "Search by photo" flow. Uploads the chosen image, shows a local preview
   * while the backend runs reverse-image search, then lands the identified
   * product + price comparison. Mirrors submitPriceSearch's shape.
   */
  const submitImageSearch = useCallback(
    async (file: File) => {
      try {
        trackEvent("image_search_submit", {
          size: file.size,
          type: file.type,
        });
        const previewUrl = URL.createObjectURL(file);
        dispatch({ type: "START_IMAGE_SEARCH", previewUrl });

        const data = await searchByImage(file);

        dispatch({ type: "IMAGE_RESULTS_READY", data });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        dispatch({
          type: "SET_ERROR",
          error: `Failed to search by image. ${message}`,
        });
      }
    },
    [dispatch],
  );

  const skipQuestions = useCallback(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }
    const s = stateRef.current;
    const currentQuestion = s.questions[s.currentQuestionIndex];
    if (currentQuestion) {
      // Record the skip as an explicit sentinel answer so the LLM sees
      // "No preference" in priorAnswers and doesn't re-ask the question.
      dispatch({
        type: "ANSWER_QUESTION",
        questionId: currentQuestion.id,
        optionId: SKIP_OPTION_ID,
      });
    }
    // CRITICAL: defer advanceFromAnswer behind the same AUTO_ADVANCE_DELAY
    // setTimeout used by answerQuestion. stateRef.current is updated by a
    // useEffect that only runs AFTER React commits the dispatch above —
    // calling advanceFromAnswer synchronously would read a stale stateRef
    // (no SKIP sentinel in answers), collectAnswers would omit this
    // question from the /next-question payload, and the LLM would re-ask
    // the same question because it has no record we asked it. The
    // setTimeout gives React a tick to commit + flush the useEffect.
    autoAdvanceTimer.current = setTimeout(() => {
      void advanceFromAnswer();
    }, AUTO_ADVANCE_DELAY);
  }, [dispatch, advanceFromAnswer]);

  const reset = useCallback(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }
    dispatch({ type: "RESET" });
  }, [dispatch]);

  /**
   * Persist the current page as a shareable snapshot and return the full link.
   * The recipient opens it and sees the exact same page (read-only).
   */
  const shareSearch = useCallback(async (): Promise<string> => {
    const s = stateRef.current;
    trackEvent("share_search", { query: s.query, turns: s.resultTurns.length });
    const { id } = await createShareLink(buildSnapshot(s));
    return `${window.location.origin}/s/${id}`;
  }, []);

  /** Load a fetched shared snapshot into state (renders read-only). */
  const hydrateShared = useCallback(
    (payload: SharedSnapshot) => {
      dispatch({ type: "HYDRATE_SHARED_STATE", payload });
    },
    [dispatch],
  );

  return {
    state,
    setQuery,
    submitSearch,
    submitPriceSearch,
    submitImageSearch,
    answerQuestion,
    skipQuestions,
    goBack,
    setExtraNotes,
    submitForRecommendations,
    setRefineNotes,
    refineRecommendations,
    shareSearch,
    hydrateShared,
    reset,
  };
}
