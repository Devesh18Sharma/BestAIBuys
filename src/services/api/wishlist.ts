// Wishlist API client. Talks to the NestJS backend's /wishlist-item routes.
// All routes are auth-protected — the JWT is attached via authHeaders().

import type { Recommendation } from "@/types/product";
import { authHeaders } from "./auth";
import { extractAsin } from "@/utils/amazon";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "";

/**
 * The rich client payload we persist in the backend's `data` JSONB column —
 * everything the /saved card needs to render, which the flat columns can't hold.
 */
export interface SavedItemData {
  recommendation: Recommendation;
  query: string;
}

/** A wishlist item as the backend stores/returns it. */
export interface WishlistItem {
  id: number;
  store: string;
  name: string | null;
  url: string | null;
  imageUrl: string | null;
  price: number;
  note: string | null;
  data: SavedItemData | null;
  createdAt?: string;
}

/**
 * Payload for POST /wishlist-item. `store` and `price` are required by the
 * backend DTO; `url`/`imageUrl` are validated with @IsUrl, so they must be
 * omitted entirely when we don't have a real http(s) link. `data` carries the
 * full Recommendation + query for faithful rehydration.
 */
export interface CreateWishlistItemPayload {
  store: string;
  name?: string;
  url?: string;
  imageUrl?: string;
  price: number;
  note?: string;
  data: SavedItemData;
}

async function wishlistFetch<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(`${BASE_URL}/wishlist-item${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const raw = data?.message;
    const message = Array.isArray(raw)
      ? raw.join(", ")
      : raw || `Request failed (${response.status})`;
    throw new Error(message);
  }

  // DELETE returns a row count, not JSON we care about — guard the parse.
  return response.json().catch(() => null as T);
}

export function createWishlistItem(
  payload: CreateWishlistItemPayload,
): Promise<WishlistItem> {
  return wishlistFetch<WishlistItem>("", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteWishlistItem(id: number): Promise<unknown> {
  return wishlistFetch(`/${id}`, { method: "DELETE" });
}

export function getWishlistItems(limit = 100): Promise<WishlistItem[]> {
  return wishlistFetch<WishlistItem[]>(`/${limit}`, { method: "GET" });
}

/** Persist a manual sort. `orderedIds` are backend wishlist-item ids. */
export function reorderWishlistItems(orderedIds: number[]): Promise<unknown> {
  return wishlistFetch("/reorder", {
    method: "PATCH",
    body: JSON.stringify({ orderedIds }),
  });
}

// --- Price history (Keepa) --------------------------------------------
//
// Mirrors the SavedFinds price-history surface Sergey shipped in
// BES-18 / BES-46. The results card consumes the same `PriceSummary`
// shape so the verdict logic stays consistent across surfaces; the
// only difference is the lookup key (saved items use the
// wishlist-item id; results-card items have to look up by retailer
// URL since they haven't been saved yet — see
// `lookupPriceSummaryByUrl` below).

/** Two states only; `null` means "show nothing" (no history / not a deal). */
export type VerdictState = "lowest" | "below_average" | null;

/** One row of the batch price-summary response (mirrors backend PriceSummary). */
export interface PriceSummary {
  id: number;
  supported: boolean;
  currency: string;
  /** ≥2 real points → a chart can be shown, even without a deal verdict. */
  hasHistory: boolean;
  state: VerdictState;
  label: string | null;
  current: number | null;
  min: number | null;
  median: number | null;
  days: number;
  sparkline: number[];
}

/**
 * Batch verdicts for the saved list — one call after the list loads. The caller
 * pre-filters to plausibly-Amazon ids so we don't ask about items with no
 * possible history.
 */
export function getPriceSummaries(
  ids: number[],
  days = 30,
): Promise<PriceSummary[]> {
  return wishlistFetch<PriceSummary[]>("/price-history/summary", {
    method: "POST",
    body: JSON.stringify({ ids, days }),
  });
}

/** A single dated price observation. */
export interface PricePoint {
  date: string;
  price: number;
}

/** Full dated price history for one item (for the interactive chart on expand). */
export interface PriceHistory {
  supported: boolean;
  source: "keepa" | "mock" | null;
  asin: string | null;
  currency: string;
  days: number;
  history: PricePoint[];
}

/** Full curve for one item — fetched lazily when its chart is expanded. */
export function getPriceHistory(id: number, days = 30): Promise<PriceHistory> {
  return wishlistFetch<PriceHistory>(`/${id}/price-history?days=${days}`, {
    method: "GET",
  });
}

/** A dated price observation as the raw price-history curve returns it. */
interface RawPricePoint {
  date: string;
  price: number;
}

/**
 * Derive a `PriceSummary` from a raw daily price curve. BES-50 only strictly
 * needs `median` for the card verdict, but we fill current/min/sparkline too so
 * the object is a faithful `PriceSummary` for any other consumer.
 */
function summaryFromHistory(
  ph: { history?: RawPricePoint[]; supported?: boolean; currency?: string; days?: number },
  days: number,
): PriceSummary {
  const points = Array.isArray(ph.history) ? ph.history : [];
  const prices = points
    .map((p) => Number(p.price))
    .filter((n) => Number.isFinite(n) && n > 0);
  const sorted = [...prices].sort((a, b) => a - b);
  const median = sorted.length ? sorted[Math.floor((sorted.length - 1) / 2)] : null;
  return {
    id: 0,
    supported: ph.supported ?? points.length > 0,
    currency: ph.currency ?? "USD",
    hasHistory: prices.length >= 2,
    state: null,
    label: null,
    current: prices.length ? prices[prices.length - 1] : null,
    min: sorted.length ? sorted[0] : null,
    median,
    days: ph.days ?? days,
    sparkline: prices.slice(-30),
  };
}

/**
 * Sergey's BES-56 endpoint may return either the `PriceSummary` shape (median
 * etc. precomputed, like /summary) or a raw daily price-history curve. Normalise
 * both into the `PriceSummary` the card consumes — `median` is all BES-50 needs.
 */
function normalizePriceSummary(data: unknown, days: number): PriceSummary {
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { history?: unknown }).history)
  ) {
    return summaryFromHistory(data as { history?: RawPricePoint[] }, days);
  }
  return data as PriceSummary;
}

/**
 * Results-card price verdict by retailer URL — Sergey's BES-56 endpoint:
 *   GET /price-history?asin=<ASIN>&days=30    (preferred — ASIN extracted client-side)
 *   GET /price-history?url=<amazon-url>&days=30  (fallback when no ASIN parses)
 *
 * Lives at the backend ROOT (not under /wishlist-item), so it uses a direct
 * fetch rather than `wishlistFetch`. Returns the same `PriceSummary` shape the
 * rest of the app consumes, normalised from whatever the endpoint returns.
 *
 * Soft-fails by design: the caller (useResultsPriceSummary) catches and renders
 * nothing when the endpoint is unavailable (e.g. not yet deployed to this
 * environment — currently 404 on api.bestaibuys.com), the URL isn't an Amazon
 * listing, or the user is anonymous. The auth header is attached for when the
 * route is rate-limited / scoped per authenticated user.
 */
export async function lookupPriceSummaryByUrl(
  url: string,
  days = 30,
): Promise<PriceSummary> {
  const asin = extractAsin(url);
  const params = new URLSearchParams({ days: String(days) });
  if (asin) params.set("asin", asin);
  else params.set("url", url);

  const response = await fetch(`${BASE_URL}/price-history?${params.toString()}`, {
    method: "GET",
    headers: { ...authHeaders() },
  });

  if (!response.ok) {
    throw new Error(`price-history lookup failed (${response.status})`);
  }

  const data = await response.json().catch(() => null);
  return normalizePriceSummary(data, days);
}

// --- Mapping -----------------------------------------------------------

const HTTP_URL_RE = /^https?:\/\/.+/i;

/** Parse "$129.00" / "129" → 129. Returns 0 when no number is present. */
function parsePrice(price: string | undefined): number {
  if (!price) return 0;
  const m = price.replace(/,/g, "").match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

/**
 * Map a frontend Recommendation onto the backend's flat wishlist-item shape.
 * The rich card data (pros/cons/tiers/retailer list) has no column to live in,
 * so we persist the essentials the wishlist needs: store, name, price, link,
 * image and a short note. url/imageUrl are only included when they're real
 * http(s) links — otherwise the @IsUrl validation would reject the whole POST.
 */
export function recommendationToPayload(
  rec: Recommendation,
  query: string,
): CreateWishlistItemPayload {
  const primary = rec.retailers?.[0];
  const payload: CreateWishlistItemPayload = {
    store: primary?.name || "Online",
    name: rec.name,
    price: parsePrice(primary?.price || rec.price),
    note: rec.oneLiner,
    // The flat columns are kept for interop with other DB consumers; `data` is
    // the source of truth the /saved page rehydrates from.
    data: { recommendation: rec, query },
  };

  if (primary?.url && HTTP_URL_RE.test(primary.url)) {
    payload.url = primary.url;
  }
  if (rec.imageUrl && HTTP_URL_RE.test(rec.imageUrl)) {
    payload.imageUrl = rec.imageUrl;
  }

  return payload;
}
