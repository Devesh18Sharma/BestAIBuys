import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useShoppingFlow } from "@/hooks/useShoppingFlow";
import { getSharedSearch } from "@/services/api/client";
import { ChatShell } from "@/components/chat/ChatShell";
import { tokens } from "@/config/theme";

/**
 * `/s/:shareId` — loads a shared search snapshot and reproduces the exact page
 * the original user saw. Fetches the snapshot, hydrates it into the flow state
 * (read-only), then renders the normal ChatShell, which derives the whole page
 * from state.
 */
export function SharedSearchPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const { hydrateShared } = useShoppingFlow();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // The `/s/:shareId` route guarantees shareId; the render below handles the
    // (unreachable) missing case, so the effect only sets state asynchronously.
    if (!shareId) return;
    let cancelled = false;
    getSharedSearch(shareId)
      .then((payload) => {
        if (cancelled) return;
        hydrateShared(payload);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : "This shared search isn't available.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [shareId, hydrateShared]);

  if (status === "ready") {
    return (
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <ChatShell />
      </Box>
    );
  }

  const isError = status === "error" || !shareId;
  const message = shareId ? errorMsg : "Invalid share link.";

  return (
    <Box
      sx={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        px: 3,
        textAlign: "center",
      }}
    >
      {!isError ? (
        <>
          <CircularProgress sx={{ color: tokens.greenDeep }} />
          <Typography sx={{ fontSize: 16, color: tokens.ink2 }}>
            Loading shared search…
          </Typography>
        </>
      ) : (
        <>
          <Typography sx={{ fontFamily: tokens.fontSerif, fontSize: 28, color: tokens.ink }}>
            Shared search unavailable
          </Typography>
          <Typography sx={{ fontSize: 15, color: tokens.ink2, maxWidth: 420 }}>
            {message}
          </Typography>
        </>
      )}
    </Box>
  );
}
