export const AUTO_ADVANCE_DELAY = 200; // ms after selecting an option

/**
 * Sentinel value we store as the answer when the user taps "No preference".
 * The /next-question endpoint expects every prior question to be acknowledged
 * — sending an empty answer would let the LLM re-ask the same question.
 * We translate this sentinel to `answerLabel: "No preference"` at the API
 * boundary (see useShoppingFlow.collectAnswers / submitForRecommendations).
 */
export const SKIP_OPTION_ID = "__skip";
export const SKIP_ANSWER_LABEL = "No preference";

export const QUESTION_LOADING_MESSAGES = [
  "Understanding what you need",
  "Crafting smart questions",
  "Analyzing product category",
  "Personalizing your experience",
];

export const SEARCH_LOADING_MESSAGES = [
  "Searching across retailers",
  "Comparing prices on Amazon, Walmart, Best Buy",
  "Finding the smartest deals",
  "Analyzing value vs. hype",
  "Verifying real-time prices",
  "Building your recommendations",
  "Almost done — picking the best value",
];

export const POPULAR_SEARCHES = [
  "Fountain pen",
  "Running shoes",
  "Mechanical keyboard",
  "Air purifier",
  "Wireless earbuds",
  "Rice cooker",
  "Standing desk",
  "Backpack for travel",
  "Yoga mat",
];
