import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
} from "@mui/material";
import { tokens } from "@/config/theme";
import type { PlannerMeta } from "@/types/planner";
import type { Recommendation } from "@/types/product";
import { useAuth } from "@/context/AuthContext";
import { useSavedFinds, recommendationId } from "@/context/SavedFindsContext";
import { usePlannerMembership } from "@/context/PlannerMembershipContext";
import { createWishlistItem, recommendationToPayload } from "@/services/api/wishlist";
import { AuthModal } from "@/components/auth/AuthModal";
import {
  listPlanners,
  createPlanner,
  addPlannerItem,
} from "@/services/api/planner";

interface Props {
  /**
   * Backend wishlist-item id — the saved-finds path, where the item already
   * lives in the wishlist. Mutually exclusive with `recommendation`.
   */
  wishlistItemId?: number;
  /**
   * A result-card recommendation not necessarily saved yet — the result-card
   * path. Planner membership is keyed by wishlist item, so picking a planner
   * first ensures the pick is in the wishlist, then adds it to the planner.
   */
  recommendation?: Recommendation;
  /** Originating query, persisted with the wishlist item for rehydration. */
  query?: string;
  /** `icon` (saved-finds rows) or `pill` (result cards). */
  variant?: "icon" | "pill";
}

/**
 * Adds an item to one of the user's named planners. Opening the menu loads the
 * planner list lazily; picking a planner adds the item (the backend is
 * idempotent), and "New planner…" creates one and adds in one step.
 *
 * Two entry surfaces share this control:
 *   - Saved Finds passes `wishlistItemId` (the item is already in the wishlist).
 *   - Result cards pass a `recommendation`; since a planner holds wishlist
 *     items, we save the pick to the wishlist first (deduped against Saved
 *     Finds) to get its id, then add it to the chosen planner.
 *
 * Planning requires an account (planner routes are per-user), so on the result
 * card a signed-out click opens the auth modal instead of the menu.
 */
export function AddToPlannerButton({
  wishlistItemId,
  recommendation,
  query,
  variant = "icon",
}: Props) {
  const { isAuthenticated } = useAuth();
  const saved = useSavedFinds();
  const membership = usePlannerMembership();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [planners, setPlanners] = useState<PlannerMeta[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [draftName, setDraftName] = useState("My Planner");
  const [authOpen, setAuthOpen] = useState(false);
  const open = Boolean(anchorEl);

  // From a result card we can plan any recommendation; from Saved Finds we can
  // only plan once the item has synced (has a backend id).
  const fromRecommendation = recommendation != null;
  const disabled = !fromRecommendation && wishlistItemId == null;

  // The wishlist-item id we can check planner membership against: the explicit
  // prop, or the already-saved copy of this recommendation.
  const existingSaved = recommendation
    ? saved.items.find((x) => x.id === recommendationId(recommendation))
    : undefined;
  const effectiveItemId = wishlistItemId ?? existingSaved?.remoteId;
  const inPlanners = membership.plannersForItem(effectiveItemId);
  const planned = inPlanners.length > 0;
  const plannedIds = new Set(inPlanners.map((p) => p.id));

  const openMenu = async (e: React.MouseEvent<HTMLElement>) => {
    // Result-card path needs an account before we can list/create planners.
    if (fromRecommendation && !isAuthenticated) {
      setAuthOpen(true);
      return;
    }
    setAnchorEl(e.currentTarget);
    setDone(null);
    const list = await listPlanners().catch(() => [] as PlannerMeta[]);
    setPlanners(list);
  };

  const closeMenu = () => setAnchorEl(null);

  /**
   * The wishlist-item id to add to a planner. Uses the explicit prop when given
   * (Saved Finds); otherwise reuses the already-saved copy of this
   * recommendation, or saves it to the wishlist now to obtain an id.
   */
  const resolveWishlistItemId = async (): Promise<number | null> => {
    if (wishlistItemId != null) return wishlistItemId;
    if (!recommendation) return null;
    const existing = saved.items.find(
      (x) => x.id === recommendationId(recommendation),
    );
    if (existing?.remoteId != null) return existing.remoteId;
    const row = await createWishlistItem(
      recommendationToPayload(recommendation, query ?? ""),
    ).catch(() => null);
    return row?.id ?? null;
  };

  const addTo = async (plannerId: number, plannerName: string) => {
    if (busy) return;
    setBusy(true);
    const id = await resolveWishlistItemId();
    const ok =
      id != null &&
      (await addPlannerItem(plannerId, id)
        .then(() => true)
        .catch(() => false));
    setBusy(false);
    if (ok && id != null) {
      membership.markAdded(id, { id: plannerId, name: plannerName });
      setDone(plannerName);
      setTimeout(closeMenu, 700);
    }
  };

  const openNameDialog = () => {
    if (busy) return;
    setDraftName("My Planner");
    setNameDialogOpen(true);
  };

  const closeNameDialog = () => {
    if (busy) return;
    setNameDialogOpen(false);
  };

  const createAndAdd = async () => {
    const name = draftName.trim();
    if (!name || busy) return;
    setBusy(true);
    const id = await resolveWishlistItemId();
    const created = id != null ? await createPlanner(name).catch(() => null) : null;
    if (created && id != null) await addPlannerItem(created.id, id).catch(() => {});
    setBusy(false);
    setNameDialogOpen(false);
    if (created && id != null) {
      membership.markAdded(id, { id: created.id, name: created.name });
      setDone(created.name);
      setTimeout(closeMenu, 700);
    }
  };

  const trigger =
    variant === "pill" ? (
      <Box
        component="button"
        type="button"
        onClick={openMenu}
        disabled={disabled}
        aria-label={planned ? "In a planner — add to another" : "Add to planner"}
        aria-pressed={planned}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.75,
          px: "10px",
          py: "6px",
          borderRadius: 999,
          backgroundColor: planned ? tokens.blueDeep : tokens.bgElev,
          color: planned ? "#fff" : tokens.ink,
          border: planned ? "none" : `1px solid ${tokens.rule}`,
          fontSize: 13,
          fontWeight: 600,
          fontFamily: tokens.fontSans,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          boxShadow: "0 1px 4px rgba(0,0,0,.05)",
          transition: "transform .15s, border-color .15s, color .15s",
          whiteSpace: "nowrap",
          "&:hover": disabled ? {} : { transform: "translateY(-1px)", color: planned ? "#fff" : tokens.blueDeep, borderColor: tokens.blueDeep },
        }}
      >
        <PlanIcon size={14} planned={planned} />
        {planned ? "Planned" : "Plan"}
      </Box>
    ) : (
      <Box
        component="button"
        type="button"
        onClick={openMenu}
        disabled={disabled}
        aria-label={planned ? "In a planner — add to another" : "Add to planner"}
        aria-pressed={planned}
        sx={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: planned ? "none" : `1px solid ${tokens.rule}`,
          background: planned ? tokens.blueDeep : "transparent",
          color: planned ? "#fff" : tokens.ink3,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          display: "grid",
          placeItems: "center",
          transition: "all .15s",
          "&:hover": disabled ? {} : { color: planned ? "#fff" : tokens.blueDeep, borderColor: tokens.blueDeep },
        }}
      >
        <PlanIcon size={16} planned={planned} />
      </Box>
    );

  return (
    <>
      {disabled ? (
        <Tooltip title="Saving… try again in a moment">
          <span>{trigger}</span>
        </Tooltip>
      ) : planned ? (
        <Tooltip title={`In ${inPlanners.map((p) => p.name).join(", ")}`}>
          {trigger}
        </Tooltip>
      ) : (
        trigger
      )}

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 220, borderRadius: "12px" } } }}
      >
        <MenuItem disabled sx={{ fontSize: 12, color: tokens.ink3, opacity: 1 }}>
          {done ? `Added to ${done} ✓` : "Add to planner"}
        </MenuItem>
        <Divider />
        {planners.map((p) => {
          const has = plannedIds.has(p.id);
          return (
            <MenuItem key={p.id} onClick={() => addTo(p.id, p.name)} sx={{ fontSize: 14 }}>
              {p.name}
              <Box
                component="span"
                sx={{
                  ml: "auto",
                  pl: 2,
                  color: has ? tokens.blueDeep : tokens.ink3,
                  fontSize: 12,
                  fontWeight: has ? 700 : 400,
                }}
              >
                {has ? "✓ In" : p.itemCount}
              </Box>
            </MenuItem>
          );
        })}
        {planners.length > 0 && <Divider />}
        <MenuItem onClick={openNameDialog} sx={{ fontSize: 14, fontWeight: 600, color: tokens.blueDeep }}>
          + New planner…
        </MenuItem>
      </Menu>

      <Dialog
        open={nameDialogOpen}
        onClose={closeNameDialog}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { backgroundColor: tokens.bgElev, borderRadius: "22px", border: `1px solid ${tokens.rule}` } } }}
      >
        <DialogTitle sx={{ fontSize: 18, fontWeight: 700, color: tokens.ink }}>
          New planner
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Planner name"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                createAndAdd();
              }
            }}
            disabled={busy}
            variant="outlined"
            size="small"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeNameDialog} disabled={busy} sx={{ color: tokens.ink2, textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={createAndAdd}
            disabled={busy || !draftName.trim()}
            variant="contained"
            sx={{ textTransform: "none", fontWeight: 600, backgroundColor: tokens.blueDeep, "&:hover": { backgroundColor: tokens.blueDeep } }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={() => setAuthOpen(false)}
        reason="Sign in to start planning this purchase — we'll keep it with your planner."
      />
    </>
  );
}

/** Calendar with a "+" (add) or "✓" (already planned), shared by both variants. */
function PlanIcon({ size, planned }: { size: number; planned?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9.5h18" />
      <path d="M8 2.5v4M16 2.5v4" />
      {planned ? <path d="M9 15l2 2 4-4" /> : <path d="M12 13v4.5M9.75 15.25h4.5" />}
    </svg>
  );
}
