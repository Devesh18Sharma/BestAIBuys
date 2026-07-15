# SwipeSwipe Shopping Assistant — Project Context

> Single source of truth for anyone (human or AI) picking up this project.
> **Last updated: 2026-06-26 — mid-session handoff during BES-50 / BES-51 work.**

---

## ⚠️ READ FIRST — Live Session State (2026-06-26)

A long iterative session has been running on the **results card** area. **Context window is running out — this section is the handoff. Read it before doing anything else.**

### Where the branches stand

```
main  (latest: 75ce55b — BES-46 Saved Finds price-chart redesign merged)
 │
 ├── feat/BES-39-two-card-results          (PR #30, OPEN, base: main)
 │     - 3 commits replacing main's 3-card grid with a 2-card layout
 │       (Top Rated [blue badge] + Best Match for You [green badge])
 │     - In-card BestMatchLoadingCard with progress bar + 5-stage checklist
 │       + warm trust card with shopper photo (/public/bm-shoppers.jpg)
 │     - Variant color swap per Alex (Best Match dominant green, Top Rated blue)
 │     - Heading: "Your Best Customized Picks" (Fraunces serif)
 │     - JUST REBASED onto latest origin/main. Force-pushed.
 │     - Igor has NOT merged. Sergey/Igor must agree this 2-card replaces
 │       main's BES-35 3-card before merge.
 │
 ├── chore/BES-49-badge-sizing             (PR #33, OPEN, base: PR #30)
 │     - 1 commit: equalize Top Rated / Best Match badge sizing.
 │     - Loaded Badge now matches BestMatchLoadingCard's badge (weight 700,
 │       gap 7px, padding 7×13). Both variants identical.
 │
 └── feat/BES-50-card-price-intelligence   (CURRENT BRANCH, NOT YET PUSHED,
                                             base: chore/BES-49-badge-sizing)
       - Uncommitted local edits implementing price intelligence on the
         result cards (savings vs retail + 30-day-average signal).
       - INCLUDES a dev-only mock (gated to import.meta.env.DEV) so the
         signals render locally before BES-52/BES-53 backend lands.
       - Next step: commit + push as a PR stacked on PR #33.
```

### What's in the working tree right now (uncommitted)

```
M  src/types/product.ts                  — added Retailer.listPrice?: string
M  src/services/api/wishlist.ts          — added PriceSummary / lookup helpers
M  src/components/results/ResultsCard.tsx — wired in BES-50 UI subcomponents
?? src/components/results/PriceContext.tsx — NEW: SavingsPill, GoodBuyFooter,
                                              AboveAverageBlock + derive helper
?? src/hooks/useResultsPriceSummary.ts    — NEW: stale-while-revalidate hook
M  .env.local                             — local-only, never commit
```

### What still needs doing in this session

| | Task | State |
|---|---|---|
| 1 | Commit BES-50 + BES-51 on this branch → ONE PR to `main` | Pending — code done, build green |
| 2 | BES-51 "Add to Plan" button (cards + saved rows) | ✅ DONE this session (see below) |
| 3 | Backend prompts (BES-52 / BES-53 / BES-54) — see § Backend Prompts | Drafted in this file |

> **Strategy change (2026-06-26 pm):** the stacked PRs (#30 → #33) never merged, and
> this branch already sits directly on the latest `main` (`merge-base == origin/main ==
> 75ce55b`). So instead of stacking, this single branch will become **one PR → `main`**
> carrying BES-39 + BES-49 + BES-50 + BES-51. No rebase was needed.

### Open PRs at time of handoff

| # | Title | Base | Head | Status |
|---|---|---|---|---|
| 30 | Closes BES-39: two-card results UI | `main` | `feat/BES-39-two-card-results` | Open |
| 33 | Closes BES-49: equalize badge sizing | `feat/BES-39-two-card-results` | `chore/BES-49-badge-sizing` | Open |
| 26 | Quick Picks: bypass question flow | `main` | `feat/quick-search-pick-battle` | Stale — recommend closing |
| 24 | BES-24 + BES-25: skip-all loop + new-search routing | `main` | `fix/bes-24-25` | Open — Igor to decide |

### Recent merged history (last 30 days)

- **BES-46** (Sergey): Saved Finds price-history chart redesign — added `getPriceSummaries`, `getPriceHistory`, `PriceSummary`, `PriceVerdict.tsx` (`src/components/shared/`)
- **BES-18 hotfix** (Sergey): price-history chart fix
- **BES-35** (someone): rewrote results UI back to a **3-card grid** with "Your Best Customized Picks" headline. This is the design we're now **overriding** with BES-39 (2-card).
- **BES-19**: added image-search flow (ImageLoadingMessage, ImageResultsMessage)
- **BES-34** (devesh, PR #27): removed Quick Search nav
- **BES-36** (devesh, PR #28): removed Smart Insight / Pro Tip text blocks
- **BES-24 + BES-25** (devesh, PR #24): skip-loop fix + in-flow new search
- Earlier devesh PRs in this session: **BES-11, BES-13, BES-14, BES-15, BES-17**

---

## What Is This?

An AI-powered shopping assistant that helps everyday American consumers shop smarter.

1. **"Help me choose"** — User describes a category (e.g., "running shoes"), answers 1–3 dynamic clarifying questions + budget, gets recommendations with real prices.
2. **"Find best price"** — User enters a specific product name, AI validates, searches Amazon / Walmart / Google Shopping in parallel.
3. **Image search** — Reverse-image search returns the same price-comparison shape.

**Core insight**: USA is a consumer market — people WILL buy stuff. Instead of stopping them, we help them get the same quality product at a better price.

---

## Architecture Overview

Frontend only. All LLM calls + price verification live in the backend (`swipe-extension-backend`, `swipe-assistant` module). Frontend = thin UI + state machine that POSTs to `/api/assistant/*` and `/wishlist-item/*`.

```
[swipe-shopping-assistant]  ──►  [swipe-extension-backend]
     React + MUI UI                 NestJS controllers
     State machine                  LLM service (Gemini)
     API client                     Price service (Oxylabs + SearchAPI)
                                    Wishlist + Keepa price-history
```

### Backend endpoints consumed

| Endpoint | Purpose |
|----------|---------|
| `POST /api/assistant/next-question` | Flow 1 — generate clarifying questions |
| `POST /api/assistant/recommendations` | Flow 1 — recommendations with verified prices |
| `POST /api/assistant/validate-product` | Flow 2 — check if query names a specific product |
| `POST /api/assistant/price-search` | Flow 2 — multi-retailer price search |
| `POST /api/assistant/quick-search` | Head-start preview during extra-input step |
| `POST /wishlist-item` | Save an item to Wishlist |
| `DELETE /wishlist-item/:id` | Remove saved item |
| `GET /wishlist-item/:limit` | List Wishlist items |
| `POST /wishlist-item/price-history/summary` | Sergey (BES-46) — Keepa batch verdicts by wishlist-item IDs |
| `GET /wishlist-item/:id/price-history` | Sergey (BES-46) — full Keepa daily curve for one item |
| **`GET /price-history?asin=<ASIN>&days=30`** / **`?url=<amazon-url>`** | **Sergey's BES-56 (replaces the planned BES-52 POST stub).** Root-level price-history lookup for the BES-50 card. FE prefers `asin` (extracted client-side via `extractAsin`), falls back to `url`. NOT yet deployed to `api.bestaibuys.com` (404 as of 2026-06-29) — FE soft-fails + DEV mock fills until it lands. Response normalised in `wishlist.ts` (`normalizePriceSummary`) to accept either a `PriceSummary` or a raw `{ history: [{date,price}] }` curve. |
| **Plan endpoints (BES-54)** | **NEW — not yet shipped.** Purchase Planner CRUD; mirrors Wishlist. |

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | React 19 + Vite 7 |
| Language | TypeScript (strict mode) |
| UI | MUI 7 + Framer Motion |
| State | React Context + useReducer (state machine) |
| Styling | MUI sx prop + theme tokens (NO Tailwind) |
| Fonts | Fraunces (serif headings) + Inter (sans body) |
| Backend client | Native fetch, JWT in `Authorization: Bearer` |

Dev server port is **5400** (strictPort in `vite.config.ts`) — NOT 5173.

---

## State Machine Flow

```
Flow 1:
home → generating → questionnaire → extra_input → searching → results
                          ↑ skipQuestions (BES-24: budget question unskippable)

Flow 2:
home → validating_product → price_searching → price_results
              ↓
       product_not_specific

Image:
home → image_loading → image_results

All flows → error (with retry)
```

### Important state notes

- **BES-24**: Budget question is the LAST question (`DynamicQuestion.isBudget = true`) and is **unskippable**. The backend's `done: true` is only emitted after the user provides at least one real answer. Allowing skip-all caused an infinite loop pre-BES-24.
- **BES-25**: `handleNewSearch` in `ChatShell.tsx` does NOT call `reset()` — that would set `screen: "home"` and bounce the user to `/` via the route guard. Instead it does `setQuery` + `submitSearch`; `START_GENERATING` clears prior state.
- **BES-39**: For `screen === "searching"` AND `screen === "results"`, `ChatShell` renders `<ResultsMessage />` DIRECTLY off `state.screen` (NOT through the chat-message pipeline). The 2-card layout owns its own placeholder ↔ real swap.

---

## Project Structure (post-BES-50 — what's on the current working tree)

```
src/
├── config/
│   ├── constants.ts
│   └── theme.ts                     # tokens — see § Theme tokens below
│
├── types/
│   ├── chat.ts
│   ├── product.ts                   # Retailer (+ listPrice?: BES-50),
│   │                                  Recommendation, ShoppingResults,
│   │                                  PriceSearchResults, ImageSearchResults
│   └── questionnaire.ts             # DynamicQuestion (+ isBudget?: BES-24)
│
├── services/api/
│   ├── auth.ts                      # authHeaders() → { Authorization: "Bearer …" }
│   ├── client.ts                    # /api/assistant/* endpoints
│   └── wishlist.ts                  # /wishlist-item/* endpoints
│                                    # + BES-50 additions: PriceSummary type,
│                                    #   getPriceSummaries(ids[], days),
│                                    #   getPriceHistory(id, days),
│                                    #   lookupPriceSummaryByUrl(url, days)
│                                    #   ← NEW endpoint NOT YET ON BACKEND
│
├── context/
│   ├── AuthContext.tsx              # user/login state
│   ├── SavedFindsContext.tsx        # useSavedFinds().requestSave handles
│   │                                  guest case (opens auth modal, queues save)
│   └── ShoppingFlowContext.tsx      # The state-machine reducer
│
├── hooks/
│   ├── useChatMessages.ts           # Builds chat-message array from FlowState
│   ├── useResultsPriceSummary.ts    # BES-50 — calls lookupPriceSummaryByUrl,
│   │                                  soft-fails to null
│   ├── useShoppingFlow.ts
│   └── …
│
├── components/
│   ├── chat/
│   │   ├── ChatShell.tsx            # Direct render: 2-card panel for
│   │   │                              searching/results screens (BES-39)
│   │   └── messages/
│   │       ├── BestMatchLoadingCard.tsx       # BES-39, Figma port
│   │       ├── ResultsMessage.tsx             # BES-39, 2-card grid
│   │       ├── PreviewResultsMessage.tsx
│   │       ├── BotQuestionMessage.tsx
│   │       └── … (PriceResultsMessage, ImageResultsMessage, etc.)
│   ├── results/
│   │   ├── RecommendationCard.tsx   # Legacy 3-card grid card (still
│   │   │                              referenced by Saved Finds)
│   │   ├── ResultsCard.tsx          # BES-39 — single reusable card with
│   │   │                              top-rated / best-match variants
│   │   │                              + BES-50 SavingsPill / GoodBuyFooter
│   │   │                              / AboveAverageBlock composition
│   │   └── PriceContext.tsx         # BES-50 NEW — price intelligence
│   │                                  subcomponents + derivePriceIntelligence
│   │                                  helper + DEV-only mock (gated to
│   │                                  import.meta.env.DEV)
│   └── shared/
│       └── PriceVerdict.tsx         # Sergey's wishlist-side chart (BES-46)
│
└── pages/
    ├── HomePage.tsx
    ├── SavedFindsPage.tsx           # Uses PriceVerdict + getPriceSummaries
    ├── LoginPage.tsx
    └── …
```

---

## Theme tokens (read these first; don't invent colors)

`src/config/theme.ts` exports `tokens`:

```
bg          #F1EEDA   cream page background
bgElev      #FFFFFF   white card surface
ink         #262625   graphite primary text
ink2        #5D5D5D   mid grey
ink3        #7F8080   light grey
rule        #CCCBCA   borders
green       #7BC362   light brand accent
greenDeep   #5CBA49   primary brand accent (CTAs, badges)
greenSoft   #D9F876   lime backdrop
blueSoft    #DCE7F2   Top Rated badge background (BES-39)
blueDeep    #244A75   Top Rated badge text + Buy button (BES-39)
error       #F0694D
fontSerif   Fraunces (display)
fontSans    Inter (UI)
```

**BES-50 introduces additional hex constants** for the green/red price signals (e.g. `#E8F5E9` deal pill bg, `#FCEAEA` coral above-avg bg). These are intentional — they encode the green=good / red=warning semantics directly. Do NOT replace with `tokens.greenDeep` etc.

---

## BES-39 → BES-51 Work Notes (this session)

### BES-39 — Two-card results layout (PR #30)

- Replaces main's 3-card RecommendationCard grid with a single reusable `ResultsCard` rendered twice:
  - **Top Rated** (left) — blue badge, blue Buy button. Data source: `state.previewProducts[0]` from `/quick-search`. Fast.
  - **Best Match for You** (right) — green badge + 2px green outer ring (dominant). Data source: `state.results.recommendations.find(r => r.tier === "value")` (falls back to first). Slow.
- While Best Match is loading: `BestMatchLoadingCard` renders a contained progress UI (header progress bar + 5-stage checklist + trust card with shopper photo `/public/bm-shoppers.jpg`).
- Heading: **"Your Best Customized Picks"** in Fraunces serif (replaces the older "Your Best Picks" + interim subtitle).
- Figma port colors in `BestMatchLoadingCard.tsx` are explicit constants (not tokens) — they match Alex's design 1:1.

### BES-49 — Equalize badge sizing (PR #33)

- `Badge` component in `ResultsCard.tsx` aligned to BestMatchLoadingCard's badge metrics: **weight 700, gap 7px, padding 7×13**. Both variants render identically.

### BES-50 — Price intelligence (CURRENT WORK)

**Two INDEPENDENT signals** per spec. Each renders only when its data source is present:

1. **Savings vs retail** — `Retailer.listPrice` from Oxylabs (BES-53).
   - When `currentPrice < listPrice` → top-left of image area shows green pill: "You Save $X" + "Y% OFF".
   - Suppressed when %off < 1 (rounding noise).
2. **30-day average** — `PriceSummary.median` from Keepa (BES-52).
   - `currentPrice < median * 0.99` → green "Good Buy / Below 30-day average" strip above Buy button.
   - `currentPrice > median * 1.01` → coral "Price Above 30-Day Average" panel between image and body + "Need it later? Add to Wishlist" nudge.
   - Within ±1% → render nothing.

**Architecture**:

- `src/components/results/PriceContext.tsx` (NEW) holds:
  - `PriceIntelligence` interface
  - `derivePriceIntelligence(retailer, summary)` — typed domain object
  - `SavingsPill`, `GoodBuyFooter`, `AboveAverageBlock` — subcomponents that render nothing when their data is absent
  - **DEV-ONLY mock** `devMockFor(seedKey, currentPrice)` — fabricates deterministic listPrice + avg30Day so the UI is visible locally before BES-52/BES-53 ship. Gated to `import.meta.env.DEV`; Vite tree-shakes it out in production.

- `src/hooks/useResultsPriceSummary.ts` (NEW) — thin React wrapper around `lookupPriceSummaryByUrl`. Cancels in-flight on unmount/URL change. Soft-fails to null.

- `src/services/api/wishlist.ts` extends with:
  - `PriceSummary`, `getPriceSummaries`, `getPriceHistory` (verbatim from origin/main — keep contract identical)
  - `lookupPriceSummaryByUrl(url, days)` — NEW endpoint that **does not exist on backend yet**. BES-52 must ship for production. Until then, the dev mock fills in.

- `src/types/product.ts` adds `Retailer.listPrice?: string`.

- `src/components/results/ResultsCard.tsx` composes the three subcomponents:
  - `<SavingsPill intel={priceIntel} />` inside the image-area Box (absolute positioned top-left)
  - `<AboveAverageBlock intel={priceIntel} recommendation={recommendation} />` between image and body
  - `<GoodBuyFooter intel={priceIntel} />` as the first `<li>` in the retailer column (lands above Buy button)

**Graceful absence is the production behavior**, not a placeholder. When BES-52/BES-53 ship, signals light up automatically.

### BES-51 — Add to Plan button (✅ IMPLEMENTED this session)

- "Add to Plan" affordance next to Save on result cards AND on Saved Finds rows.
- Mirrors how Save is wired (auth gating, optimistic update, same dedupe key
  `recommendationId()` — `${tier}::${name}` lowercased + hyphenated).
- Files added:
  - `src/services/api/plan.ts` — typed planner client. Signatures match the
    BES-54 backend contract; **bodies are a TEMPORARY localStorage shim**
    (clearly marked) because BES-54 isn't shipped. Swap to the real backend is
    body-only — replace each localStorage block with the documented `planFetch`
    call and delete the STORAGE_KEY/readStore/writeStore helpers. Nothing else
    changes.
  - `src/context/PurchasePlanContext.tsx` — `PurchasePlanProvider` +
    `usePurchasePlan`. A 1:1 mirror of `SavedFindsContext` (optimistic add →
    persist → reconcile, AuthModal gating, pending-add-after-login).
  - `src/components/results/AddToPlanButton.tsx` — reusable; `pill` variant
    (cards, matches Save pill metrics) + `icon` variant (saved rows, 36px circle
    matching the remove control). Planned state uses the **blue** accent
    (`tokens.blueDeep`) to read as distinct from Save's green.
- Wiring: `App.tsx` wraps the tree in `PurchasePlanProvider` (inside
  `SavedFindsProvider`); `ResultsCard.tsx` renders the pill next to Save (so
  BOTH cards inherit it); `SavedFindsPage.tsx` renders the icon variant per row.
- **Decision (why localStorage, not pure soft-fail):** the team needs a
  demo-able, persistent "Add to Plan" now. Soft-fail-to-nothing would toggle
  then reset on reload and look broken. The shim is isolated to one file and
  swap-ready, so the colleague owning BES-54/the plan page deletes ~1 block when
  the backend lands. tsc + production build are green.

---

## Sergey's Wishlist + Price-History API (Reference)

This is the existing contract; BES-50 / BES-51 reuse the same shapes.

```typescript
// src/services/api/wishlist.ts

interface WishlistItem {
  id: number;
  store: string;
  name: string | null;
  url: string | null;
  imageUrl: string | null;
  price: number;
  note: string | null;
  data: SavedItemData | null;
  createdAt?: string;
}

interface SavedItemData {
  recommendation: Recommendation;
  query: string;
}

// CRUD
createWishlistItem(payload) → WishlistItem
deleteWishlistItem(id) → unknown
getWishlistItems(limit=100) → WishlistItem[]
reorderWishlistItems(orderedIds) → unknown

// Keepa price-history
interface PriceSummary {
  id: number;
  supported: boolean;
  currency: string;
  hasHistory: boolean;            // ≥ 2 real points
  state: "lowest" | "below_average" | null;
  label: string | null;
  current: number | null;
  min: number | null;
  median: number | null;          // ← BES-50 reads this
  days: number;
  sparkline: number[];
}

getPriceSummaries(ids[], days=30) → PriceSummary[]
getPriceHistory(id, days=30) → PriceHistory { history: { date, price }[], ... }
lookupPriceSummaryByUrl(url, days=30) → PriceSummary  // ← NEW, NOT ON BACKEND
```

---

## Backend Prompts — paste into the backend repo's Claude Code

The three backend tickets BES-50 / BES-51 depend on. Run as separate PRs in the backend repo.

### BES-53 — Oxylabs listPrice capture (Devesh's ticket)

```markdown
# ROLE
Elite full-stack engineer + senior backend engineer on the SwipeSwipe NestJS backend.

# TASK — BES-53: capture retail/list price from Oxylabs
Extend Oxylabs parsing to capture the retail/list price (struck-through MSRP, e.g.
Amazon "List Price $149.95") alongside the current price, so the frontend can compute
savings/discount (BES-50).

## ANALYSIS PROTOCOL (do this BEFORE writing code)
Read 5 times:
1. Find the Oxylabs parser entry point and the structure where `price` is captured.
2. Find every consumer (DTO / response shape / recommendation builder) of that price.
3. Identify where the response is serialized to the frontend's `Retailer` shape
   (frontend type: `{ name, price, url, note?, listPrice? }`).
4. Find the Amazon listing fields Oxylabs returns that carry MSRP. Common shapes:
   `price_strikethrough`, `list_price`, `original_price`, `was_price`. Verify by
   inspecting actual Oxylabs payloads (logs / fixtures / docs) before implementing.
5. Validate: if no list price exists in the source, the field must be OMITTED from
   the response — NOT set to 0, NOT set to current price, NOT fabricated.

## REQUIRED FRONTEND CONTRACT
```ts
interface Retailer {
  name: string;
  price: string;        // current/sell price, formatted "$149.99"
  url: string;
  note?: string;
  listPrice?: string;   // NEW — MSRP, same format as `price`. Omit when absent.
}
```
- Format MUST match `price` (currency-prefixed string, e.g. `"$149.95"`).
- Field MUST be omitted from the JSON payload entirely when not captured.
- When present, listPrice MUST be ≥ price (sanity check — drop if violated).

## DELIVERABLES
Feature deliverable format:
PLAN & ARCHITECTURE → GAME PLAN → IMPLEMENTATION (diff) → VALIDATION.

## ACCEPTANCE
- listPrice captured when present in the Oxylabs response.
- Field OMITTED (NOT null, NOT "$0.00") when absent.
- No regression to current-price capture or downstream verification.
- Sanity: drop captured listPrice when it's < price.
- Unit/fixture test added for both "present" and "absent" cases.

Branch: feat/BES-53-oxylabs-list-price
Commit:  feat: capture retail/list price from oxylabs
PR:      "Closes BES-53"
```

### BES-52 — Keepa URL-based price-history lookup (Sergey's ticket)

```markdown
# TASK — BES-52: URL-based price-history lookup endpoint
Add a sibling to POST /wishlist-item/price-history/summary (id-based) that takes a
retailer URL instead. The frontend results card (BES-50) needs the verdict BEFORE
the user has saved the item — no wishlist id to query against.

## ANALYSIS PROTOCOL (5 passes)
1. Find /wishlist-item/price-history/summary controller + service + Keepa client.
   Map id → ASIN → Keepa → PriceSummary.
2. Identify the ASIN-extraction logic. REUSE the existing helper, do NOT duplicate.
3. The new endpoint returns the EXACT same PriceSummary shape — frontend already
   consumes it.
4. Auth: JWT-protected, same rate-limit as /summary.
5. Validate: invalid URL → 400. ASIN extraction fails → 200 with
   { supported: false, hasHistory: false, ... } (mirror existing pattern, NOT 404).

## REQUIRED FRONTEND CONTRACT
```
POST /wishlist-item/price-history/lookup
body: { url: string; days?: number }   // default days = 30
response: PriceSummary                 // same shape as /summary

interface PriceSummary {
  id: number;            // for /lookup: synthesize 0; frontend ignores
  supported: boolean;
  currency: string;
  hasHistory: boolean;
  state: "lowest" | "below_average" | null;
  label: string | null;
  current: number | null;
  min: number | null;
  median: number | null; // ← BES-50 reads this
  days: number;
  sparkline: number[];
}
```

## ACCEPTANCE
- POST /wishlist-item/price-history/lookup works with a valid Amazon URL.
- Returns EXACT same PriceSummary shape as /summary.
- Invalid URL → 400. Unsupported retailer → 200 supported:false.
- JWT-protected, same rate-limit as /summary.
- No changes to /summary, /price-history/:id, or any wishlist route.

Branch: feat/BES-52-keepa-url-lookup
Commit:  feat: add url-based price-history lookup endpoint
PR:      "Closes BES-52"
```

### BES-54 — Purchase Planner backend (Sergey's ticket)

```markdown
# TASK — BES-54: Purchase Planner backend (store + CRUD endpoints)
Mirror the Wishlist module's structure exactly. Same auth + JSONB rich-data column.

## ANALYSIS PROTOCOL (5 passes)
1. Read the entire wishlist module (entity, DTO, controller, service, repository).
   THIS is the template.
2. Identify auth guard, rate limiter, JWT user-id extraction.
3. Dedup key: deterministic id from `data.recommendation` — `${tier}::${name}`
   lowercased+hyphenated, stored in a UNIQUE constraint per user_id.
4. Match the SavedFindsContext-style hook shape on the frontend side.
5. Validate: duplicate POST returns 200 with the existing row (idempotent), NOT 409.

## REQUIRED FRONTEND CONTRACT
```ts
interface PlanItem {
  id: number;
  userId: number;            // server-set from JWT
  dedupKey: string;          // "${tier}::${name}" lowercased+hyphenated
  store: string;
  name: string | null;
  url: string | null;
  imageUrl: string | null;
  price: number;
  note: string | null;
  data: { recommendation: Recommendation; query: string } | null;
  createdAt: string;
}

// Routes — all JWT-protected
POST   /plan-item       → PlanItem
DELETE /plan-item/:id   → 204
GET    /plan-item?limit=100 → PlanItem[]
PATCH  /plan-item/reorder { orderedIds: number[] } → 204

interface CreatePlanItemPayload {
  store: string;
  name?: string;
  url?: string;       // @IsUrl
  imageUrl?: string;  // @IsUrl
  price: number;
  note?: string;
  data: { recommendation: Recommendation; query: string };
}
```
- POST is idempotent — duplicate returns existing row, NO 409.
- @IsUrl validators identical to wishlist (omit url/imageUrl when not http).
- `dedupKey` computed SERVER-SIDE from `data.recommendation.tier + "::" + name`
  (lowercase, whitespace→"-"). Do NOT trust client.

## ACCEPTANCE
- POST /plan-item creates a row; duplicate POST returns existing row (no 409).
- DELETE /plan-item/:id removes only caller's row (cross-user 403).
- GET /plan-item returns caller's plan, newest first.
- Reorder persists.
- Auth + rate-limit identical to wishlist routes.
- Migration creates table + UNIQUE (user_id, dedup_key) index; rollback works.

Branch: feat/BES-54-purchase-planner-backend
Commit:  feat: add purchase planner entity and crud endpoints
PR:      "Closes BES-54"
```

---

## Commands

```bash
npm run dev      # Vite dev server — strictPort 5400 (NOT 5173)
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

## Environment Variables

```bash
# .env.local (gitignored)
VITE_API_BASE_URL=                 # Empty in dev (Vite proxy); set in prod
```

---

## Dependencies

```json
{
  "@emotion/react": "^11.14.0",
  "@emotion/styled": "^11.14.1",
  "@mui/icons-material": "^7.3.9",
  "@mui/material": "^7.3.9",
  "framer-motion": "^12.35.1",
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-router-dom": "^7.13.1"
}
```

---

## Operating principles for the next session (or human)

1. **Stacked PRs are the merge strategy.** PR #30 → PR #33 → BES-50 PR → BES-51 PR. Igor merges from the bottom up. If he wants to reject the 2-card layout in PR #30, the whole stack falls and we revisit.
2. **Soft-degrade is production behavior, NOT a placeholder.** Signals/buttons that depend on unshipped backend MUST render nothing in production until backend ships. NEVER stub fake persistence.
3. **Dev-only mocks are gated to `import.meta.env.DEV` only.** Vite tree-shakes them out; production has zero of that code.
4. **Match existing patterns.** Wishlist module = template for Plan module. `useSavedFinds` = template for `usePurchasePlan`. `PriceVerdict` = how the saved-finds page consumes Keepa data; results card mirrors the SHAPE not the call.
5. **Read theme tokens. Don't invent colors.** Exceptions: BES-50 green-good / red-warning hex constants are intentional semantic colors.
6. **`.env.local` NEVER goes into a commit.** Always `git checkout -- .env.local` before staging if it gets dirty.
7. **The Figma handoff bundle** (`.figma-handoff/`, `Figma assets for card implementation-handoff.zip`) is .gitignored. Source of truth, not shipped code.
8. **`Good_Find_Landing_Page__5_/`** is a local-only reference folder. Untracked. Leave alone.

---

## Parent Project Context

- `swipe-web-application/` — Main web app
- `swipe-extension/` — Chrome extension
- `swipe-extension-backend/` — Hosts `swipe-assistant` + Wishlist + Keepa modules
- `swipe-mobile-app/` / `shopping-assistant-mobile/` — Expo React Native iOS
- `swipe-chatbot/`, `swipe-debt-calculator/`, `retirement_Calculator/`

**Company**: SwipeSwipe — "We turn overspending into wealth"
**Website**: https://swipeswipe.co

---

## Reference Documents

- `SWIPESWIPE_CONTEXT.md` — Company/brand context
- `CONTEXT.md` — THIS FILE (living project context, updated after each significant change)
- `.figma-handoff/figma-assets-for-card-implementation/project/BestMatchCard.dc.html` — Alex's Figma spec for the BES-39 loading card
