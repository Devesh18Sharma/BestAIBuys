import { useEffect, useState } from "react";
import { lookupPriceSummaryByUrl, type PriceSummary } from "@/services/api/wishlist";

/**
 * Fetch the Keepa-backed price summary for a results-card retailer URL.
 *
 * Mirrors the SavedFinds price-history surface (Sergey's BES-18 /
 * BES-46 work) but routes through the URL-based lookup endpoint
 * because results-card products haven't been saved yet — no
 * wishlist-item id to query against.
 *
 * Soft-fail: backend not ready, anonymous user (no auth), URL not
 * resolvable to an ASIN — all return `null` silently so the calling
 * card simply renders the default "no extra context" state. No
 * console noise, no error UI; this is enhancement, not a hard
 * dependency.
 */
export function useResultsPriceSummary(url: string | undefined): {
  summary: PriceSummary | null;
  loading: boolean;
} {
  const [summary, setSummary] = useState<PriceSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(!!url);

  useEffect(() => {
    if (!url) {
      setSummary(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    lookupPriceSummaryByUrl(url, 30)
      .then((res) => {
        if (cancelled) return;
        setSummary(res ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setSummary(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return { summary, loading };
}
