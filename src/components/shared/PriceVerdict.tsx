import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { tokens } from "@/config/theme";
import {
  getPriceHistory,
  type PriceSummary,
  type PricePoint,
} from "@/services/api/wishlist";

/** The user's locale currency. Charts in any other currency are suppressed
 *  rather than mislabeled (the backend only sources USD/Amazon today). */
const USER_CURRENCY = "USD";

// "30d high" accent — a calm blue, distinct from the green/red verdict colors.
const BLUE = "#3D6CB0";

// Plot geometry. Width is measured at runtime so the SVG maps 1:1 to its
// container (no aspect distortion → hover dot stays a perfect circle).
const CHART_H = 150;
const PAD_LEFT = 40; // room for the "$110" y-axis labels
const PAD_RIGHT = 10;
const PAD_TOP = 12;
const PAD_BOTTOM = 16;

// US market: always format prices/dates as en-US, never the browser locale.
const usDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const usPrice = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const usPriceWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function fmtPrice(n: number): string {
  return usPrice.format(n);
}

/** Whole-dollar price for axis ticks ("$90", not "$90.00"). */
function fmtAxis(n: number): string {
  return usPriceWhole.format(n);
}

function fmtDate(iso: string): string {
  return usDate.format(new Date(iso));
}

/** Round `range` to a "nice" 1/2/5/10 multiple for tidy axis ticks. */
function niceNum(range: number, round: boolean): number {
  const exp = Math.floor(Math.log10(range || 1));
  const frac = range / Math.pow(10, exp);
  let nf: number;
  if (round) {
    nf = frac < 1.5 ? 1 : frac < 3 ? 2 : frac < 7 ? 5 : 10;
  } else {
    nf = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
  }
  return nf * Math.pow(10, exp);
}

/** A rounded min/max/tick scale framing [min, max] with ~`count` gridlines. */
function niceScale(min: number, max: number, count = 4) {
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const range = niceNum(max - min, false);
  const step = niceNum(range / (count - 1), true) || 1;
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step / 2; v += step) {
    ticks.push(Number(v.toFixed(6)));
  }
  return { niceMin, niceMax, ticks };
}

/** Row metrics so the panel can align its columns under the card's image/text. */
export type LeadConfig = {
  width: { xs: number; sm: number };
  gap: { xs: number; sm: number };
  pad: { xs: number; sm: number };
  handleWidth: number;
  hasHandle: boolean;
};

/**
 * Price-history panel for a saved item, shown inline whenever there's history
 * to draw. Computes a "good time to buy / bad time to buy" verdict (current
 * price vs the 30-day average) entirely on the client from the dated curve we
 * load — no extra backend. When there's no history to plot, shows a gentle
 * empty state instead of the chart.
 *
 * Layout mirrors the card: the verdict sits under the image (same width), the
 * chart starts under the text.
 */
export function PriceVerdict({
  summary,
  lead,
  pending = false,
}: {
  summary: PriceSummary | undefined;
  lead: LeadConfig;
  /** The parent is still resolving this item's summary — hold off on the empty
   *  state so it doesn't flash before we know whether history exists. */
  pending?: boolean;
}) {
  const [points, setPoints] = useState<PricePoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState<number | null>(null);
  const [width, setWidth] = useState(320);
  const svgWrapRef = useRef<HTMLDivElement | null>(null);
  const loadedIdRef = useRef<number | null>(null);

  // Load the full dated curve as soon as the row mounts (the chart is always
  // shown, so we don't wait for a click).
  const summaryId = summary?.id;
  const summaryDays = summary?.days;
  const summaryHasHistory = summary?.hasHistory;
  const summaryCurrency = summary?.currency;
  useEffect(() => {
    if (summaryId == null) return;
    if (!summaryHasHistory || summaryCurrency !== USER_CURRENCY) return;
    if (loadedIdRef.current === summaryId) return;
    let cancelled = false;
    setLoading(true);
    getPriceHistory(summaryId, summaryDays)
      .then((res) => {
        if (cancelled) return;
        setPoints(res.history ?? []);
        loadedIdRef.current = summaryId;
      })
      .catch(() => {
        if (!cancelled) setPoints([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [summaryId, summaryDays, summaryHasHistory, summaryCurrency]);

  // Measure the chart container so the SVG fills it crisply.
  useLayoutEffect(() => {
    const el = svgWrapRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth || 320);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading]);

  // A currency we can't chart faithfully → stay silent rather than mislabel it.
  if (summary && summary.currency !== USER_CURRENCY) return null;

  const data = points ?? [];
  // The parent hasn't finished resolving an eligible item's summary yet → show
  // the loading placeholder, not a premature "no history" note.
  const resolving = !summary && pending;
  // No chart to draw: item we don't track (no summary at all), backend has no
  // history, or the loaded curve is too thin. All read the same to the user.
  const noHistory =
    !resolving && (!summary || !summary.hasHistory || (!loading && data.length < 2));

  return (
    <Box sx={{ borderTop: `1px solid ${tokens.rule}`, px: lead.pad, py: lead.pad }}>
      {resolving ? (
        <Box sx={{ minHeight: 120, display: "grid", placeItems: "center", color: tokens.ink3, fontSize: 13 }}>
          Loading price history…
        </Box>
      ) : noHistory ? (
        <EmptyPriceHistory />
      ) : !summary || loading || data.length < 2 ? (
        <Box sx={{ minHeight: 120, display: "grid", placeItems: "center", color: tokens.ink3, fontSize: 13 }}>
          Loading price history…
        </Box>
      ) : (
        <Panel
          summary={summary}
          data={data}
          width={width}
          hover={hover}
          setHover={setHover}
          svgWrapRef={svgWrapRef}
          lead={lead}
        />
      )}
    </Box>
  );
}

/**
 * Shown in place of the chart when an item has no price history to plot — a
 * quiet, reassuring note rather than an empty gap or a broken-looking chart.
 */
function EmptyPriceHistory() {
  return (
    <Box
      sx={{
        minHeight: 120,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 0.75,
        px: 2,
        py: 3,
      }}
    >
      <Box
        sx={{
          width: 46,
          height: 46,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          color: tokens.ink3,
          backgroundColor: tokens.bgElev,
          border: `1px solid ${tokens.rule}`,
          mb: 0.5,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width={22}
          height={22}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M3 3v16a2 2 0 0 0 2 2h16" />
          <path d="M7 14.5 11 11l3 2.5L20 8" strokeDasharray="2.5 2.5" opacity={0.7} />
        </svg>
      </Box>
      <Box sx={{ color: tokens.ink, fontSize: 14, fontWeight: 600 }}>
        No price history yet
      </Box>
      <Box sx={{ color: tokens.ink3, fontSize: 12.5, lineHeight: 1.45, maxWidth: 260 }}>
        We haven't tracked this item long enough to chart its price. The moment it
        starts to move, you'll see the story here.
      </Box>
    </Box>
  );
}

function Panel({
  summary,
  data,
  width,
  hover,
  setHover,
  svgWrapRef,
  lead,
}: {
  summary: PriceSummary;
  data: PricePoint[];
  width: number;
  hover: number | null;
  setHover: (i: number | null) => void;
  svgWrapRef: React.RefObject<HTMLDivElement | null>;
  lead: LeadConfig;
}) {
  // The plot height tracks the buy/sell signal box so the two line up.
  const verdictBoxRef = useRef<HTMLDivElement | null>(null);
  const [chartH, setChartH] = useState(CHART_H);
  useLayoutEffect(() => {
    const el = verdictBoxRef.current;
    if (!el) return;
    const update = () => setChartH(Math.max(110, Math.round(el.offsetHeight)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const prices = data.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minIdx = prices.indexOf(minPrice);
  const maxIdx = prices.indexOf(maxPrice);
  const average = prices.reduce((a, b) => a + b, 0) / prices.length;
  const current = summary.current ?? prices[prices.length - 1];

  const diff = current - average;
  const pct = average ? (diff / average) * 100 : 0;
  const isGood = diff <= 0;
  const accent = isGood ? tokens.greenDeep : tokens.error;
  const accentSoft = isGood ? "rgba(92,186,73,0.10)" : "rgba(240,105,77,0.10)";

  const { niceMin, niceMax, ticks } = niceScale(minPrice, maxPrice, 4);
  const W = width;
  const x = (i: number) =>
    data.length > 1 ? PAD_LEFT + (i / (data.length - 1)) * (W - PAD_LEFT - PAD_RIGHT) : (W) / 2;
  const y = (v: number) =>
    PAD_TOP + (1 - (v - niceMin) / (niceMax - niceMin || 1)) * (chartH - PAD_TOP - PAD_BOTTOM);

  const linePath = data
    .map((p, i) => `${i ? "L" : "M"} ${x(i).toFixed(1)} ${y(p.price).toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${x(data.length - 1).toFixed(1)} ${chartH - PAD_BOTTOM} L ${x(0).toFixed(1)} ${chartH - PAD_BOTTOM} Z`;

  const lastIdx = data.length - 1;
  const activeIdx = hover ?? lastIdx;
  const active = data[activeIdx];
  const gradientId = `priceFill-${summary.id}`;

  const onMove = (clientX: number) => {
    const el = svgWrapRef.current;
    if (!el || data.length < 2) return;
    const rect = el.getBoundingClientRect();
    const plot = rect.width - PAD_LEFT - PAD_RIGHT;
    const ratio = (clientX - rect.left - PAD_LEFT) / (plot || 1);
    const idx = Math.max(0, Math.min(data.length - 1, Math.round(ratio * (data.length - 1))));
    setHover(idx);
  };

  return (
    <Box sx={{ display: "flex", gap: lead.gap, alignItems: "flex-start" }}>
      {/* spacer aligning the panel under the drag-handle offset */}
      {lead.hasHandle && (
        <Box sx={{ display: { xs: "none", sm: "block" }, width: lead.handleWidth, flexShrink: 0 }} />
      )}

      {/* Under the image — header + verdict, matched to the image width */}
      <Box sx={{ width: lead.width, flexShrink: 0 }}>
        <Box sx={{ mb: 1 }}>
          <Box component="span" sx={{ fontSize: 14, fontWeight: 700, color: tokens.ink }}>
            Price history
          </Box>
          <Box component="span" sx={{ fontSize: 12.5, color: tokens.ink3, ml: 0.75 }}>
            · {summary.days} days
          </Box>
        </Box>

        <Box ref={verdictBoxRef} sx={{ backgroundColor: accentSoft, borderRadius: `${tokens.radiusMd}px`, p: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.625, mb: 0.75 }}>
            <Box
              component="svg"
              viewBox="0 0 24 24"
              aria-hidden
              sx={{ width: 17, height: 17, flexShrink: 0, color: accent }}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isGood ? (
                <path d="M20 6 9 17l-5-5" />
              ) : (
                <>
                  <path d="M12 5v14" />
                  <path d="m19 12-7 7-7-7" />
                </>
              )}
            </Box>
            <Box sx={{ fontSize: 13, fontWeight: 700, color: accent }}>
              {isGood ? "Good time to buy" : "Bad time to buy"}
            </Box>
          </Box>
          <Box sx={{ fontSize: 12.5, color: tokens.ink2, lineHeight: 1.45 }}>
            <Box component="strong" sx={{ color: tokens.ink, fontWeight: 700 }}>
              {fmtPrice(current)}
            </Box>{" "}
            is {fmtPrice(Math.abs(diff))} {isGood ? "below" : "above"} the 30-day average
          </Box>
          <Box sx={{ fontSize: 12, color: accent, fontWeight: 600, mt: 0.5 }}>
            ({Math.abs(Math.round(pct))}% {isGood ? "below" : "above"} average)
          </Box>
        </Box>
      </Box>

      {/* Under the text — chart + stats */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexWrap: "wrap",
          gap: { xs: 2, md: 3 },
          alignItems: "center",
        }}
      >
      {/* Center — legend + chart */}
      <Box sx={{ flex: "2 1 300px", minWidth: 240 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 0.75 }}>
          <LegendItem color={accent} label="Price" />
          <LegendItem color={tokens.ink3} dashed label="30-day average" />
        </Box>

        <Box
          ref={svgWrapRef}
          onMouseMove={(e) => onMove(e.clientX)}
          onMouseLeave={() => setHover(null)}
          onTouchStart={(e) => onMove(e.touches[0].clientX)}
          onTouchMove={(e) => onMove(e.touches[0].clientX)}
          sx={{ position: "relative", width: "100%", cursor: "crosshair", touchAction: "none" }}
        >
          <Box
            component="svg"
            viewBox={`0 0 ${W} ${chartH}`}
            sx={{ width: "100%", height: chartH, display: "block", overflow: "visible" }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.18} />
                <stop offset="100%" stopColor={accent} stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* y gridlines + labels */}
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD_LEFT} y1={y(t)} x2={W - PAD_RIGHT} y2={y(t)} stroke={tokens.rule} strokeWidth={0.5} opacity={0.6} />
                <text x={PAD_LEFT - 6} y={y(t) + 3} textAnchor="end" fontSize={10} fill={tokens.ink3}>
                  {fmtAxis(t)}
                </text>
              </g>
            ))}

            {/* area + price line */}
            <path d={areaPath} fill={`url(#${gradientId})`} />
            <path d={linePath} fill="none" stroke={accent} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            {/* 30-day average (grey dashed) reference line */}
            <line x1={PAD_LEFT} y1={y(average)} x2={W - PAD_RIGHT} y2={y(average)} stroke={tokens.ink3} strokeWidth={1} strokeDasharray="5 4" />

            {/* hover crosshair + dot */}
            {hover !== null && (
              <line x1={x(activeIdx)} y1={PAD_TOP} x2={x(activeIdx)} y2={chartH - PAD_BOTTOM} stroke={tokens.ink3} strokeWidth={0.75} />
            )}
            <circle cx={x(activeIdx)} cy={y(active.price)} r={3.5} fill={accent} stroke="#fff" strokeWidth={1.75} />
          </Box>

          {/* hover readout */}
          {hover !== null && (
            <Box
              sx={{
                position: "absolute",
                left: `${(x(activeIdx) / W) * 100}%`,
                top: `${(y(active.price) / chartH) * 100}%`,
                transform: "translate(-50%, -135%)",
                backgroundColor: tokens.ink,
                color: "#fff",
                fontSize: 11,
                fontWeight: 600,
                whiteSpace: "nowrap",
                px: 0.75,
                py: 0.25,
                borderRadius: 1,
                pointerEvents: "none",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {fmtPrice(active.price)} · {fmtDate(active.date)}
            </Box>
          )}

          {/* x-axis ends */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.25, pl: `${PAD_LEFT}px` }}>
            <Box sx={{ fontSize: 10.5, color: tokens.ink3 }}>{summary.days} days ago</Box>
            <Box sx={{ fontSize: 10.5, color: tokens.ink3 }}>Today</Box>
          </Box>
        </Box>
      </Box>

      {/* Right — stats (compact; divided from the chart) */}
      <Box
        sx={{
          flex: "0 0 auto",
          display: "grid",
          gridTemplateColumns: "auto auto auto",
          borderLeft: `1px solid ${tokens.rule}`,
        }}
      >
        <Stat label="30d low" value={fmtPrice(minPrice)} color={tokens.greenDeep} sub={`Lowest on ${fmtDate(data[minIdx].date)}`} />
        <Stat label="30d average" value={fmtPrice(average)} color={tokens.ink} divider />
        <Stat label="30d high" value={fmtPrice(maxPrice)} color={BLUE} sub={`Highest on ${fmtDate(data[maxIdx].date)}`} divider />
      </Box>
      </Box>
    </Box>
  );
}

function LegendItem({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.625 }}>
      <Box
        component="svg"
        viewBox="0 0 18 8"
        aria-hidden
        sx={{ width: 18, height: 8, flexShrink: 0 }}
      >
        <line x1={0} y1={4} x2={18} y2={4} stroke={color} strokeWidth={2} strokeLinecap="round" strokeDasharray={dashed ? "3 3" : undefined} />
      </Box>
      <Box sx={{ fontSize: 11.5, color: tokens.ink2, fontWeight: 500 }}>{label}</Box>
    </Box>
  );
}

function Stat({
  label,
  value,
  color,
  sub,
  divider,
}: {
  label: string;
  value: string;
  color: string;
  sub?: string;
  divider?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        px: 2,
        borderLeft: divider ? `1px solid ${tokens.rule}` : undefined,
      }}
    >
      <Box sx={{ fontSize: 11, color: tokens.ink3, mb: 0.5, whiteSpace: "nowrap" }}>{label}</Box>
      <Box sx={{ fontSize: 17, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{value}</Box>
      {sub && <Box sx={{ fontSize: 10.5, color: tokens.ink3, mt: 0.5, whiteSpace: "nowrap" }}>{sub}</Box>}
    </Box>
  );
}
