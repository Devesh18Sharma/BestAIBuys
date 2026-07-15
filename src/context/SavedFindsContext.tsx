import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Recommendation } from "@/types/product";
import { useAuth } from "@/context/AuthContext";
import {
  createWishlistItem,
  deleteWishlistItem,
  getWishlistItems,
  recommendationToPayload,
  reorderWishlistItems,
  type WishlistItem,
} from "@/services/api/wishlist";
import { AuthModal } from "@/components/auth/AuthModal";

/**
 * A single saved find as rendered on the /saved page. The backend wishlist-item
 * row is the source of truth; this is the rehydrated in-memory view of it.
 */
export interface SavedFind {
  id: string;
  /** The product as the LLM returned it. */
  recommendation: Recommendation;
  /** Original query that produced this find, for the "From '…'" chip. */
  query: string;
  /** Unix ms when the user bookmarked the item (from the row's createdAt). */
  savedAt: number;
  /** Backend wishlist-item id — used to delete/reorder the right row. */
  remoteId?: number;
}

interface SavedFindsContextValue {
  items: SavedFind[];
  /** True while the list is being loaded from the backend. */
  loading: boolean;
  /** True iff a recommendation with the same id is currently saved. */
  isSaved: (id: string) => boolean;
  /**
   * Entry point for the save button. When signed in, toggles the find. When
   * signed out, remembers the pick and opens the auth modal — the save then
   * completes automatically once the user signs in, so their choice isn't lost.
   */
  requestSave: (recommendation: Recommendation, query: string) => void;
  /** Toggle a recommendation in/out of the saved list (no-op when logged out). */
  toggle: (recommendation: Recommendation, query: string) => void;
  /** Remove a single saved find by id. */
  remove: (id: string) => void;
  /** Re-order the saved list (manual sort), persisted to the backend. */
  reorder: (nextOrder: SavedFind[]) => void;
  /** Wipe the entire list. */
  clear: () => void;
}

const SavedFindsContext = createContext<SavedFindsContextValue | null>(null);

/**
 * Deterministic id for a recommendation so multiple saves of the same
 * pick collapse cleanly. Uses the product name + tier as the key —
 * unique within the LLM's output, stable across sessions.
 */
function recommendationId(rec: Recommendation): string {
  return `${rec.tier}::${rec.name}`.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Rebuild a minimal Recommendation from the flat columns, for rows saved
 * without a `data` payload (legacy rows, or items created by another client).
 * Returns null when there isn't even a name to show.
 */
function fallbackRecommendation(item: WishlistItem): Recommendation | null {
  if (!item.name) return null;
  const price = item.price != null ? `$${item.price}` : "";
  return {
    tier: "value",
    tierLabel: "Saved",
    name: item.name,
    price,
    rating: 0,
    oneLiner: item.note ?? "",
    pros: [],
    cons: [],
    whyItWorks: "",
    retailers: item.store
      ? [{ name: item.store, price, url: item.url ?? "" }]
      : [],
    imageUrl: item.imageUrl ?? undefined,
  };
}

/** Rehydrate a backend row into a SavedFind, or null if it can't be rendered. */
function savedFindFromItem(item: WishlistItem): SavedFind | null {
  const recommendation =
    item.data?.recommendation ?? fallbackRecommendation(item);
  if (!recommendation) return null;
  return {
    id: recommendationId(recommendation),
    recommendation,
    query: item.data?.query ?? "",
    savedAt: item.createdAt ? new Date(item.createdAt).getTime() : Date.now(),
    remoteId: item.id,
  };
}

export function SavedFindsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SavedFind[]>([]);
  const [loading, setLoading] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  // Always-current snapshot so callbacks can read the latest list without
  // being re-created on every change.
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // A pick the user tried to save while logged out. Held until they finish
  // signing in via the auth modal, then saved automatically (see the load
  // effect below). Cleared if they dismiss the modal without signing in.
  const pendingSaveRef = useRef<{ recommendation: Recommendation; query: string } | null>(null);

  // Add a find: optimistic insert, create the row, stamp its id. Shared by the
  // direct toggle and the post-login pending-save flow. No-op if already saved.
  const addSaved = useCallback((recommendation: Recommendation, query: string) => {
    const id = recommendationId(recommendation);
    if (itemsRef.current.some((x) => x.id === id)) return;

    const find: SavedFind = { id, recommendation, query, savedAt: Date.now() };
    setItems((prev) => [find, ...prev]);

    createWishlistItem(recommendationToPayload(recommendation, query))
      .then((row) => {
        setItems((cur) => {
          // Unsaved while the POST was in flight — the row is orphaned; delete it.
          if (!cur.some((x) => x.id === id)) {
            deleteWishlistItem(row.id).catch(() => {});
            return cur;
          }
          return cur.map((x) => (x.id === id ? { ...x, remoteId: row.id } : x));
        });
      })
      .catch(() => {
        // Save failed — roll back the optimistic add.
        setItems((cur) => cur.filter((x) => x.id !== id));
      });
  }, []);

  // The backend is the source of truth: load on login, clear on logout.
  // A request token guards against a stale response landing after logout.
  const loadToken = useRef(0);
  useEffect(() => {
    const token = ++loadToken.current;
    if (!isAuthenticated) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getWishlistItems(100)
      .then((rows) => {
        if (token !== loadToken.current) return; // superseded
        const seen = new Set<string>();
        const finds: SavedFind[] = [];
        for (const row of rows) {
          const find = savedFindFromItem(row);
          if (find && !seen.has(find.id)) {
            seen.add(find.id);
            finds.push(find);
          }
        }
        setItems(finds);

        // Complete a save the user requested while logged out.
        const pending = pendingSaveRef.current;
        if (pending) {
          pendingSaveRef.current = null;
          addSaved(pending.recommendation, pending.query);
        }
      })
      .catch(() => {
        if (token === loadToken.current) setItems([]);
      })
      .finally(() => {
        if (token === loadToken.current) setLoading(false);
      });
  }, [isAuthenticated, addSaved]);

  const isSaved = useCallback(
    (id: string) => items.some((x) => x.id === id),
    [items],
  );

  const toggle = useCallback(
    (recommendation: Recommendation, query: string) => {
      // Saving requires an account — the backend keys items by userId. Guests
      // reach the auth modal via requestSave, not toggle.
      if (!isAuthenticated) return;

      const id = recommendationId(recommendation);
      const existing = itemsRef.current.find((x) => x.id === id);

      if (existing) {
        // Unsave — optimistic remove, then delete the row.
        setItems((prev) => prev.filter((x) => x.id !== id));
        if (existing.remoteId != null) {
          deleteWishlistItem(existing.remoteId).catch(() => {});
        }
        return;
      }

      addSaved(recommendation, query);
    },
    [isAuthenticated, addSaved],
  );

  // Save button entry point. Signed in → toggle. Signed out → remember the pick
  // and open the auth modal; the load effect saves it once they're in.
  const requestSave = useCallback(
    (recommendation: Recommendation, query: string) => {
      if (isAuthenticated) {
        toggle(recommendation, query);
        return;
      }
      pendingSaveRef.current = { recommendation, query };
      setAuthPromptOpen(true);
    },
    [isAuthenticated, toggle],
  );

  const handleAuthSuccess = useCallback(() => {
    // The pending save runs from the load effect once isAuthenticated flips.
    setAuthPromptOpen(false);
  }, []);

  const handleAuthDismiss = useCallback(() => {
    pendingSaveRef.current = null;
    setAuthPromptOpen(false);
  }, []);

  const remove = useCallback((id: string) => {
    const existing = itemsRef.current.find((x) => x.id === id);
    setItems((prev) => prev.filter((x) => x.id !== id));
    if (existing?.remoteId != null) {
      deleteWishlistItem(existing.remoteId).catch(() => {});
    }
  }, []);

  const reorder = useCallback((nextOrder: SavedFind[]) => {
    setItems(nextOrder);
    const ids = nextOrder
      .map((x) => x.remoteId)
      .filter((x): x is number => x != null);
    if (ids.length) reorderWishlistItems(ids).catch(() => {});
  }, []);

  const clear = useCallback(() => {
    const current = itemsRef.current;
    setItems([]);
    current.forEach((x) => {
      if (x.remoteId != null) deleteWishlistItem(x.remoteId).catch(() => {});
    });
  }, []);

  const value = useMemo<SavedFindsContextValue>(
    () => ({ items, loading, isSaved, requestSave, toggle, remove, reorder, clear }),
    [items, loading, isSaved, requestSave, toggle, remove, reorder, clear],
  );

  return (
    <SavedFindsContext.Provider value={value}>
      {children}
      <AuthModal
        open={authPromptOpen}
        onClose={handleAuthDismiss}
        onAuthenticated={handleAuthSuccess}
        reason="Sign in to save this find to your wishlist — we'll keep your pick and add it as soon as you're in."
      />
    </SavedFindsContext.Provider>
  );
}

export function useSavedFinds(): SavedFindsContextValue {
  const ctx = useContext(SavedFindsContext);
  if (!ctx) {
    throw new Error("useSavedFinds must be used within a SavedFindsProvider");
  }
  return ctx;
}

/** Exported for `RecommendationCard` to compute the canonical save id. */
export { recommendationId };
