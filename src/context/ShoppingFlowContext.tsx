import { createContext, useReducer, type ReactNode } from "react";
import type { DynamicQuestion } from "@/types/questionnaire";
import type { ShoppingResults, PriceSearchResults, ImageSearchResults, PreviewProduct } from "@/types/product";

export type FlowScreen =
  | "home"
  | "generating"
  | "questionnaire"
  | "extra_input"
  | "searching"
  | "results"
  | "validating_product"
  | "product_not_specific"
  | "price_searching"
  | "price_results"
  | "image_searching"
  | "image_results"
  | "error";

/**
 * One round of recommendation results in the conversation. The first turn is
 * the initial search (refineText ""); each subsequent turn is produced by the
 * user typing more detail into the refine box. Both cards (Top Rated preview +
 * AI Recommended) are re-fetched per turn, so refining updates both — and prior
 * turns stay in the chat history instead of being overwritten.
 */
export interface ResultTurn {
  /** The free-text the user added that produced this turn ("" for the first). */
  refineText: string;
  /** Top Rated card (quick-search). null while still loading. */
  previewProducts: PreviewProduct[] | null;
  /** AI Recommended card (/recommendations). null while still loading. */
  results: ShoppingResults | null;
}

export interface FlowState {
  screen: FlowScreen;
  query: string;
  /** Set after the FIRST /next-question response. */
  productName: string | null;
  emoji: string | null;
  /** Questions accumulated as the user progresses through the sequential flow. */
  questions: DynamicQuestion[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  /** True while we're awaiting the next /next-question response. */
  isFetchingNext: boolean;
  /** True once the backend has signalled `done` — no more questions to ask. */
  questionsComplete: boolean;
  extraNotes: string;
  /** Transient value of the post-result "refine" textbox. Cleared on submit. */
  refineNotes: string;
  /**
   * Product names the user has already seen and rejected via the refine box.
   * Sent to /recommendations so each re-search returns something different.
   */
  excludedNames: string[];
  /**
   * Conversation history of recommendation rounds. The last entry is the
   * active turn. `results`/`previewProducts` below mirror the active turn for
   * the handful of non-history readers (scroll anchor, loading gate).
   */
  resultTurns: ResultTurn[];
  results: ShoppingResults | null;
  previewProducts: PreviewProduct[] | null;
  priceResults: PriceSearchResults | null;
  imageResults: ImageSearchResults | null;
  /** Local object-URL preview of the photo the user uploaded (image flow). */
  imagePreviewUrl: string | null;
  productSuggestion: string | null;
  error: string | null;
  startedAt: number;
  /** True when this state was hydrated from a shared link — renders read-only. */
  isShared: boolean;
}

/**
 * The render-relevant subset of FlowState we persist for a share link. Loading
 * it back reproduces the exact page the original user saw. Kept explicit (not
 * `Partial<FlowState>`) so the snapshot builder and hydrate stay in sync.
 */
export type SharedSnapshot = Pick<
  FlowState,
  | "screen"
  | "query"
  | "productName"
  | "emoji"
  | "questions"
  | "answers"
  | "currentQuestionIndex"
  | "questionsComplete"
  | "extraNotes"
  | "excludedNames"
  | "resultTurns"
  | "results"
  | "previewProducts"
  | "priceResults"
  | "imageResults"
  | "productSuggestion"
>;

export type FlowAction =
  | { type: "SET_QUERY"; query: string }
  | { type: "START_GENERATING" }
  | { type: "FIRST_QUESTION_READY"; productName: string; emoji: string; question: DynamicQuestion }
  | { type: "FETCH_NEXT_START" }
  | { type: "NEXT_QUESTION_READY"; question: DynamicQuestion }
  | { type: "ADVANCE_INDEX"; index: number }
  | { type: "QUESTIONS_COMPLETE" }
  | { type: "ANSWER_QUESTION"; questionId: string; optionId: string }
  | { type: "CLEAR_ANSWER"; questionId: string }
  | { type: "PREV_QUESTION" }
  | { type: "GO_TO_EXTRA_INPUT" }
  | { type: "SET_EXTRA_NOTES"; notes: string }
  | { type: "SET_REFINE_NOTES"; notes: string }
  | { type: "START_REFINING"; rejectedNames: string[] }
  | { type: "START_SEARCHING" }
  | { type: "PREVIEW_READY"; products: PreviewProduct[] }
  | { type: "RESULTS_READY"; data: ShoppingResults }
  | { type: "START_VALIDATING_PRODUCT" }
  | { type: "PRODUCT_VALIDATED"; normalizedQuery: string }
  | { type: "PRODUCT_NOT_SPECIFIC"; suggestion: string }
  | { type: "START_PRICE_SEARCH" }
  | { type: "PRICE_RESULTS_READY"; data: PriceSearchResults }
  | { type: "START_IMAGE_SEARCH"; previewUrl: string }
  | { type: "IMAGE_RESULTS_READY"; data: ImageSearchResults }
  | { type: "SET_ERROR"; error: string }
  | { type: "HYDRATE_SHARED_STATE"; payload: SharedSnapshot }
  | { type: "RESET" }
  | { type: "GO_BACK" };

function createInitialState(): FlowState {
  return {
    screen: "home",
    query: "",
    productName: null,
    emoji: null,
    questions: [],
    currentQuestionIndex: 0,
    answers: {},
    isFetchingNext: false,
    questionsComplete: false,
    extraNotes: "",
    refineNotes: "",
    excludedNames: [],
    resultTurns: [],
    results: null,
    previewProducts: null,
    priceResults: null,
    imageResults: null,
    imagePreviewUrl: null,
    productSuggestion: null,
    error: null,
    startedAt: Date.now(),
    isShared: false,
  };
}

/**
 * The LLM occasionally reuses an id between sequential questions (e.g. emits
 * two questions both with id "primary_use"). That collides our `answers`
 * keying, leading to a wrong/empty answerLabel when the payload is built.
 * Suffix duplicate ids with the index they're being appended at to keep them
 * unique without touching the rest of the keying logic.
 */
function ensureUniqueId(
  newQuestion: DynamicQuestion,
  existing: DynamicQuestion[],
): DynamicQuestion {
  const existingIds = new Set(existing.map((q) => q.id));
  if (!existingIds.has(newQuestion.id)) return newQuestion;
  let i = 1;
  let candidate = `${newQuestion.id}_${i}`;
  while (existingIds.has(candidate)) {
    i += 1;
    candidate = `${newQuestion.id}_${i}`;
  }
  return { ...newQuestion, id: candidate };
}

/**
 * Patch the active (last) result turn, creating an initial turn if none exists
 * yet (covers the head-start preview that can land before START_SEARCHING).
 * Also re-syncs the `results`/`previewProducts` mirrors so the non-history
 * readers (scroll anchor, refine-box loading gate) see the active turn.
 */
function patchActiveTurn(
  state: FlowState,
  patch: Partial<ResultTurn>,
): Pick<FlowState, "resultTurns" | "results" | "previewProducts"> {
  const turns =
    state.resultTurns.length > 0
      ? [...state.resultTurns]
      : [{ refineText: "", previewProducts: null, results: null }];
  const i = turns.length - 1;
  turns[i] = { ...turns[i], ...patch };
  return {
    resultTurns: turns,
    results: turns[i].results,
    previewProducts: turns[i].previewProducts,
  };
}

function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case "SET_QUERY":
      return { ...state, query: action.query };

    case "START_GENERATING":
      // Brand-new search → clear everything except the query itself.
      // previewProducts is wiped HERE (not on START_SEARCHING) so the
      // head-start quickSearch results survive the extra_input → searching
      // transition.
      return {
        ...state,
        screen: "generating",
        error: null,
        questions: [],
        currentQuestionIndex: 0,
        answers: {},
        productName: null,
        emoji: null,
        questionsComplete: false,
        isFetchingNext: true,
        previewProducts: null,
        results: null,
        resultTurns: [],
        extraNotes: "",
        refineNotes: "",
        excludedNames: [],
      };

    case "FIRST_QUESTION_READY":
      return {
        ...state,
        screen: "questionnaire",
        productName: action.productName,
        emoji: action.emoji,
        questions: [action.question],
        currentQuestionIndex: 0,
        answers: {},
        isFetchingNext: false,
      };

    case "FETCH_NEXT_START":
      return { ...state, isFetchingNext: true };

    case "NEXT_QUESTION_READY": {
      const q = ensureUniqueId(action.question, state.questions);
      return {
        ...state,
        questions: [...state.questions, q],
        currentQuestionIndex: state.questions.length, // index of the newly appended question
        isFetchingNext: false,
      };
    }

    case "ADVANCE_INDEX":
      return {
        ...state,
        currentQuestionIndex: action.index,
        isFetchingNext: false,
      };

    case "QUESTIONS_COMPLETE":
      return {
        ...state,
        questionsComplete: true,
        isFetchingNext: false,
        screen: "extra_input",
      };

    case "ANSWER_QUESTION":
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.questionId]: action.optionId,
        },
      };

    case "CLEAR_ANSWER": {
      const { [action.questionId]: _, ...rest } = state.answers;
      return { ...state, answers: rest };
    }

    case "PREV_QUESTION": {
      if (state.currentQuestionIndex === 0) {
        return { ...state, screen: "home" };
      }
      return { ...state, currentQuestionIndex: state.currentQuestionIndex - 1 };
    }

    case "GO_TO_EXTRA_INPUT":
      return { ...state, screen: "extra_input" };

    case "SET_EXTRA_NOTES":
      return { ...state, extraNotes: action.notes };

    case "SET_REFINE_NOTES":
      return { ...state, refineNotes: action.notes };

    case "START_REFINING": {
      // Re-search WITHOUT discarding the current result: append a NEW turn (its
      // refineText is what the user just typed) so prior turns stay in the chat
      // history. Both cards in the new turn start as loaders. Accumulate the
      // rejected pick(s) into excludedNames (deduped). extraNotes is left alone
      // — refinement text accumulates via each turn's refineText instead.
      const refined = state.refineNotes.trim();
      return {
        ...state,
        // Stay on "results" so the whole conversation (every prior turn + the
        // new loading turn + the refine box) keeps rendering.
        screen: "results",
        error: null,
        refineNotes: "",
        results: null,
        previewProducts: null,
        resultTurns: [
          ...state.resultTurns,
          { refineText: refined, previewProducts: null, results: null },
        ],
        excludedNames: Array.from(
          new Set([...state.excludedNames, ...action.rejectedNames]),
        ),
      };
    }

    case "START_SEARCHING": {
      // Transition from extra_input → searching. Ensure an active turn exists
      // (the head-start quickSearch may already have created one via
      // PREVIEW_READY; if not, seed an empty turn so the loaders render).
      return {
        ...state,
        screen: "searching",
        error: null,
        ...patchActiveTurn(state, {}),
      };
    }

    case "PREVIEW_READY":
      // Top Rated landed — write it into the active turn. Never resurrect a
      // preview onto the home/error screens.
      if (state.screen === "home" || state.screen === "error") return state;
      return { ...state, ...patchActiveTurn(state, { previewProducts: action.products }) };

    case "RESULTS_READY":
      // AI Recommended landed — write it into the active turn and surface results.
      return {
        ...state,
        screen: "results",
        ...patchActiveTurn(state, { results: action.data }),
      };

    case "START_VALIDATING_PRODUCT":
      return { ...state, screen: "validating_product", error: null, productSuggestion: null };

    case "PRODUCT_VALIDATED":
      return { ...state, query: action.normalizedQuery, screen: "price_searching", error: null };

    case "PRODUCT_NOT_SPECIFIC":
      return { ...state, productSuggestion: action.suggestion, screen: "product_not_specific" };

    case "START_PRICE_SEARCH":
      return { ...state, screen: "price_searching", error: null };

    case "PRICE_RESULTS_READY":
      return { ...state, priceResults: action.data, screen: "price_results" };

    case "START_IMAGE_SEARCH":
      // Brand-new image search → clear any prior flow state, stash the local
      // photo preview so the loading/results screens can show what was sent.
      return {
        ...state,
        screen: "image_searching",
        error: null,
        query: "",
        imagePreviewUrl: action.previewUrl,
        imageResults: null,
        results: null,
        resultTurns: [],
        priceResults: null,
        previewProducts: null,
      };

    case "IMAGE_RESULTS_READY":
      return { ...state, imageResults: action.data, screen: "image_results" };

    case "SET_ERROR":
      return { ...state, error: action.error, screen: "error", isFetchingNext: false };

    case "GO_BACK": {
      if (state.screen === "extra_input") {
        return {
          ...state,
          screen: "questionnaire",
          currentQuestionIndex: state.questions.length - 1,
        };
      }
      if (state.screen === "questionnaire") {
        if (state.currentQuestionIndex > 0) {
          return {
            ...state,
            currentQuestionIndex: state.currentQuestionIndex - 1,
          };
        }
        return { ...state, screen: "home" };
      }
      return state;
    }

    case "HYDRATE_SHARED_STATE":
      // Atomically replace state with a shared snapshot, flagged read-only.
      // Spread over a fresh initial state so any field absent from the snapshot
      // (e.g. transient refineNotes) gets a sane default.
      return { ...createInitialState(), ...action.payload, isShared: true };

    case "RESET":
      return createInitialState();

    default:
      return state;
  }
}

export interface ShoppingFlowContextValue {
  state: FlowState;
  dispatch: React.Dispatch<FlowAction>;
}

export const ShoppingFlowContext =
  createContext<ShoppingFlowContextValue | null>(null);

export function ShoppingFlowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(flowReducer, undefined, createInitialState);

  return (
    <ShoppingFlowContext.Provider value={{ state, dispatch }}>
      {children}
    </ShoppingFlowContext.Provider>
  );
}
