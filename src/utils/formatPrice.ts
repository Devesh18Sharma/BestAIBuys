export function buildGoogleShoppingUrl(term: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(term)}&tbm=shop`;
}

// Generate reliable retailer search URLs from product name
// These always work — unlike LLM-hallucinated direct product links
const RETAILER_SEARCH_URLS: Record<string, (q: string) => string> = {
  Amazon: (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}`,
  Walmart: (q) => `https://www.walmart.com/search?q=${encodeURIComponent(q)}`,
  "Best Buy": (q) =>
    `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(q)}`,
  Target: (q) =>
    `https://www.target.com/s?searchTerm=${encodeURIComponent(q)}`,
  "B&H Photo": (q) =>
    `https://www.bhphotovideo.com/c/search?q=${encodeURIComponent(q)}`,
  Costco: (q) =>
    `https://www.costco.com/CatalogSearch?keyword=${encodeURIComponent(q)}`,
  "Home Depot": (q) =>
    `https://www.homedepot.com/s/${encodeURIComponent(q)}`,
  Newegg: (q) =>
    `https://www.newegg.com/p/pl?d=${encodeURIComponent(q)}`,
};

export function buildRetailerSearchUrl(
  retailerName: string,
  productName: string
): string {
  const builder = RETAILER_SEARCH_URLS[retailerName];
  if (builder) return builder(productName);
  // Fallback: Google Shopping search for unknown retailers
  return buildGoogleShoppingUrl(`${productName} ${retailerName}`);
}
