import type { PreviewProduct } from "@/types/product";

/**
 * Demo-mode helpers. The real backend doesn't populate preview cards or
 * recommendation images yet, so these fallbacks let the chat UI render
 * fully populated end-to-end while the API matures.
 *
 * All assets are static files in /public — same set used on the landing
 * hero, so there's no extra network cost.
 */

const FALLBACK_IMAGE = "/mixer.png";

/**
 * Lightweight keyword router from a free-form query to one of the product
 * images we already ship in /public. First match wins.
 */
const QUERY_IMAGE_MATCHERS: ReadonlyArray<{ pattern: RegExp; image: string }> = [
  { pattern: /shampoo|conditioner|hair/i, image: "/shampoo.png" },
  { pattern: /coffee|espresso|bean/i, image: "/coffee.png" },
  { pattern: /matcha|tea|green tea/i, image: "/matcha.png" },
  { pattern: /luggage|suitcase|carry[\s-]?on|travel bag/i, image: "/luggage.png" },
  { pattern: /shoe|sneaker|running|footwear|trainer/i, image: "/sneaker.png" },
  { pattern: /mixer|blender|kitchen|stand mixer|appliance/i, image: "/mixer.png" },
  { pattern: /chair|sofa|desk|furniture|table/i, image: "/chair.png" },
  { pattern: /bag|backpack|tote|purse|clutch/i, image: "/bag.png" },
];

/** Picks an image path that visually matches the user's query. */
export function pickProductImage(query: string | null | undefined): string {
  if (!query) return FALLBACK_IMAGE;
  for (const m of QUERY_IMAGE_MATCHERS) {
    if (m.pattern.test(query)) return m.image;
  }
  return FALLBACK_IMAGE;
}

/**
 * Three plausible "Top Rated" preview cards built from mock data. Used as
 * a graceful fallback when the backend quick-search returns no products.
 * The retailer/price spread is intentional — it mirrors a typical search
 * (one budget store, one mainstream, one premium) so the cards look real.
 */
const MOCK_RETAILERS: ReadonlyArray<{ name: string; multiplier: number }> = [
  { name: "Amazon", multiplier: 1.0 },
  { name: "Target", multiplier: 1.12 },
  { name: "Williams Sonoma", multiplier: 1.35 },
];

export function buildMockPreviewProducts(query: string): PreviewProduct[] {
  const image = pickProductImage(query);
  // Cheap deterministic basePrice from the query so the same search always
  // shows the same prices (better than flicker on every render).
  const basePrice = 60 + hashStringToInt(query) % 240; // $60–$300

  return MOCK_RETAILERS.map((r): PreviewProduct => {
    const price = Math.round(basePrice * r.multiplier);
    return {
      name: query,
      retailer: r.name,
      price: `$${price}`,
      rating: 4.4,
      reviewCount: 1200 + ((hashStringToInt(r.name + query) % 4000) | 0),
      imageUrl: image,
      url: buildSearchUrl(r.name, query),
    };
  });
}

function buildSearchUrl(retailer: string, query: string): string {
  const q = encodeURIComponent(query);
  switch (retailer) {
    case "Amazon":
      return `https://www.amazon.com/s?k=${q}`;
    case "Target":
      return `https://www.target.com/s?searchTerm=${q}`;
    case "Williams Sonoma":
      return `https://www.williams-sonoma.com/search/results.html?words=${q}`;
    default:
      return `https://www.google.com/search?q=${q}`;
  }
}

// Tiny non-crypto hash so prices are stable per query.
function hashStringToInt(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
