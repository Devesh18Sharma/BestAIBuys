export type ChatMessageRole = "bot" | "user" | "system";

export type ChatMessageType =
  | "user-search"
  | "generating"
  | "greeting"
  | "bot-question"
  | "thinking"
  | "user-answer"
  | "extra-input-prompt"
  | "user-extra-input"
  | "preview-results"
  | "results"
  | "price-validating"
  | "product-not-specific"
  | "price-loading"
  | "price-results"
  | "image-loading"
  | "image-results"
  | "error"
  | "search-again";

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  type: ChatMessageType;
  text?: string;
  questionIndex?: number;
  questionId?: string;
  optionId?: string;
}
