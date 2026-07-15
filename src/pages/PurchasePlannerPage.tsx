import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography, MenuItem, Select } from "@mui/material";
import { tokens } from "@/config/theme";
import type { PlannerItem, PlannerMeta, PlannerSummary } from "@/types/planner";
import {
  listPlanners,
  getPlannerPlan,
  createPlanner,
  updatePlanner,
  deletePlanner,
  removePlannerItem,
} from "@/services/api/planner";
import { PlannerSummaryBanner } from "@/components/planner/PlannerSummaryBanner";
import { PlannerRow } from "@/components/planner/PlannerRow";
import { PromptDialog, ConfirmDialog } from "@/components/planner/PlannerDialogs";
import { usePlannerMembership } from "@/context/PlannerMembershipContext";

/**
 * /planner — Purchase Planner.
 *
 * A user owns named planners; items are added explicitly (from Saved Finds),
 * so a planner shows only what the user put in it. This page lists the user's
 * planners in a switcher, lets them create / rename / re-budget / delete a
 * planner, and renders the selected planner's buy-now / wait plan + summary.
 */

type TabKey = "all" | "buy" | "wait";
type SortKey = "recommended" | "savings" | "soonest" | "name";

const SORT_LABELS: Record<SortKey, string> = {
  recommended: "Recommended",
  savings: "Biggest savings",
  soonest: "Soonest",
  name: "Name",
};

// Lower sorts earlier when ordering by "soonest". "Now" beats named events.
const TIME_RANK: Record<string, number> = {
  Now: 0,
  "Labor Day": 1,
  "Black Friday": 2,
};

const EMPTY_SUMMARY: PlannerSummary = {
  totalBudget: 0,
  currentTotal: 0,
  totalSavings: 0,
  buyNowCount: 0,
  waitCount: 0,
  onTrackPercent: 0,
};

export function PurchasePlannerPage() {
  const { markRemoved, reload: reloadMemberships } = usePlannerMembership();
  const [planners, setPlanners] = useState<PlannerMeta[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [items, setItems] = useState<PlannerItem[]>([]);
  const [summary, setSummary] = useState<PlannerSummary>(EMPTY_SUMMARY);
  const [planner, setPlanner] = useState<PlannerMeta | null>(null);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<TabKey>("all");
  const [sort, setSort] = useState<SortKey>("recommended");

  // Which management modal is open (replaces the old window.prompt/confirm).
  type DialogKind = "create" | "rename" | "budget" | "delete";
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const closeDialog = () => setDialog(null);

  // Load the planner list; keep/repair the selection so it always points at a
  // real planner (first one by default).
  const refreshPlanners = useCallback(async (preferId?: number) => {
    const list = await listPlanners().catch(() => [] as PlannerMeta[]);
    setPlanners(list);
    setSelectedId((current) => {
      const want = preferId ?? current;
      if (want != null && list.some((p) => p.id === want)) return want;
      return list[0]?.id ?? null;
    });
    return list;
  }, []);

  useEffect(() => {
    refreshPlanners().finally(() => setLoading(false));
  }, [refreshPlanners]);

  // Load the selected planner's plan whenever the selection changes.
  const reloadPlan = useCallback(async (id: number) => {
    const plan = await getPlannerPlan(id).catch(() => null);
    if (!plan) return;
    setItems(plan.items);
    setSummary(plan.summary);
    setPlanner(plan.planner);
  }, []);

  useEffect(() => {
    if (selectedId == null) {
      setItems([]);
      setSummary(EMPTY_SUMMARY);
      setPlanner(null);
      return;
    }
    reloadPlan(selectedId);
  }, [selectedId, reloadPlan]);

  const handleCreate = async (name: string) => {
    closeDialog();
    const created = await createPlanner(name).catch(() => null);
    if (created) await refreshPlanners(created.id);
  };

  const handleRename = async (name: string) => {
    closeDialog();
    if (!planner || name === planner.name) return;
    const updated = await updatePlanner(planner.id, { name }).catch(() => null);
    if (updated) {
      setPlanner(updated);
      await refreshPlanners(updated.id);
    }
  };

  const handleBudget = async (raw: string) => {
    closeDialog();
    if (!planner) return;
    const totalBudget = Number(raw.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(totalBudget) || totalBudget <= 0) return;
    const updated = await updatePlanner(planner.id, { totalBudget }).catch(() => null);
    if (updated && selectedId != null) {
      setPlanner(updated);
      await reloadPlan(selectedId); // budget feeds the summary ring
      await refreshPlanners(updated.id);
    }
  };

  const handleDelete = async () => {
    closeDialog();
    if (!planner) return;
    await deletePlanner(planner.id).catch(() => null);
    await refreshPlanners();
    reloadMemberships(); // the planner's links are gone — refresh planned state
  };

  // Per-planner CTAs — optimistic, persisted via PATCH.
  const handleFollowPlan = () => {
    if (!planner) return;
    const next = !planner.following;
    setPlanner({ ...planner, following: next });
    updatePlanner(planner.id, { following: next }).catch(() => {});
  };

  const handleAlertMe = () => {
    if (!planner) return;
    const next = !planner.alertsEnabled;
    setPlanner({ ...planner, alertsEnabled: next });
    updatePlanner(planner.id, { alertsEnabled: next }).catch(() => {});
  };

  const handleRemoveItem = async (itemId: string) => {
    if (selectedId == null) return;
    const numericId = Number(itemId);
    setItems((prev) => prev.filter((it) => it.id !== itemId)); // optimistic
    markRemoved(numericId, selectedId); // keep Add-to-Planner state in sync
    await removePlannerItem(selectedId, numericId).catch(() => {});
    await reloadPlan(selectedId);
    setPlanners((prev) =>
      prev.map((p) =>
        p.id === selectedId ? { ...p, itemCount: Math.max(0, p.itemCount - 1) } : p,
      ),
    );
  };

  const counts = useMemo(
    () => ({
      all: items.length,
      buy: items.filter((it) => it.action === "buy").length,
      wait: items.filter((it) => it.action === "wait").length,
    }),
    [items],
  );

  const visible = useMemo(() => {
    let list: PlannerItem[];
    switch (tab) {
      case "buy":
        list = items.filter((it) => it.action === "buy");
        break;
      case "wait":
        list = items.filter((it) => it.action === "wait");
        break;
      default:
        list = items;
    }

    const sorted = [...list];
    switch (sort) {
      case "savings":
        sorted.sort((a, b) => b.savings - a.savings);
        break;
      case "soonest":
        sorted.sort(
          (a, b) =>
            (TIME_RANK[a.bestTimeLabel] ?? 99) - (TIME_RANK[b.bestTimeLabel] ?? 99),
        );
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "recommended":
      default:
        // Buy-now first, then largest savings — the "do this next" order.
        sorted.sort((a, b) => {
          if (a.action !== b.action) return a.action === "buy" ? -1 : 1;
          return b.savings - a.savings;
        });
    }
    return sorted;
  }, [items, tab, sort]);

  const TABS: { key: TabKey; label: string }[] = [
    { key: "all", label: `All Items (${counts.all})` },
    { key: "buy", label: `Buy Now (${counts.buy})` },
    { key: "wait", label: `Wait (${counts.wait})` },
  ];

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
      {/* Planner switcher + management actions */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { sm: "center" },
          justifyContent: "space-between",
          gap: 1.5,
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
          <Typography sx={{ fontSize: 13, color: tokens.ink2, whiteSpace: "nowrap" }}>
            Planner
          </Typography>
          <Select
            value={planners.length && selectedId != null ? String(selectedId) : ""}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            size="small"
            displayEmpty
            disabled={!planners.length}
            renderValue={(v) =>
              v
                ? planners.find((p) => p.id === Number(v))?.name ?? "Select"
                : "No planners yet"
            }
            sx={{
              minWidth: 220,
              borderRadius: 999,
              backgroundColor: tokens.bgElev,
              fontSize: 14,
              fontWeight: 600,
              "& fieldset": { borderColor: tokens.rule },
            }}
          >
            {planners.map((p) => (
              <MenuItem key={p.id} value={String(p.id)}>
                {p.name} ({p.itemCount})
              </MenuItem>
            ))}
          </Select>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <ActionButton onClick={() => setDialog("create")} primary>
            + New planner
          </ActionButton>
          {planner && (
            <>
              <ActionButton onClick={() => setDialog("rename")}>Rename</ActionButton>
              <ActionButton onClick={() => setDialog("budget")}>Budget</ActionButton>
              <ActionButton onClick={() => setDialog("delete")} danger>
                Delete
              </ActionButton>
            </>
          )}
        </Box>
      </Box>

      {loading ? null : planners.length === 0 ? (
        <EmptyPlanners onCreate={() => setDialog("create")} />
      ) : (
        <>
          <PlannerSummaryBanner
            summary={summary}
            following={planner?.following ?? false}
            alerting={planner?.alertsEnabled ?? false}
            onFollowPlan={handleFollowPlan}
            onAlertMe={handleAlertMe}
          />

          {/* Filter tabs + sort */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { sm: "center" },
              justifyContent: "space-between",
              gap: 1.5,
              mb: 2.5,
            }}
          >
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {TABS.map((t) => {
                const active = tab === t.key;
                return (
                  <Box
                    key={t.key}
                    component="button"
                    onClick={() => setTab(t.key)}
                    sx={{
                      border: `1px solid ${active ? tokens.greenDeep : tokens.rule}`,
                      backgroundColor: active ? tokens.greenDeep : tokens.bgElev,
                      color: active ? "#fff" : tokens.ink2,
                      fontFamily: tokens.fontSans,
                      fontSize: 13.5,
                      fontWeight: active ? 700 : 500,
                      padding: "8px 16px",
                      borderRadius: 999,
                      cursor: "pointer",
                      transition: "all .15s",
                      "&:hover": active ? {} : { borderColor: tokens.ink3, color: tokens.ink },
                    }}
                  >
                    {t.label}
                  </Box>
                );
              })}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontSize: 13, color: tokens.ink2, whiteSpace: "nowrap" }}>
                Sort by
              </Typography>
              <Select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                size="small"
                sx={{
                  minWidth: 180,
                  borderRadius: 999,
                  backgroundColor: tokens.bgElev,
                  fontSize: 14,
                  "& fieldset": { borderColor: tokens.rule },
                }}
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                  <MenuItem key={k} value={k}>
                    {SORT_LABELS[k]}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </Box>

          {/* Column header (md only) */}
          <Box
            sx={{
              display: { xs: "none", md: "grid" },
              gridTemplateColumns:
                "minmax(220px, 1.6fr) minmax(180px, 1.4fr) minmax(150px, 1fr) 100px 28px",
              gap: 2,
              px: 2,
              mb: 1,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: tokens.ink3,
            }}
          >
            <Box>Item</Box>
            <Box>Recommendation</Box>
            <Box>Best Time to Buy</Box>
            <Box sx={{ textAlign: "right" }}>You'll Save</Box>
            <Box />
          </Box>

          {/* List */}
          {visible.length === 0 ? (
            <Box
              sx={{
                textAlign: "center",
                py: 6,
                color: tokens.ink2,
                backgroundColor: tokens.bgElev,
                border: `1px dashed ${tokens.rule}`,
                borderRadius: "18px",
              }}
            >
              <Typography sx={{ fontSize: 15 }}>
                Nothing here yet — add items to this planner from your Saved Finds.
              </Typography>
            </Box>
          ) : (
            <Box
              component="ul"
              sx={{
                listStyle: "none",
                p: 0,
                m: 0,
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              {visible.map((item) => (
                <PlannerRow
                  key={item.id}
                  item={item}
                  onRemove={() => handleRemoveItem(item.id)}
                />
              ))}
            </Box>
          )}
        </>
      )}

      {/* Footer */}
      <Box
        sx={{
          mt: 4,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: 1.25,
          fontSize: 13,
          color: tokens.ink3,
        }}
      >
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
          <svg
            viewBox="0 0 24 24"
            width={15}
            height={15}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          </svg>
          We do the research. You save money.
        </Box>
        <Box
          component="span"
          sx={{ width: "1px", height: 12, backgroundColor: tokens.rule }}
        />
        <Box component="span">Price history data powered by Keepa</Box>
      </Box>

      {/* Management modals — replace native prompt/confirm */}
      <PromptDialog
        open={dialog === "create"}
        title="New planner"
        label="Planner name"
        initialValue="My Planner"
        confirmLabel="Create"
        onCancel={closeDialog}
        onConfirm={handleCreate}
      />
      <PromptDialog
        open={dialog === "rename"}
        title="Rename planner"
        label="Planner name"
        initialValue={planner?.name ?? ""}
        confirmLabel="Rename"
        onCancel={closeDialog}
        onConfirm={handleRename}
      />
      <PromptDialog
        open={dialog === "budget"}
        title="Set budget"
        label="Budget ($)"
        initialValue={planner ? String(planner.totalBudget) : ""}
        confirmLabel="Save"
        numeric
        onCancel={closeDialog}
        onConfirm={handleBudget}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        title="Delete planner"
        message={`Delete planner "${planner?.name ?? ""}"? This can't be undone.`}
        confirmLabel="Delete"
        danger
        onCancel={closeDialog}
        onConfirm={handleDelete}
      />
    </Box>
  );
}

/** Small pill button used for the planner management actions. */
function ActionButton({
  children,
  onClick,
  primary,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
}) {
  const color = danger ? "#C0392B" : primary ? "#fff" : tokens.ink2;
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        border: `1px solid ${primary ? tokens.greenDeep : tokens.rule}`,
        backgroundColor: primary ? tokens.greenDeep : tokens.bgElev,
        color,
        fontFamily: tokens.fontSans,
        fontSize: 13.5,
        fontWeight: primary ? 700 : 600,
        padding: "8px 14px",
        borderRadius: 999,
        cursor: "pointer",
        transition: "all .15s",
        "&:hover": {
          borderColor: danger ? "#C0392B" : tokens.ink3,
          ...(primary ? { backgroundColor: "#4AA33D" } : {}),
        },
      }}
    >
      {children}
    </Box>
  );
}

/** Shown when the user has no planners yet. */
function EmptyPlanners({ onCreate }: { onCreate: () => void }) {
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
      <Typography
        component="h1"
        sx={{
          fontFamily: tokens.fontSerif,
          fontSize: { xs: 24, sm: 30 },
          fontWeight: 500,
          color: tokens.ink,
          mb: 1,
        }}
      >
        Start your first planner
      </Typography>
      <Typography sx={{ fontSize: 15, color: tokens.ink2, mb: 3, maxWidth: 460, mx: "auto" }}>
        A planner tracks the items you're deciding on and tells you whether to buy
        now or wait for a better price. Add items to it from your Saved Finds.
      </Typography>
      <Box sx={{ display: "inline-block" }}>
        <ActionButton onClick={onCreate} primary>
          + Create a planner
        </ActionButton>
      </Box>
    </Box>
  );
}
