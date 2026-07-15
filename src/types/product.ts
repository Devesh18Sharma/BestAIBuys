export interface Retailer {
  name: string;
  price: string;
  url: string;
  note?: string;
  /**
   * MSRP / list price, e.g. Amazon's "List: $149.95". Optional —
   * present only when the backend pulled it from the retailer page.
   * Used by the BES-39 results card to compute the "You Save $X /
   * Y% OFF" verdict (PriceContext.computePriceVerdict).
   */
  listPrice?: string;
}

export type RecommendationTier = "budget" | "value" | "premium";

export interface Recommendation {
  tier: RecommendationTier;
  tierLabel: string;
  name: string;
  price: string;
  rating: number;
  reviewCount?: number;
  oneLiner: string;
  pros: string[];
  cons: string[];
  whyItWorks: string;
  retailers: Retailer[];
  imageUrl?: string;
  comparedToPremium?: string;
  savingsNote?: string;
  premiumTax?: string;
}

export interface ShoppingResults {
  headline: string;
  insight: string;
  recommendations: Recommendation[];
  proTip: string;
  avoidList: string[];
  searchTerms: string[];
}

export interface PriceSearchResults {
  productName: string;
  retailers: Retailer[];
  imageUrl?: string;
}

// Reverse-image search: user uploads a photo, backend identifies the product
// and returns the same price-comparison shape as PriceSearchResults.
// `productName` is null when nothing could be identified. `matchedFrom` holds
// the top reverse-image match titles (for transparency / debugging).
export interface ImageSearchResults {
  productName: string | null;
  retailers: Retailer[];
  imageUrl?: string;
  matchedFrom?: string[];
}

// Quick preview products shown while LLM works
export interface PreviewProduct {
  name: string;
  price: string;
  rating: number;
  reviewCount?: number;
  imageUrl?: string;
  retailer: string;
  url: string;
  /** Retail/List price ("$149.95") from Oxylabs (BES-53), when the listing
   * carried a strikethrough. Drives the Top Rated card's "You Save / % OFF"
   * pill. Omitted when absent. */
  listPrice?: string;
}
