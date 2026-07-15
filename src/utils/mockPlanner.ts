import type { PlannerItem, PlannerSummary } from "@/types/planner";

/**
 * Demo planner data. The real backend will derive these rows from the
 * user's tracked items + Keepa price history; until that endpoint exists
 * these mocks let the Purchase Planner render end-to-end. Images reuse the
 * static product set already shipped in /public.
 */
export const MOCK_PLANNER_ITEMS: PlannerItem[] = [
  {
    id: "article-sven-sofa",
    name: "Article Sven Sofa",
    category: "Furniture",
    imageUrl: "/chair.png",
    action: "buy",
    recommendation: "Buy now — prices are near historical lows.",
    bestTimeLabel: "Now",
    savings: 40,
    currentPrice: 1099,
  },
  {
    id: "rugs-usa-aria",
    name: "Rugs USA Aria Rug",
    category: "Home",
    imageUrl: "/bag.png",
    action: "wait",
    recommendation: "Prices usually drop before Labor Day.",
    bestTimeLabel: "Labor Day",
    bestTimeWindow: "Aug 30 – Sep 2",
    savings: 76,
    currentPrice: 312,
  },
  {
    id: "walker-edison-tv-stand",
    name: "Walker Edison TV Stand",
    category: "Furniture",
    imageUrl: "/chair.png",
    action: "wait",
    recommendation: "Biggest discounts of the year.",
    bestTimeLabel: "Black Friday",
    bestTimeWindow: "Nov 29",
    savings: 60,
    currentPrice: 248,
  },
  {
    id: "round-coffee-table",
    name: "Round Coffee Table",
    category: "Furniture",
    imageUrl: "/coffee.png",
    action: "wait",
    recommendation: "Prices typically drop in early September.",
    bestTimeLabel: "Labor Day",
    bestTimeWindow: "Aug 30 – Sep 2",
    savings: 64,
    currentPrice: 189,
  },
  {
    id: "brightech-sky-lamp",
    name: "Brightech Sky LED Lamp",
    category: "Lighting",
    // No lamp asset ships in /public — chair is the closest home-goods stand-in.
    // Real items get a real imageUrl from the backend; this is demo-only.
    imageUrl: "/chair.png",
    action: "buy",
    recommendation: "Great price today.",
    bestTimeLabel: "Now",
    savings: 12,
    currentPrice: 59,
  },
  {
    id: "sony-wh-1000xm5",
    name: "Sony WH-1000XM5",
    category: "Electronics",
    // No headphones asset ships in /public — mixer is a neutral gadget stand-in.
    // Real items get a real imageUrl from the backend; this is demo-only.
    imageUrl: "/mixer.png",
    action: "wait",
    recommendation: "Often discounted this time of year.",
    bestTimeLabel: "Black Friday",
    bestTimeWindow: "Nov 29",
    savings: 90,
    currentPrice: 348,
  },
  {
    id: "samsonite-freeform-carry-on",
    name: "Samsonite Freeform Carry-On",
    category: "Travel",
    imageUrl: "/luggage.png",
    action: "buy",
    recommendation: "Good price today.",
    bestTimeLabel: "Now",
    savings: 18,
    currentPrice: 198,
  },
];

/** Derive the banner summary from a set of planner items. */
export function buildPlannerSummary(
  items: PlannerItem[],
  totalBudget = 3000,
): PlannerSummary {
  const currentTotal = items.reduce((sum, it) => sum + it.currentPrice, 0);
  const totalSavings = items.reduce((sum, it) => sum + it.savings, 0);
  const buyNowCount = items.filter((it) => it.action === "buy").length;
  const waitCount = items.filter((it) => it.action === "wait").length;
  // How close the plan keeps you to budget — capped at 100.
  const onTrackPercent =
    totalBudget > 0
      ? Math.min(100, Math.round((currentTotal / totalBudget) * 100))
      : 0;

  return {
    totalBudget,
    currentTotal,
    totalSavings,
    buyNowCount,
    waitCount,
    onTrackPercent,
  };
}
