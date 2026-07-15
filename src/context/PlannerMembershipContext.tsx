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
import type { PlannerMembership } from "@/types/planner";
import { useAuth } from "@/context/AuthContext";
import { getPlannerMemberships } from "@/services/api/planner";

/** Which planner an item sits in — the identity shown as "In <name>". */
export interface PlannerRef {
  id: number;
  name: string;
}

interface PlannerMembershipContextValue {
  /** The planners a wishlist item currently belongs to (empty when none). */
  plannersForItem: (wishlistItemId?: number) => PlannerRef[];
  /** True iff the item is in at least one planner. */
  isPlanned: (wishlistItemId?: number) => boolean;
  /** Optimistically record that an item was just added to a planner. */
  markAdded: (wishlistItemId: number, planner: PlannerRef) => void;
  /** Optimistically drop an item from a planner (or all planners). */
  markRemoved: (wishlistItemId: number, plannerId?: number) => void;
  /** Re-fetch the membership list from the backend. */
  reload: () => void;
}

const PlannerMembershipContext =
  createContext<PlannerMembershipContextValue | null>(null);

/**
 * Loads the user's (wishlist item → planner) links once on sign-in and shares
 * them so any "Add to planner" control can show that an item is already in a
 * planner — regardless of which surface added it. A deliberate lightweight
 * sibling to SavedFindsContext: load on auth, clear on logout.
 */
export function PlannerMembershipProvider({ children }: { children: ReactNode }) {
  const [links, setLinks] = useState<PlannerMembership[]>([]);
  const { isAuthenticated } = useAuth();

  // Guards a stale response landing after logout / a newer load.
  const loadToken = useRef(0);
  const reload = useCallback(() => {
    const token = ++loadToken.current;
    if (!isAuthenticated) {
      setLinks([]);
      return;
    }
    getPlannerMemberships()
      .then((rows) => {
        if (token === loadToken.current) setLinks(rows);
      })
      .catch(() => {
        if (token === loadToken.current) setLinks([]);
      });
  }, [isAuthenticated]);

  useEffect(() => {
    reload();
  }, [reload]);

  // wishlistItemId -> planners containing it.
  const byItem = useMemo(() => {
    const map = new Map<number, PlannerRef[]>();
    for (const l of links) {
      const list = map.get(l.wishlistItemId) ?? [];
      if (!list.some((p) => p.id === l.plannerId)) {
        list.push({ id: l.plannerId, name: l.plannerName });
      }
      map.set(l.wishlistItemId, list);
    }
    return map;
  }, [links]);

  const plannersForItem = useCallback(
    (wishlistItemId?: number): PlannerRef[] =>
      wishlistItemId == null ? [] : byItem.get(wishlistItemId) ?? [],
    [byItem],
  );

  const isPlanned = useCallback(
    (wishlistItemId?: number): boolean =>
      wishlistItemId != null && (byItem.get(wishlistItemId)?.length ?? 0) > 0,
    [byItem],
  );

  const markAdded = useCallback((wishlistItemId: number, planner: PlannerRef) => {
    setLinks((prev) =>
      prev.some(
        (l) => l.wishlistItemId === wishlistItemId && l.plannerId === planner.id,
      )
        ? prev
        : [
            ...prev,
            {
              wishlistItemId,
              plannerId: planner.id,
              plannerName: planner.name,
            },
          ],
    );
  }, []);

  const markRemoved = useCallback(
    (wishlistItemId: number, plannerId?: number) => {
      setLinks((prev) =>
        prev.filter(
          (l) =>
            l.wishlistItemId !== wishlistItemId ||
            (plannerId != null && l.plannerId !== plannerId),
        ),
      );
    },
    [],
  );

  const value = useMemo<PlannerMembershipContextValue>(
    () => ({ plannersForItem, isPlanned, markAdded, markRemoved, reload }),
    [plannersForItem, isPlanned, markAdded, markRemoved, reload],
  );

  return (
    <PlannerMembershipContext.Provider value={value}>
      {children}
    </PlannerMembershipContext.Provider>
  );
}

export function usePlannerMembership(): PlannerMembershipContextValue {
  const ctx = useContext(PlannerMembershipContext);
  if (!ctx) {
    throw new Error(
      "usePlannerMembership must be used within a PlannerMembershipProvider",
    );
  }
  return ctx;
}
