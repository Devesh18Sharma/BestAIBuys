// Purchase Planner API client. Talks to the NestJS backend's /planner routes.
// All routes are auth-protected — the JWT is attached via authHeaders().
//
// A user owns named planners with explicit membership: an item is in a planner
// only if it's been added. The backend derives each planner's plan (buy-now vs.
// wait) from its items + Keepa price history and owns the summary figures, so
// the client just reads the assembled plan rather than computing it.

import type {
  PlannerItem,
  PlannerMembership,
  PlannerMeta,
  PlannerSummary,
} from "@/types/planner";
import { authHeaders } from "./auth";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "";

/** The assembled plan for one planner: meta + rows + summary banner figures. */
export interface PlannerPlanResponse {
  planner: PlannerMeta;
  items: PlannerItem[];
  summary: PlannerSummary;
}

async function plannerFetch<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}/planner${path}`, {
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

  // DELETE / no-content actions may return nothing we care about — guard parse.
  return response.json().catch(() => null as T);
}

/** List the user's planners (id, name, prefs, item count). */
export function listPlanners(): Promise<PlannerMeta[]> {
  return plannerFetch<PlannerMeta[]>("", { method: "GET" });
}

/** Every (wishlist item → planner) link the user has, across all planners. */
export function getPlannerMemberships(): Promise<PlannerMembership[]> {
  return plannerFetch<PlannerMembership[]>("/memberships", { method: "GET" });
}

/** Create a new (empty) planner. */
export function createPlanner(
  name: string,
  totalBudget?: number,
): Promise<PlannerMeta> {
  return plannerFetch<PlannerMeta>("", {
    method: "POST",
    body: JSON.stringify(totalBudget != null ? { name, totalBudget } : { name }),
  });
}

/** Fetch one planner's plan: the rows + the summary banner figures. */
export function getPlannerPlan(plannerId: number): Promise<PlannerPlanResponse> {
  return plannerFetch<PlannerPlanResponse>(`/${plannerId}`, { method: "GET" });
}

/** Rename a planner / change its budget, alerts or following flag. */
export function updatePlanner(
  plannerId: number,
  patch: Partial<
    Pick<PlannerMeta, "name" | "totalBudget" | "alertsEnabled" | "following">
  >,
): Promise<PlannerMeta> {
  return plannerFetch<PlannerMeta>(`/${plannerId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

/** Delete a planner and its membership links. */
export function deletePlanner(plannerId: number): Promise<unknown> {
  return plannerFetch(`/${plannerId}`, { method: "DELETE" });
}

/** Add a wishlist item to a planner. Returns the planner's updated meta. */
export function addPlannerItem(
  plannerId: number,
  wishlistItemId: number,
): Promise<PlannerMeta> {
  return plannerFetch<PlannerMeta>(`/${plannerId}/items`, {
    method: "POST",
    body: JSON.stringify({ wishlistItemId }),
  });
}

/** Remove a wishlist item from a planner. Returns the planner's updated meta. */
export function removePlannerItem(
  plannerId: number,
  wishlistItemId: number,
): Promise<PlannerMeta> {
  return plannerFetch<PlannerMeta>(`/${plannerId}/items/${wishlistItemId}`, {
    method: "DELETE",
  });
}
