import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useShoppingFlow } from "@/hooks/useShoppingFlow";
import { SearchHero } from "@/components/home/SearchHero";
import { Benefits } from "@/components/home/Benefits";
import { HowItWorks } from "@/components/home/HowItWorks";
import { CTAStrip } from "@/components/home/CTAStrip";
import { Footer } from "@/components/layout/Footer";

/**
 * Landing page: hero → how it works → quick-search categories → CTA → footer.
 * Layout mirrors Good Find's `Good Find Landing.html`, rebranded as BestAIBuys.
 */
export function HomePage() {
  const { state, setQuery, submitSearch, submitPriceSearch, submitImageSearch } = useShoppingFlow();
  const [isPriceMode, setIsPriceMode] = useState(false);
  const pendingSubmitRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Cross-route anchor scroll (BES-3). When AppBar's "How it works"
  // link is clicked from a non-landing route, it navigates to / with
  // location.state.scrollTo set; we honour that here once the landing
  // markup is mounted, then clear it so future re-renders don't
  // re-trigger the scroll.
  useEffect(() => {
    const target = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (!target) return;
    const el = document.getElementById(target);
    if (!el) return;
    // Defer one frame so layout has settled — fonts may shift heights.
    const id = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      navigate(location.pathname, { replace: true, state: {} });
    }, 60);
    return () => window.clearTimeout(id);
  }, [location.state, location.pathname, navigate]);

  const handleQueryChange = useCallback(
    (q: string) => setQuery(q),
    [setQuery],
  );

  const handleSubmit = useCallback(() => {
    if (state.query.trim().length === 0) return;
    submitSearch();
    // Explicit navigation — replaces the auto-nav effect that used to
    // live in App.tsx and was the actual cause of the BES-2 leak.
    navigate("/search");
  }, [state.query, submitSearch, navigate]);

  const handlePriceSearch = useCallback(() => {
    if (state.query.trim().length === 0) return;
    submitPriceSearch();
    navigate("/search");
  }, [state.query, submitPriceSearch, navigate]);

  const handleToggleMode = useCallback(() => {
    setIsPriceMode((prev) => !prev);
  }, []);

  const handleImageSelect = useCallback(
    (file: File) => {
      submitImageSearch(file);
      navigate("/search");
    },
    [submitImageSearch, navigate],
  );

  const handleSelectSuggestion = useCallback(
    (search: string) => {
      setQuery(search);
      pendingSubmitRef.current = true;
    },
    [setQuery],
  );

  // Auto-submit after query state catches up from a suggestion / floating-
  // product / category-tile click. Navigation is explicit here for the
  // same reason it is in handleSubmit — never auto-nav from a state
  // change effect or stale dispatches can resurrect the chat surface.
  useEffect(() => {
    if (pendingSubmitRef.current && state.query.trim().length > 0) {
      pendingSubmitRef.current = false;
      submitSearch();
      navigate("/search");
    }
  }, [state.query, submitSearch, navigate]);

  return (
    <>
      <SearchHero
        query={state.query}
        isPriceMode={isPriceMode}
        onQueryChange={handleQueryChange}
        onSubmit={handleSubmit}
        onPriceSearch={handlePriceSearch}
        onToggleMode={handleToggleMode}
        onSelectSuggestion={handleSelectSuggestion}
        onImageSelect={handleImageSelect}
      />
      <Benefits />
      <HowItWorks />
      <CTAStrip />
      <Footer />
    </>
  );
}
