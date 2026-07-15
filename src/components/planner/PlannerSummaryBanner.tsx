import { Box, Typography } from "@mui/material";
import { tokens } from "@/config/theme";
import type { PlannerSummary } from "@/types/planner";

interface Props {
  summary: PlannerSummary;
  /** UI-only handlers — wired to real flows in a later phase. */
  onFollowPlan: () => void;
  onAlertMe: () => void;
  following: boolean;
  alerting: boolean;
}

/**
 * Top summary banner — the headline savings figure, the budget/total/save
 * stats, an "on-track" progress ring, and the two CTAs. Every number comes
 * from the `PlannerSummary` (built from MOCK_PLANNER_ITEMS); nothing here is
 * hardcoded so the backend phase only has to feed a real summary object.
 */
export function PlannerSummaryBanner({
  summary,
  onFollowPlan,
  onAlertMe,
  following,
  alerting,
}: Props) {
  const {
    totalSavings,
    buyNowCount,
    waitCount,
    totalBudget,
    currentTotal,
  } = summary;

  return (
    <Box
      sx={{
        backgroundColor: tokens.bgElev,
        border: `1px solid ${tokens.rule}`,
        borderRadius: "22px",
        p: { xs: 2.5, sm: 4 },
        mb: { xs: 3, sm: 4 },
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1fr auto" },
        gap: { xs: 3, lg: 4 },
        alignItems: "center",
      }}
    >
      {/* Left — icon + headline + stats */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 2.5, sm: 3 },
          alignItems: { sm: "center" },
          minWidth: 0,
        }}
      >
        {/* Piggy-bank icon */}
        <Box
          sx={{
            flexShrink: 0,
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: tokens.green,
            color: tokens.ink,
            display: "grid",
            placeItems: "center",
          }}
          aria-hidden
        >
          <svg
            viewBox="0 0 24 24"
            width={54}
            height={54}
            fill="none"
            stroke="#ffffff"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Mirrored horizontally so the piggy faces left. */}
            <g transform="translate(24 0) scale(-1 1)">
              {/* piggy-bank outline (body, ear, snout, legs) */}
              <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z" />
              {/* curly tail */}
              <path d="M2 9v1c0 1.1 .9 2 2 2h1" />
              {/* nostril */}
              <path d="M16 11h.01" />
              {/* coin slot on the back */}
              <path d="M8 8.2 13 7.4" strokeWidth={1.2} />
              {/* gold coin dropping in — large, centered over the back */}
              <circle cx="10.5" cy="4.2" r="3.4" fill="#F4C21B" stroke="#E0A800" strokeWidth={0.9} />
              <path d="M9 3.1 12 5.3" stroke="#E0A800" strokeWidth={0.75} />
            </g>
          </svg>
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h1"
            sx={{
              fontFamily: tokens.fontSerif,
              fontSize: { xs: 28, sm: 38 },
              fontWeight: 500,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              color: tokens.ink,
            }}
          >
            Follow our plan and{" "}
            <Box
              component="span"
              sx={{ color: tokens.greenDeep, fontSize: { xs: 34, sm: 46 } }}
            >
              save ${totalSavings}
            </Box>
          </Typography>
          <Typography
            sx={{ fontSize: { xs: 14, sm: 15 }, color: tokens.ink2, mt: 0.75 }}
          >
            Buy {buyNowCount} item{buyNowCount === 1 ? "" : "s"} now and wait for{" "}
            {waitCount} item{waitCount === 1 ? "" : "s"} to get the best prices.
          </Typography>

          {/* Stats group */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: { xs: 2.5, sm: 4 },
              mt: 2.5,
            }}
          >
            <Stat label="Total Budget" value={`$${totalBudget.toLocaleString()}`} />
            <Stat
              label="Current Total"
              value={`$${currentTotal.toLocaleString()}`}
            />
            <Stat
              label="You Can Save"
              value={`$${totalSavings}`}
              accent={tokens.greenDeep}
            />
          </Box>
        </Box>
      </Box>

      {/* Right — stacked CTAs */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          width: { xs: "100%", lg: 240 },
        }}
      >
        <Box
          component="button"
          onClick={onFollowPlan}
          sx={{
            width: "100%",
            py: "14px",
            px: 2,
            borderRadius: 999,
            border: 0,
            backgroundColor: following ? "#4AA33D" : tokens.greenDeep,
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            fontFamily: tokens.fontSans,
            cursor: "pointer",
            transition: "background-color .15s, transform .15s",
            boxShadow: "0 8px 20px -8px rgba(92,186,73,0.55)",
            "&:hover": { backgroundColor: "#4AA33D", transform: "translateY(-1px)" },
          }}
        >
          {following ? "Plan Followed ✓" : "Follow This Plan"}
        </Box>
        <Box
          component="button"
          onClick={onAlertMe}
          sx={{
            width: "100%",
            py: "13px",
            px: 2,
            borderRadius: 999,
            backgroundColor: "transparent",
            border: `1px solid ${alerting ? tokens.greenDeep : tokens.rule}`,
            color: alerting ? tokens.greenDeep : tokens.ink,
            fontSize: 14.5,
            fontWeight: 600,
            fontFamily: tokens.fontSans,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.75,
            transition: "border-color .15s, color .15s",
            "&:hover": { borderColor: tokens.ink },
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width={16}
            height={16}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {alerting ? "Alert Set" : "Alert Me When It's Time"}
        </Box>
      </Box>
    </Box>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <Box>
      <Typography sx={{ fontSize: 12, color: tokens.ink3, mb: 0.25 }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: { xs: 18, sm: 20 },
          fontWeight: 700,
          color: accent ?? tokens.ink,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
