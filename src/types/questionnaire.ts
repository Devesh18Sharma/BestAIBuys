export interface QuestionOption {
  id: string;
  label: string;
  /** Optional clarifier — only populated when label alone is ambiguous. */
  desc?: string;
  icon: string;
}

export interface DynamicQuestion {
  id: string;
  question: string;
  options: QuestionOption[];
  /** True when this is the budget question (last in the sequence). */
  isBudget?: boolean;
}

/**
 * Response from the sequential /next-question endpoint. Returns ONE question
 * at a time, conditioned on prior answers. productName/emoji are set only on
 * the first response (when no priorAnswers). `done: true` signals the question
 * phase is complete.
 */
export interface NextQuestionResponse {
  productName: string | null;
  emoji: string | null;
  done: boolean;
  question: DynamicQuestion | null;
}
