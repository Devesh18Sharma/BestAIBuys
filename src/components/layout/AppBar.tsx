import { Box, Typography } from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { tokens } from "@/config/theme";
import { useSavedFinds } from "@/context/SavedFindsContext";
import { useAuth } from "@/context/AuthContext";

interface AppBarProps {
  onStartOver: () => void;
}

/**
 * Sticky brand nav — mirrors Good Find's `.nav` block.
 *
 * Anchor link ("How it works") navigates to the landing route and
 * smooth-scrolls to the target heading. Saved Finds + Sign in are
 * real route links. Wordmark click resets the flow and returns to
 * the landing page (delegated to Shell via onStartOver).
 */
export function AppBar({ onStartOver }: AppBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { items: savedItems } = useSavedFinds();
  const { user, isAuthenticated, logout } = useAuth();

  // Anchor scroll handler — if we're not on /, navigate there first
  // then scroll; otherwise just scrollIntoView. The target sections
  // own their scroll-margin-top so the heading isn't hidden behind
  // this sticky header (BES-3).
  const goToAnchor = (id: string) => {
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: id } });
      // The HomePage's useEffect on location.state.scrollTo handles the
      // actual scrollIntoView after the route mounts.
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1100,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        px: { xs: 2.25, sm: 5 },
        py: "18px",
        background: `color-mix(in oklab, ${tokens.bg} 86%, transparent)`,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      {/* Wordmark */}
      <Box
        onClick={onStartOver}
        sx={{
          display: "flex",
          alignItems: "baseline",
          gap: 0.5,
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <Typography
          sx={{
            fontFamily: tokens.fontSerif,
            fontWeight: 500,
            fontSize: { xs: 22, sm: 24 },
            color: tokens.ink,
            letterSpacing: "-0.025em",
            lineHeight: 1,
          }}
        >
          BestAIBuys
        </Typography>
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            backgroundColor: tokens.green,
          }}
        />
      </Box>

      {/* Right side — nav links */}
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.25, sm: 3 } }}>
        <Typography
          component="button"
          onClick={() => goToAnchor("how")}
          sx={{
            display: { xs: "none", md: "inline-flex" },
            alignItems: "center",
            gap: 0.75,
            background: "transparent",
            border: 0,
            cursor: "pointer",
            fontSize: 14.5,
            color: tokens.ink2,
            fontFamily: tokens.fontSans,
            transition: "color .15s ease",
            "&:hover": { color: tokens.ink },
          }}
        >
          <NavIcon name="help" />
          How it works
        </Typography>
        {/* Wish List — always visible (the CTA needs a real destination from
            the start; auth-gating happens later). Order matches Alex: Wish
            List before Purchase Planner. */}
        <Box
          component={RouterLink}
          to="/saved"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            fontSize: { xs: 13, sm: 14.5 },
            color:
              location.pathname === "/saved" ? tokens.ink : tokens.ink2,
            fontWeight: location.pathname === "/saved" ? 600 : 400,
            textDecoration: "none",
            transition: "color .15s ease",
            "&:hover": { color: tokens.ink },
          }}
        >
          <NavIcon name="heart" />
          Wish List
          {savedItems.length > 0 && (
            <Box
              component="span"
              sx={{
                display: "inline-grid",
                placeItems: "center",
                minWidth: 18,
                height: 18,
                px: 0.5,
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 999,
                backgroundColor: "#5B2BD6",
                color: "#fff",
                lineHeight: 1,
              }}
            >
              {savedItems.length}
            </Box>
          )}
        </Box>
        {/* Purchase Planner — always shown to match the design; /planner
            auth-gates on click for signed-out users. */}
        <Box
          component={RouterLink}
          to="/planner"
          sx={{
            display: { xs: "none", md: "inline-flex" },
            alignItems: "center",
            gap: 0.75,
            fontSize: { xs: 13, sm: 14.5 },
            color: location.pathname === "/planner" ? tokens.ink : tokens.ink2,
            fontWeight: location.pathname === "/planner" ? 600 : 400,
            textDecoration: "none",
            transition: "color .15s ease",
            "&:hover": { color: tokens.ink },
          }}
        >
          <NavIcon name="calendar" />
          Purchase Planner
        </Box>

        {/* Auth — signed-out shows a "Sign in" link; signed-in shows the
            user's email and a sign-out action. */}
        {isAuthenticated ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 } }}>
            <Typography
              sx={{
                display: { xs: "none", sm: "inline" },
                fontSize: 14,
                color: tokens.ink2,
                maxWidth: 180,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.email}
            </Typography>
            <Box
              component="button"
              onClick={() => {
                logout();
                navigate("/");
              }}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                px: { xs: 1.5, sm: 2.25 },
                py: 0.75,
                borderRadius: 999,
                backgroundColor: tokens.bgElev,
                color: tokens.ink,
                border: `1px solid ${tokens.rule}`,
                fontSize: { xs: 13, sm: 14 },
                fontWeight: 500,
                fontFamily: tokens.fontSans,
                cursor: "pointer",
                transition: "background-color .15s, color .15s",
                "&:hover": { backgroundColor: tokens.ink, color: tokens.bg },
              }}
            >
              Sign out
            </Box>
          </Box>
        ) : (
          <Box
            component={RouterLink}
            to="/login"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              px: { xs: 1.5, sm: 2.25 },
              py: 0.75,
              borderRadius: 999,
              backgroundColor:
                location.pathname === "/login" || location.pathname === "/signup"
                  ? tokens.ink
                  : tokens.bgElev,
              color:
                location.pathname === "/login" || location.pathname === "/signup"
                  ? tokens.bg
                  : tokens.ink,
              border: `1px solid ${tokens.rule}`,
              fontSize: { xs: 13, sm: 14 },
              fontWeight: 500,
              textDecoration: "none",
              transition: "background-color .15s, color .15s",
              "&:hover": { backgroundColor: tokens.ink, color: tokens.bg },
              whiteSpace: "nowrap",
            }}
          >
            Sign in / Sign up
          </Box>
        )}
      </Box>
    </Box>
  );
}

/** Small nav-link glyphs matching Natalya's design (help / heart / calendar). */
function NavIcon({ name }: { name: "help" | "heart" | "calendar" }) {
  const p = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (name === "help") {
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.5 2.5 0 1 1 4.5 1.5c-1.2.8-2 1.4-2 3" />
        <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (name === "heart") {
    return (
      <svg {...p}>
        <path d="M20.8 6.6c-1.6-1.7-4.2-1.7-5.8 0L12 9.6 9 6.6c-1.6-1.7-4.2-1.7-5.8 0-1.6 1.7-1.6 4.4 0 6.1l8.8 9 8.8-9c1.6-1.7 1.6-4.4 0-6.1Z" />
      </svg>
    );
  }
  return (
    <svg {...p}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9h17M8 3.5v3M16 3.5v3M8.4 14.4l2.3 2.3 4-4.6" />
    </svg>
  );
}
