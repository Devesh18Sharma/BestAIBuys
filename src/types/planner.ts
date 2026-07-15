/**
 * Purchase Planner (BES-XX) — types for the buy-now / wait planner surface.
 *
 * The planner takes the items a user is tracking and, using Keepa price
 * history, tells them whether to buy each one now or hold for a known
 * seasonal low (Labor Day, Black Friday, …). Each row carries enough to
 * render the table and the summary banner without an extra round trip.
 */

/** Buy immediately vs. wait for a better price. */
export type PlannerAction = "buy" | "wait";

export interface PlannerItem {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  /** What we're advising the user to do. */
  action: PlannerAction;
  /** One-line rationale shown next to the badge. */
  recommendation: string;
  /**
   * Human label for the best moment to buy — "Now" for buy-actions, or a
   * named event ("Labor Day", "Black Friday") for waits.
   */
  bestTimeLabel: string;
  /** Optional date window under the label, e.g. "Aug 30 – Sep 2". */
  bestTimeWindow?: string;
  /** Dollars saved by following the advice (waiting, or the current deal). */
  savings: number;
  /** Current best price we're tracking, in dollars (drives the budget math). */
  currentPrice: number;
  /** Whether the user has bookmarked this item into their plan. */
  saved?: boolean;
}

export interface PlannerSummary {
  totalBudget: number;
  currentTotal: number;
  totalSavings: number;
  buyNowCount: number;
  waitCount: number;
  /** 0–100 — how on-track the plan is against budget. */
  onTrackPercent: number;
}

/**
 * A planner as listed by `GET /planner` — its identity, per-planner prefs
 * (budget, alerts, following) and how many items the user has added to it.
 */
export interface PlannerMeta {
  id: number;
  name: string;
  totalBudget: number;
  alertsEnabled: boolean;
  following: boolean;
  itemCount: number;
}

/**
 * One (wishlist item → planner) link, from `GET /planner/memberships`. Lets a
 * surface show that an item is already in a planner (and which) without loading
 * each planner's full plan.
 */
export interface PlannerMembership {
  wishlistItemId: number;
  plannerId: number;
  plannerName: string;
}
