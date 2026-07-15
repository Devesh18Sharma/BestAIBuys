// Single API client for backend calls.
// In dev: Vite proxies /api → localhost:9000 (same origin, no CORS issues).
// In prod: configure VITE_API_BASE_URL to point to the backend.

import type { NextQuestionResponse } from "@/types/questionnaire";
import type {
  ShoppingResults,
  PriceSearchResults,
  ImageSearchResults,
  PreviewProduct,
} from "@/types/product";
import type { SharedSnapshot } from "@/context/ShoppingFlowContext";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "";

async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}/api/assistant/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return response.json();
}

/**
 * multipart/form-data variant of `request`. Critically, it does NOT set the
 * Content-Type header — the browser sets it automatically with the correct
 * multipart boundary. Used for file uploads (search-by-image).
 */
async function requestForm<T>(path: string, form: FormData): Promise<T> {
  const response = await fetch(`${BASE_URL}/api/assistant/${path}`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return response.json();
}

// Flow 1: "Help me choose"

export interface AnswerItem {
  question: string;
  answerLabel: string;
  answerDesc?: string;
}

/**
 * Sequential question generation — returns ONE question at a time, conditioned
 * on the user's prior answers. The frontend calls this iteratively until
 * `done: true` is returned. This lets the budget question (and others) reflect
 * the constrained product space — e.g. a macOS laptop user gets $700+ tiers
 * instead of $200+.
 *
 * On the first call (empty `previousAnswers`), the response includes
 * `productName` and `emoji` for the category. Subsequent calls return null
 * for those fields.
 */
export function getNextQuestion(
  query: string,
  previousAnswers: AnswerItem[],
): Promise<NextQuestionResponse> {
  return request<NextQuestionResponse>("next-question", { query, previousAnswers });
}

export function getRecommendations(
  query: string,
  productName: string,
  answers: AnswerItem[],
  extraNotes?: string,
  excludeNames?: string[],
): Promise<ShoppingResults> {
  return request<ShoppingResults>("recommendations", {
    query,
    productName,
    answers,
    extraNotes,
    ...(excludeNames && excludeNames.length > 0 && { excludeNames }),
  });
}

// Flow 2: "Find best price"

export interface ValidationResponse {
  isSpecificProduct: boolean;
  productName: string | null;
  searchTerms: string[];
  suggestion: string | null;
}

export function validateProduct(query: string): Promise<ValidationResponse> {
  return request<ValidationResponse>("validate-product", { query });
}

export function searchPrices(
  productName: string,
  searchTerms: string[],
): Promise<PriceSearchResults> {
  return request<PriceSearchResults>("price-search", { productName, searchTerms });
}

// Flow 3: "Search by photo"
// Uploads an image; backend runs reverse-image search and returns the product
// it identified plus a live price comparison (same shape as price-search).
export function searchByImage(file: File): Promise<ImageSearchResults> {
  const form = new FormData();
  form.append("image", file);
  return requestForm<ImageSearchResults>("search-by-image", form);
}

// Quick category search for instant preview while LLM works.
// Backend returns the top 3 catalog products as PreviewProduct[].
// Sends the same productName + answers as /recommendations so the preview
// reflects the user's actual refined intent (and stays consistent with the
// final picks).
export interface QuickSearchResponse {
  products: PreviewProduct[];
}

export function quickSearch(
  query: string,
  productName: string,
  answers: AnswerItem[],
  extraNotes?: string,
  excludeNames?: string[],
): Promise<QuickSearchResponse> {
  return request<QuickSearchResponse>("quick-search", {
    query,
    productName,
    answers,
    ...(extraNotes && { extraNotes }),
    ...(excludeNames && excludeNames.length > 0 && { excludeNames }),
  });
}

// ─── Share search ───
// These hit `/api/share` (not `/api/assistant/*`), so they bypass the
// assistant `request()` helper and build the URL directly.

/** Persist a search snapshot; returns the short id for the `/s/:id` link. */
export async function createShareLink(payload: SharedSnapshot): Promise<{ id: string }> {
  const response = await fetch(`${BASE_URL}/api/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || `Share failed (${response.status})`);
  }
  return response.json();
}

/** Fetch a shared search snapshot by id (public, no auth). */
export async function getSharedSearch(id: string): Promise<SharedSnapshot> {
  const response = await fetch(`${BASE_URL}/api/share/${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? "This shared search isn't available."
        : `Request failed (${response.status})`,
    );
  }
  return response.json();
}
