import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography, TextField, MenuItem, Select } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { tokens } from "@/config/theme";
import { useSavedFinds, type SavedFind } from "@/context/SavedFindsContext";
import { pickProductImage } from "@/utils/mockProducts";
import { buildRetailerSearchUrl } from "@/utils/formatPrice";
import { getPriceSummaries, type PriceSummary } from "@/services/api/wishlist";
import { PriceVerdict } from "@/components/shared/PriceVerdict";
import { AddToPlannerButton } from "@/components/planner/AddToPlannerButton";

/**
 * /saved — Saved Finds page (BES-5). Mirrors the Good Find Saved
 * reference: searchable, sortable list with drag-to-reorder when
 * "Manual order" is the active sort. Items live in localStorage via
 * SavedFindsContext.
 */
type SortKey =
  | "manual"
  | "recent"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "name";

const SORT_LABELS: Record<SortKey, string> = {
  manual: "Manual order",
  recent: "Recently saved",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  rating: "Highest rated",
  name: "Name (A–Z)",
};

function parsePrice(price: string | undefined): number {
  if (!price) return Number.POSITIVE_INFINITY;
  const m = price.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : Number.POSITIVE_INFINITY;
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

// Shared row metrics so the price-history footer can align its columns exactly
// under the card's image (verdict) and text (chart) zones.
const ROW = {
  img: { xs: 110, sm: 160 },
  gap: { xs: 1.5, sm: 2 },
  pad: { xs: 1.5, sm: 2 },
  handle: 24,
};

export function SavedFindsPage() {
  const { items, remove, reorder, clear } = useSavedFinds();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("manual");
  const [summaries, setSummaries] = useState<Map<number, PriceSummary>>(new Map());
  // Whether the one-shot summary batch is still in flight. Lets each row tell
  // "still resolving" apart from "genuinely no history" so the empty state
  // never flashes during load.
  const [summariesLoading, setSummariesLoading] = useState(true);

  // Price verdicts: fetch every saved item's verdict in ONE batch call after the
  // list loads. We no longer pre-filter to Amazon-only items — the backend now
  // resolves non-Amazon products to their Amazon record (via GTIN/MPN) and
  // returns `supported: false` for the ones it genuinely can't, so gating here
  // would just hide history the backend can actually provide. The key keeps
  // reorders/searches from triggering a refetch.
  const eligibleIds = useMemo(
    () =>
      items
        .filter((it) => it.remoteId != null)
        .map((it) => it.remoteId as number),
    [items],
  );
  const eligibleKey = useMemo(
    () => [...eligibleIds].sort((a, b) => a - b).join(","),
    [eligibleIds],
  );

  useEffect(() => {
    if (!eligibleKey) {
      setSummaries(new Map());
      setSummariesLoading(false);
      return;
    }
    let cancelled = false;
    const ids = eligibleKey.split(",").map(Number);
    setSummariesLoading(true);
    getPriceSummaries(ids)
      .then((rows) => {
        if (!cancelled) setSummaries(new Map(rows.map((r) => [r.id, r])));
      })
      .catch(() => {
        if (!cancelled) setSummaries(new Map());
      })
      .finally(() => {
        if (!cancelled) setSummariesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eligibleKey]);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const needle = q.toLowerCase();
    return items.filter((it) => {
      const r = it.recommendation;
      return [r.name, r.oneLiner, it.query, r.retailers[0]?.name]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(needle));
    });
  }, [items, q]);

  const sorted = useMemo(() => {
    if (sort === "manual") return filtered;
    const copy = [...filtered];
    switch (sort) {
      case "recent":
        copy.sort((a, b) => b.savedAt - a.savedAt);
        break;
      case "price-asc":
        copy.sort(
          (a, b) =>
            parsePrice(a.recommendation.price) - parsePrice(b.recommendation.price),
        );
        break;
      case "price-desc":
        copy.sort(
          (a, b) =>
            parsePrice(b.recommendation.price) - parsePrice(a.recommendation.price),
        );
        break;
      case "rating":
        copy.sort((a, b) => b.recommendation.rating - a.recommendation.rating);
        break;
      case "name":
        copy.sort((a, b) =>
          a.recommendation.name.localeCompare(b.recommendation.name),
        );
        break;
    }
    return copy;
  }, [filtered, sort]);

  const isManualSort = sort === "manual";

  return (
    <Box
      sx={{
        maxWidth: 1400,
        mx: "auto",
        width: "100%",
        px: { xs: 2, sm: 5 },
        py: { xs: 4, sm: 6 },
      }}
    >
      {/* Header */}
      <Typography
        component="h1"
        sx={{
          fontFamily: tokens.fontSerif,
          fontSize: { xs: 32, sm: 46 },
          fontWeight: 500,
          letterSpacing: "-0.02em",
          lineHeight: 1.05,
          color: tokens.ink,
          mb: 3,
        }}
      >
        Your saved finds
      </Typography>

      {/* Toolbar */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { sm: "center" },
          gap: 1.5,
          mb: 3,
        }}
      >
        <TextField
          fullWidth
          placeholder="Search your saved items"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{
            flex: 1,
            "& .MuiOutlinedInput-root": {
              borderRadius: 999,
              backgroundColor: tokens.bgElev,
              "& fieldset": { borderColor: tokens.rule },
            },
          }}
        />
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          sx={{
            minWidth: 220,
            borderRadius: 999,
            backgroundColor: tokens.bgElev,
            "& fieldset": { borderColor: tokens.rule },
          }}
        >
          {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
            <MenuItem key={k} value={k}>
              Sort: {SORT_LABELS[k]}
            </MenuItem>
          ))}
        </Select>
        <Typography
          sx={{
            fontSize: 13,
            color: tokens.ink2,
            whiteSpace: "nowrap",
            px: { xs: 0.5, sm: 1 },
          }}
        >
          {sorted.length === items.length ? (
            <>
              <Box component="strong" sx={{ color: tokens.ink, fontWeight: 600 }}>
                {items.length}
              </Box>{" "}
              saved
            </>
          ) : (
            <>
              <Box component="strong" sx={{ color: tokens.ink, fontWeight: 600 }}>
                {sorted.length}
              </Box>{" "}
              of {items.length} match
            </>
          )}
        </Typography>
      </Box>

      {/* List */}
      {items.length === 0 ? (
        <EmptyState />
      ) : sorted.length === 0 ? (
        <NoMatchesState onClear={() => setQ("")} />
      ) : (
        <SavedList
          items={sorted}
          allItems={items}
          isManualSort={isManualSort}
          summaries={summaries}
          summariesLoading={summariesLoading}
          onRemove={remove}
          onReorder={reorder}
        />
      )}

      {/* Footer */}
      {items.length > 0 && (
        <Box
          sx={{
            mt: 4,
            textAlign: "center",
            fontSize: 13.5,
            color: tokens.ink2,
          }}
        >
          Want to clear them all?{" "}
          <Box
            component="button"
            onClick={() => {
              if (confirm("Remove all saved items?")) clear();
            }}
            sx={{
              border: 0,
              background: "transparent",
              color: tokens.greenDeep,
              cursor: "pointer",
              fontWeight: 600,
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            Clear list
          </Box>
        </Box>
      )}
    </Box>
  );
}

function SavedList({
  items,
  allItems,
  isManualSort,
  summaries,
  summariesLoading,
  onRemove,
  onReorder,
}: {
  items: SavedFind[];
  allItems: SavedFind[];
  isManualSort: boolean;
  summaries: Map<number, PriceSummary>;
  summariesLoading: boolean;
  onRemove: (id: string) => void;
  onReorder: (next: SavedFind[]) => void;
}) {
  const dragFromIdx = useRef<number | null>(null);
  const [dragTargetIdx, setDragTargetIdx] = useState<number | null>(null);

  const onDragStart = (e: React.DragEvent, idx: number) => {
    if (!isManualSort) return;
    dragFromIdx.current = idx;
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent, idx: number) => {
    if (!isManualSort) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const before = e.clientY - rect.top < rect.height / 2;
    setDragTargetIdx(before ? idx : idx + 1);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragFromIdx.current;
    const to = dragTargetIdx;
    dragFromIdx.current = null;
    setDragTargetIdx(null);
    if (!isManualSort || from == null || to == null || from === to) return;

    const next = [...allItems];
    const fromId = items[from].id;
    const fromAbs = next.findIndex((x) => x.id === fromId);
    if (fromAbs < 0) return;
    const [moved] = next.splice(fromAbs, 1);

    let toAbs: number;
    if (to >= items.length) {
      toAbs = next.length;
    } else {
      const targetId = items[to].id;
      toAbs = next.findIndex((x) => x.id === targetId);
      if (toAbs < 0) toAbs = next.length;
    }
    if (fromAbs < toAbs) toAbs -= 1;
    next.splice(toAbs, 0, moved);
    onReorder(next);
  };

  return (
    <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, display: "flex", flexDirection: "column", gap: 1.5 }}>
      {items.map((item, idx) => {
        const summary = item.remoteId != null ? summaries.get(item.remoteId) : undefined;
        // An item whose summary hasn't arrived yet is still resolving — don't let
        // its row claim "no history" until the batch settles.
        const summaryPending = summariesLoading && !summary && item.remoteId != null;
        return (
        <SavedRow
          key={item.id}
          item={item}
          idx={idx}
          isManualSort={isManualSort}
          summary={summary}
          summaryPending={summaryPending}
          dropBefore={dragTargetIdx === idx}
          dropAfter={dragTargetIdx === idx + 1}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onDragEnd={() => {
            dragFromIdx.current = null;
            setDragTargetIdx(null);
          }}
          onRemove={onRemove}
        />
        );
      })}
    </Box>
  );
}

function SavedRow({
  item,
  idx,
  isManualSort,
  summary,
  summaryPending,
  dropBefore,
  dropAfter,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onRemove,
}: {
  item: SavedFind;
  idx: number;
  isManualSort: boolean;
  summary: PriceSummary | undefined;
  summaryPending: boolean;
  dropBefore: boolean;
  dropAfter: boolean;
  onDragStart: (e: React.DragEvent, idx: number) => void;
  onDragOver: (e: React.DragEvent, idx: number) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onRemove: (id: string) => void;
}) {
  const rec = item.recommendation;
  const tierColor = TIER_COLORS[rec.tier] ?? { bg: tokens.bg, fg: tokens.ink };
  const lowest = rec.retailers[0];
  const buyHref = lowest?.url?.startsWith("http")
    ? lowest.url
    : buildRetailerSearchUrl(lowest?.name ?? "Amazon", rec.name);
  const imageSrc = rec.imageUrl ?? pickProductImage(rec.name);

  return (
    <Box
      component="li"
      draggable={isManualSort}
      onDragStart={(e) => onDragStart(e, idx)}
      onDragOver={(e) => onDragOver(e, idx)}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        backgroundColor: tokens.bgElev,
        border: `1px solid ${tokens.rule}`,
        borderRadius: "18px",
        "&::before": dropBefore
          ? {
              content: '""',
              position: "absolute",
              top: -3,
              left: 0,
              right: 0,
              height: 3,
              backgroundColor: tokens.greenDeep,
              borderRadius: 3,
            }
          : undefined,
        "&::after": dropAfter
          ? {
              content: '""',
              position: "absolute",
              bottom: -3,
              left: 0,
              right: 0,
              height: 3,
              backgroundColor: tokens.greenDeep,
              borderRadius: 3,
            }
          : undefined,
      }}
    >
      <Box
        sx={{
          display: "grid",
          // Track count must match the number of children actually
          // rendered: the drag handle is only emitted while
          // isManualSort is true, so when the user picks any other
          // sort we drop that 24px track on the sm layout. Without
          // this, image/body get pushed one track to the left and
          // squish into the wrong-width slots.
          gridTemplateColumns: {
            xs: `${ROW.img.xs}px 1fr auto`,
            sm: isManualSort
              ? `${ROW.handle}px ${ROW.img.sm}px 1fr auto auto`
              : `${ROW.img.sm}px 1fr auto auto`,
          },
          alignItems: "center",
          gap: ROW.gap,
          p: ROW.pad,
        }}
      >
      {isManualSort && (
        <Box
          aria-hidden
          sx={{
            display: { xs: "none", sm: "grid" },
            placeItems: "center",
            color: tokens.ink3,
            cursor: "grab",
            "&:active": { cursor: "grabbing" },
          }}
        >
          <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
            <circle cx="9" cy="6" r="1.6" />
            <circle cx="15" cy="6" r="1.6" />
            <circle cx="9" cy="12" r="1.6" />
            <circle cx="15" cy="12" r="1.6" />
            <circle cx="9" cy="18" r="1.6" />
            <circle cx="15" cy="18" r="1.6" />
          </svg>
        </Box>
      )}

      <Box
        sx={{
          width: ROW.img,
          height: ROW.img,
          borderRadius: "14px",
          backgroundColor: tokens.bg,
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
          p: 1,
        }}
      >
        <Box
          component="img"
          src={imageSrc}
          alt={rec.name}
          sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
        />
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75, flexWrap: "wrap" }}>
          <Box
            sx={{
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 9px",
              borderRadius: 999,
              backgroundColor: tierColor.bg,
              color: tierColor.fg,
            }}
          >
            {rec.tierLabel}
          </Box>
          <Box sx={{ fontSize: 12, color: tokens.ink2 }}>★ {rec.rating}</Box>
          <Box sx={{ fontSize: 12, color: tokens.ink3 }}>· Saved {timeAgo(item.savedAt)}</Box>
        </Box>
        <Typography
          component="h3"
          sx={{
            fontSize: { xs: 15, sm: 16 },
            fontWeight: 600,
            color: tokens.ink,
            mb: 0.25,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {rec.name}
        </Typography>
        <Typography
          sx={{
            fontSize: 13,
            color: tokens.ink2,
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {rec.oneLiner}
        </Typography>
      </Box>

      <Box
        sx={{
          display: { xs: "none", sm: "flex" },
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 0.25,
          minWidth: 110,
        }}
      >
        <Box sx={{ fontSize: 18, fontWeight: 700, color: tokens.greenDeep, fontVariantNumeric: "tabular-nums" }}>
          {rec.price}
        </Box>
        {lowest && (
          <Box sx={{ fontSize: 11, color: tokens.ink3 }}>at {lowest.name}</Box>
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          component="a"
          href={buyHref}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            backgroundColor: tokens.greenDeep,
            color: "#fff",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 600,
            padding: "8px 14px",
            borderRadius: 999,
            transition: "background-color .15s",
            "&:hover": { backgroundColor: "#4AA33D" },
          }}
        >
          Buy
        </Box>
        <AddToPlannerButton wishlistItemId={item.remoteId} variant="icon" />
        <Box
          component="button"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${rec.name}`}
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: `1px solid ${tokens.rule}`,
            background: "transparent",
            color: tokens.ink3,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            transition: "all .15s",
            "&:hover": { color: tokens.error, borderColor: tokens.error },
          }}
        >
          <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 6h18" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </Box>
      </Box>
      </Box>

      {/* Footer — verdict sits under the image (same width); chart starts
          under the text. Mirrors the card's column metrics via `lead`. */}
      <PriceVerdict
        summary={summary}
        pending={summaryPending}
        lead={{
          width: ROW.img,
          gap: ROW.gap,
          pad: ROW.pad,
          handleWidth: ROW.handle,
          hasHandle: isManualSort,
        }}
      />
    </Box>
  );
}

const TIER_COLORS: Record<string, { bg: string; fg: string }> = {
  budget: { bg: "#DCE7F2", fg: "#244A75" },
  value: { bg: tokens.green, fg: tokens.ink },
  premium: { bg: tokens.ink, fg: tokens.bg },
};

function EmptyState() {
  return (
    <Box
      sx={{
        textAlign: "center",
        py: 8,
        px: 3,
        backgroundColor: tokens.bgElev,
        border: `1px dashed ${tokens.rule}`,
        borderRadius: "22px",
      }}
    >
      <Box sx={{ mb: 2, color: tokens.greenDeep, display: "inline-flex" }}>
        <svg viewBox="0 0 24 24" width={36} height={36} fill="currentColor" aria-hidden>
          <path d="M6 3a1 1 0 0 0-1 1v17.4a.6.6 0 0 0 .94.49L12 17.6l6.06 4.29A.6.6 0 0 0 19 21.4V4a1 1 0 0 0-1-1Z" />
        </svg>
      </Box>
      <Typography
        component="h3"
        sx={{
          fontFamily: tokens.fontSerif,
          fontSize: 24,
          fontWeight: 500,
          color: tokens.ink,
          mb: 1,
        }}
      >
        No saves yet
      </Typography>
      <Typography sx={{ fontSize: 14, color: tokens.ink2, mb: 2.5 }}>
        Bookmark picks from your search results and they'll show up here.
      </Typography>
      <Box
        component={RouterLink}
        to="/"
        sx={{
          display: "inline-block",
          backgroundColor: tokens.ink,
          color: tokens.bg,
          padding: "10px 22px",
          borderRadius: 999,
          textDecoration: "none",
          fontSize: 14,
          fontWeight: 500,
          "&:hover": { backgroundColor: "#000" },
        }}
      >
        Start a search
      </Box>
    </Box>
  );
}

function NoMatchesState({ onClear }: { onClear: () => void }) {
  return (
    <Box sx={{ textAlign: "center", py: 6, color: tokens.ink2 }}>
      <Typography component="h3" sx={{ fontFamily: tokens.fontSerif, fontSize: 22, fontWeight: 500, mb: 1, color: tokens.ink }}>
        No matches
      </Typography>
      <Typography sx={{ fontSize: 14, mb: 2 }}>
        Nothing in your saved list matches that search.
      </Typography>
      <Box
        component="button"
        onClick={onClear}
        sx={{
          border: `1px solid ${tokens.rule}`,
          backgroundColor: tokens.bgElev,
          padding: "8px 18px",
          borderRadius: 999,
          cursor: "pointer",
          fontSize: 14,
          color: tokens.ink,
        }}
      >
        Clear search
      </Box>
    </Box>
  );
}
