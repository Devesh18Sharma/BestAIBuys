import { useEffect, useState, type ReactElement } from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { tokens } from "@/config/theme";

/**
 * BES-39 — Best Match loading card.
 *
 * Visual design ported from Alex's claude.ai/design handoff
 * (`BestMatchCard.dc.html`). The Figma file is sized as a standalone
 * 620 px-wide card; this implementation rescales the entire visual
 * rhythm — type, geometry, padding — to ~75 % so the design fits the
 * ~500 px slot it actually lives in (a column of the two-card results
 * grid). Every spec colour and SVG path is preserved verbatim from the
 * handoff; only the dimensions changed.
 *
 * Pacing rules (frontend-driven so the bar/checklist never
 * fake-completes):
 *  - 5 stages cycle every ~5 s (~25 s nominal). The final stage stays
 *    ACTIVE until the parent unmounts on `state.results` landing.
 *  - Progress bar uses a goal-gradient curve (linear → 70 %, then
 *    slower) and is CAPPED at 95 % until results actually land.
 *
 * Accessibility:
 *  - role="region" on the card, role="progressbar" + valuenow on the
 *    bar, off-screen role="status" + aria-live="polite" announcing
 *    each stage transition.
 *  - prefers-reduced-motion: pulse, spinner, row-enter motions fall
 *    back to static states.
 */
interface BestMatchLoadingCardProps {
  reducedMotion?: boolean;
}

interface Stage {
  title: string;
  subtitle: string;
  icon: (size: number) => ReactElement;
}

const STAGES: ReadonlyArray<Stage> = [
  {
    title: "Analyzing your preferences",
    subtitle: "Understanding what matters to you",
    icon: (s) => (
      <svg
        width={s}
        height={s}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    title: "Searching thousands of products",
    subtitle: "Scanning top-rated options",
    icon: (s) => (
      <svg
        width={s}
        height={s}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    ),
  },
  {
    title: "Comparing ratings & reviews",
    subtitle: "Filtering out low-quality picks",
    icon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    title: "Checking live prices",
    subtitle: "Finding the best current deals",
    icon: (s) => (
      <svg
        width={s}
        height={s}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
        <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Finding your best match",
    subtitle: "Finalizing your top picks",
    icon: (s) => (
      <svg
        width={s}
        height={s}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9.5" />
        <circle cx="12" cy="12" r="5.5" />
        <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      </svg>
    ),
  },
];

const STAGE_MS = 5_000;
const EXPECTED_MS = 28_000;

// Spec colours copied verbatim from BestMatchCard.dc.html.
const C = {
  cardBg: "#ffffff",
  cardBorder: "#e6e8eb",
  cardShadow: "0 14px 46px rgba(20,30,40,.10)",
  badgeBg: "#e7eefc",
  badgeFg: "#2b6fde",
  savePlaceholder: "#f3ecda",
  inkPrimary: "#15171a",
  inkMuted: "#9aa0a6",
  pulseDot: "#83cf86",
  greenAccent: "#21a13a",
  barTrack: "#efe7d4",
  barFillStart: "#27a23c",
  barFillEnd: "#1f9636",
  stepIconBg: "#e9f6ea",
  stepIconFg: "#2f9e44",
  activeBg: "#eff8ed",
  activeBorder: "#cbe7c9",
  activeTitle: "#23a13c",
  activeSubtitle: "#7faa82",
  activeIconBg: "#e1f3e2",
  stepSubtitle: "#8b9096",
  rowDivider: "#eceef0",
  pendingRing: "#d4d8dc",
  doneBg: "#22a23b",
  spinnerTrack: "#cbe7c9",
  spinnerHead: "#23a13c",
  panelBg: "#f4f8fd",
  panelBorder: "#dde8f4",
  dashedDivider: "#cdddee",
  sparklesBg: "#dce9fc",
  sparklesFg: "#3b7bf0",
  heartBadgeBg: "#1f6fed",
  heartBadgeBorder: "#f4f8fd",
  trustFg: "#1f4fd0",
  trustLabel: "#3a3f45",
  panelTextSecondary: "#5a6068",
} as const;

export function BestMatchLoadingCard({
  reducedMotion = false,
}: BestMatchLoadingCardProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const id = window.setInterval(() => {
      setElapsed(performance.now() - start);
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  const activeIndex = Math.min(STAGES.length - 1, Math.floor(elapsed / STAGE_MS));

  const rawPct = (elapsed / EXPECTED_MS) * 100;
  const eased = rawPct < 70 ? rawPct : 70 + (rawPct - 70) * 0.45;
  const progressPct = Math.min(95, Math.round(eased));

  return (
    <Box
      component="article"
      role="region"
      aria-label="Finding your best match"
      sx={{
        width: "100%",
        backgroundColor: C.cardBg,
        border: `1px solid ${C.cardBorder}`,
        // Match the loaded ResultsCard's 22 px corner radius so the
        // two cards in the row read as siblings, not strangers.
        borderRadius: "22px",
        boxShadow: C.cardShadow,
        p: { xs: "16px 14px", sm: "18px 18px 16px" },
        display: "flex",
        flexDirection: "column",
        fontFamily: tokens.fontSans,
      }}
    >
      {/* Top row: badge + cream save placeholder. Cream pill is sized
          to match the real Save pill on the loaded card (76×30) so the
          swap is jump-free. */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: "14px",
        }}
      >
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            background: C.badgeBg,
            color: C.badgeFg,
            fontSize: 13,
            fontWeight: 700,
            padding: "7px 13px",
            borderRadius: 999,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
          Best Match for You
        </Box>
        <Box
          aria-hidden
          sx={{
            width: 76,
            height: 28,
            background: C.savePlaceholder,
            borderRadius: "999px",
          }}
        />
      </Box>

      {/* Status line */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: "8px",
          gap: "8px",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <Box
            aria-hidden
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: C.pulseDot,
              flexShrink: 0,
              ...(reducedMotion
                ? {}
                : {
                    animation: "bmStatusDotPulse 1.2s ease-in-out infinite",
                    "@keyframes bmStatusDotPulse": {
                      "0%, 100%": { opacity: 1, transform: "scale(1)" },
                      "50%": { opacity: 0.55, transform: "scale(0.72)" },
                    },
                  }),
            }}
          />
          <Typography
            component="span"
            sx={{
              fontSize: 13.5,
              fontWeight: 700,
              color: C.inkPrimary,
              letterSpacing: "-0.005em",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            Research in progress
          </Typography>
          <Typography
            component="span"
            sx={{ fontSize: 11.5, color: C.inkMuted, lineHeight: 1, whiteSpace: "nowrap" }}
          >
            · ~20–40s
          </Typography>
        </Box>
        <Typography
          component="span"
          aria-live="polite"
          sx={{
            fontSize: 17,
            fontWeight: 800,
            color: C.greenAccent,
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {progressPct}%
        </Typography>
      </Box>

      {/* Progress bar */}
      <Box
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPct}
        aria-label="Research progress"
        sx={{
          height: 7,
          width: "100%",
          background: C.barTrack,
          borderRadius: 999,
          overflow: "hidden",
          mb: "12px",
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${progressPct}%`,
            background: `linear-gradient(90deg, ${C.barFillStart}, ${C.barFillEnd})`,
            borderRadius: 999,
            transition: reducedMotion ? "width .3s linear" : "width .8s cubic-bezier(.2,.8,.2,1)",
          }}
        />
      </Box>

      {/* Stage list */}
      <Box
        component="ol"
        role="list"
        sx={{ listStyle: "none", p: 0, m: 0, display: "flex", flexDirection: "column" }}
      >
        {STAGES.map((stage, i) => {
          const status: "done" | "active" | "pending" =
            i < activeIndex ? "done" : i === activeIndex ? "active" : "pending";
          const isLast = i === STAGES.length - 1;
          const nextIsActive = i + 1 === activeIndex;
          const showDivider = !isLast && status !== "active" && !nextIsActive;
          return (
            <Box
              key={stage.title}
              component={motion.li}
              initial={reducedMotion ? false : { opacity: 0, x: -3 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: reducedMotion ? 0 : 0.22,
                delay: reducedMotion ? 0 : i * 0.03,
              }}
            >
              <StageRow stage={stage} status={status} reducedMotion={reducedMotion} />
              {showDivider && (
                <Box aria-hidden sx={{ height: "1px", background: C.rowDivider, mx: "4px" }} />
              )}
            </Box>
          );
        })}
      </Box>

      <ReassurancePanel />

      <Box
        sx={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
        role="status"
        aria-live="polite"
      >
        {STAGES[activeIndex]?.title}
      </Box>
    </Box>
  );
}

function StageRow({
  stage,
  status,
  reducedMotion,
}: {
  stage: Stage;
  status: "done" | "active" | "pending";
  reducedMotion: boolean;
}) {
  const isDone = status === "done";
  const isActive = status === "active";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "11px",
        padding: isActive ? "9px 11px" : "8px 4px",
        my: isActive ? "5px" : 0,
        background: isActive ? C.activeBg : "transparent",
        border: isActive ? `1.5px solid ${C.activeBorder}` : "1.5px solid transparent",
        borderRadius: isActive ? "12px" : 0,
        transition: "background-color .25s, border-color .25s",
      }}
    >
      <Box
        aria-hidden
        sx={{
          flex: "none",
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: isActive ? C.activeIconBg : C.stepIconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.stepIconFg,
        }}
      >
        {stage.icon(15)}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 700,
            color: isActive ? C.activeTitle : C.inkPrimary,
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {stage.title}
          {isActive && "…"}
        </Typography>
        <Typography
          sx={{
            fontSize: 11,
            color: isActive ? C.activeSubtitle : C.stepSubtitle,
            mt: "2px",
            lineHeight: 1.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {stage.subtitle}
        </Typography>
      </Box>

      <StatusBadge reducedMotion={reducedMotion} isDone={isDone} isActive={isActive} />
    </Box>
  );
}

function StatusBadge({
  reducedMotion,
  isDone,
  isActive,
}: {
  reducedMotion: boolean;
  isDone: boolean;
  isActive: boolean;
}) {
  if (isDone) {
    return (
      <Box
        aria-hidden
        sx={{
          flex: "none",
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: C.doneBg,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </Box>
    );
  }
  if (isActive) {
    return (
      <Box
        aria-hidden
        sx={{
          flex: "none",
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: `2.5px solid ${C.spinnerTrack}`,
          borderTopColor: C.spinnerHead,
          boxSizing: "border-box",
          ...(reducedMotion
            ? { opacity: 0.7 }
            : {
                animation: "bmStepSpin 0.9s linear infinite",
                "@keyframes bmStepSpin": { to: { transform: "rotate(360deg)" } },
              }),
        }}
      />
    );
  }
  return (
    <Box
      aria-hidden
      sx={{
        flex: "none",
        width: 20,
        height: 20,
        borderRadius: "50%",
        border: `2px solid ${C.pendingRing}`,
      }}
    />
  );
}

function ReassurancePanel() {
  return (
    <Box
      sx={{
        mt: "12px",
        background: C.panelBg,
        border: `1px solid ${C.panelBorder}`,
        borderRadius: "14px",
        p: "12px",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "stretch", gap: "12px" }}>
        <Box
          sx={{
            flex: "none",
            position: "relative",
            width: 104,
          }}
        >
          <Box
            component="img"
            src="/bm-shoppers.jpg"
            alt="Happy BestAIBuys shoppers"
            loading="lazy"
            decoding="async"
            sx={{
              width: "100%",
              height: 78,
              display: "block",
              borderRadius: "10px",
              objectFit: "cover",
            }}
          />
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              right: "8px",
              bottom: "-6px",
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: C.heartBadgeBg,
              border: `2.5px solid ${C.heartBadgeBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" />
            </svg>
          </Box>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <Box
            aria-hidden
            sx={{
              flex: "none",
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: C.sparklesBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.sparklesFg,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
            </svg>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 12.5,
                fontWeight: 800,
                color: C.inkPrimary,
                lineHeight: 1.25,
              }}
            >
              We do the research. You save time.
            </Typography>
            <Typography
              sx={{
                m: 0,
                mt: "3px",
                fontSize: 11.5,
                lineHeight: 1.4,
                color: C.panelTextSecondary,
              }}
            >
              Our AI analyzes real data to find the best options for you.
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box
        aria-hidden
        sx={{ height: "1px", background: C.panelBorder, mt: "10px", mb: "8px" }}
      />

      {/* Trust strip — three items, separated by 1px dividers, wraps
          gracefully on phone widths. */}
      <Box
        sx={{
          display: "flex",
          alignItems: "stretch",
          flexWrap: "wrap",
          rowGap: "6px",
        }}
      >
        <TrustItem icon={<ShieldCheckGlyph />} label="No ads" />
        <TrustDivider />
        <TrustItem icon={<AwardGlyph />} label="Unbiased recommendations" />
        <TrustDivider />
        <TrustItem icon={<ShieldCheckGlyph />} label="100% honest picks" />
      </Box>
    </Box>
  );
}

function TrustItem({ icon, label }: { icon: ReactElement; label: string }) {
  return (
    <Box
      sx={{
        flex: "1 1 0",
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}
    >
      {icon}
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 600,
          color: C.trustLabel,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function TrustDivider() {
  return (
    <Box
      aria-hidden
      sx={{
        flex: "none",
        width: "1px",
        background: C.panelBorder,
        mx: "10px",
      }}
    />
  );
}

function ShieldCheckGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={C.trustFg}
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: "none" }}
      aria-hidden
    >
      <path
        d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
        stroke="none"
      />
      <path d="m9 12 2 2 4-4" fill="none" />
    </svg>
  );
}

function AwardGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={C.trustFg}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: "none" }}
      aria-hidden
    >
      <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />
      <circle cx="12" cy="8" r="6" />
    </svg>
  );
}
