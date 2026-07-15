// Mirror of the backend's ASIN extraction (keepa.service.ts). Used as a cheap,
// network-free pre-filter so we only ask the price-summary endpoint about items
// that plausibly have Amazon price history.
import type { Recommendation } from "@/types/product";

const ASIN_PATTERNS = [
  /\/(?:dp|gp\/product|gp\/aw\/d|product)\/([A-Z0-9]{10})(?:[/?]|$)/i,
  /[?&]asin=([A-Z0-9]{10})/i,
];

export function extractAsin(url?: string | null): string | null {
  if (!url) return null;
  for (const re of ASIN_PATTERNS) {
    const m = url.match(re);
    if (m) return m[1].toUpperCase();
  }
  return null;
}

/** True if any retailer link on the recommendation resolves to an Amazon ASIN. */
export function hasAmazonAsin(rec: Recommendation): boolean {
  return (rec.retailers ?? []).some((r) => extractAsin(r.url));
}
