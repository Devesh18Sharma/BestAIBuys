import { useEffect, useRef, type ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Box } from "@mui/material";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { theme } from "@/config/theme";
import { ShoppingFlowProvider } from "@/context/ShoppingFlowContext";
import { useShoppingFlow } from "@/hooks/useShoppingFlow";
import { SavedFindsProvider } from "@/context/SavedFindsContext";
import { PlannerMembershipProvider } from "@/context/PlannerMembershipContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppBar } from "@/components/layout/AppBar";
import { ChatShell } from "@/components/chat/ChatShell";
import { HomePage } from "@/pages/HomePage";
import { SharedSearchPage } from "@/pages/SharedSearchPage";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { SavedFindsPage } from "@/pages/SavedFindsPage";
import { PurchasePlannerPage } from "@/pages/PurchasePlannerPage";
import { PrivacyPolicyPage } from "@/pages/PrivacyPolicyPage";
import { ContactPage } from "@/pages/ContactPage";
import { trackEvent, trackScreenView } from "@/services/analytics";

/**
 * Top-level shell. Each surface lives at its own URL (BES-2). The
 * router — not state.screen — controls what renders, so a stale async
 * dispatch landing AFTER the user has navigated away can't drag the
 * user back to the chat surface.
 *
 *  Routes:
 *    /         landing
 *    /search   chat / questionnaire / results
 *    /login    auth (BES-4)
 *    /signup   auth (BES-4)
 *    /saved    saved finds (BES-5)
 *    *         redirect to /
 */
/**
 * Auth gate for protected routes. Renders children only when the user is
 * signed in; otherwise bounces to /login. Runs inside <AuthProvider>.
 */
function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Shell() {
  const { state, reset } = useShoppingFlow();
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);

  // Screen-view analytics — fired once per screen-state transition.
  const prevScreen = useRef<string | null>(null);
  useEffect(() => {
    if (state.screen !== prevScreen.current) {
      prevScreen.current = state.screen;
      trackScreenView(state.screen);
      if (state.screen === "results" || state.screen === "price_results") {
        trackEvent("view_results", { type: state.screen, query: state.query });
      }
    }
  }, [state.screen, state.query]);

  // Reset scroll on every route change. The <main> owns the scroll
  // (overflow-y: auto), and react-router preserves its scrollTop
  // across route swaps by default — so a user scrolled to the footer
  // of / who clicks "Privacy" would land at the bottom of /privacy.
  // Resetting on pathname change (NOT on hash/state changes) keeps the
  // BES-3 anchor scroll intact while ensuring a fresh route always
  // starts at the top.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  /**
   * BES-2 root-cause fix: do NOT auto-navigate when state.screen
   * changes. The previous version had a useEffect that pushed the
   * user to /search whenever state.screen became non-home — which is
   * exactly what the stale-results bug exploited. An in-flight
   * `getRecommendations` resolving 10 s after the user clicked back
   * would dispatch RESULTS_READY, the effect would notice "non-home
   * + path is /", and yank the user back to /search.
   *
   * Navigation is now driven ONLY by explicit user actions:
   *  - HomePage submit handlers call navigate("/search") right after
   *    the dispatching submitSearch / submitPriceSearch.
   *  - onStartOver below clears state + navigates home.
   *
   * Late async dispatches still update state in memory but can't
   * change the URL, so the user stays where they are.
   */

  const onStartOver = () => {
    reset();
    navigate("/");
  };

  const chatLayout =
    location.pathname === "/search" || location.pathname.startsWith("/s/");

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        // Paint the root cream so no dark browser canvas shows through any
        // rounding/scrollbar gap (was the "black patch" at the bottom).
        backgroundColor: "background.default",
      }}
    >
      <AppBar onStartOver={onStartOver} />
      <Box
        ref={mainRef}
        component="main"
        sx={{
          // Plain block — flex layout was bleeding into the landing
          // children and squishing them (the CTAStrip was the visible
          // symptom). The /search route wraps ChatShell in its own
          // flex column so the chat keeps its internal scroll context.
          flex: 1,
          minHeight: 0,
          overflowY: chatLayout ? "hidden" : "auto",
        }}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/search"
            element={
              state.screen === "home" ? (
                <Navigate to="/" replace />
              ) : (
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <ChatShell />
                </Box>
              )
            }
          />
          <Route path="/s/:shareId" element={<SharedSearchPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/saved" element={<SavedFindsPage />} />
          <Route
            path="/planner"
            element={
              <RequireAuth>
                <PurchasePlannerPage />
              </RequireAuth>
            }
          />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <ShoppingFlowProvider>
            <SavedFindsProvider>
              <PlannerMembershipProvider>
                <Shell />
              </PlannerMembershipProvider>
            </SavedFindsProvider>
          </ShoppingFlowProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
