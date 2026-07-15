import { useState } from "react";
import { Box, Menu, MenuItem, Typography } from "@mui/material";
import { useShoppingFlow } from "@/hooks/useShoppingFlow";
import { trackEvent } from "@/services/analytics";
import { buildShareTargets, shareText, type ShareTargetKey } from "@/utils/share";
import { ShareGlyph } from "./shareIcons";
import { tokens } from "@/config/theme";

/** Fixed-width slot so every menu label lines up regardless of glyph shape. */
function Glyph({ target }: { target: string }) {
  return (
    <Box sx={{ width: 20, mr: 1.25, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <ShareGlyph target={target} />
    </Box>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}

/**
 * Share control on the results page. Creates the `/s/:id` link once (reusing
 * `shareSearch()`), caches it, then opens a menu of targets: Copy link, the
 * native OS share sheet (mobile — the only path to Instagram), and web
 * share-intent buttons (X, Facebook, LinkedIn, WhatsApp, Telegram, Reddit,
 * Email).
 */
export function ShareMenu() {
  const { state, shareSearch } = useShoppingFlow();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "working" | "error">("idle");
  const [copied, setCopied] = useState(false);

  const text = shareText(state.query, state.productName);
  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const openMenu = async (anchor: HTMLElement) => {
    if (url) {
      setAnchorEl(anchor); // link already created — reuse it
      return;
    }
    try {
      setPhase("working");
      const created = await shareSearch();
      setUrl(created);
      setPhase("idle");
      setAnchorEl(anchor);
    } catch {
      setPhase("error");
      setTimeout(() => setPhase("idle"), 2500);
    }
  };

  const close = () => setAnchorEl(null);

  const track = (target: ShareTargetKey | "copy" | "native") =>
    trackEvent("share_click", { target, query: state.query });

  const onCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore clipboard failures */
    }
    track("copy");
  };

  const onNative = async () => {
    if (!url) return;
    try {
      await navigator.share({ title: "BestAIBuys", text, url });
    } catch {
      /* user cancelled or unsupported — no-op */
    }
    track("native");
    close();
  };

  const onWebTarget = (key: ShareTargetKey, href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
    track(key);
    close();
  };

  const targets = url ? buildShareTargets(url, text) : [];
  const triggerLabel =
    phase === "working" ? "Creating link…" : phase === "error" ? "Try again" : "Share";

  return (
    <>
      <Box
        onClick={(e) => void openMenu(e.currentTarget)}
        role="button"
        tabIndex={0}
        aria-label="Share this search"
        aria-haspopup="menu"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            void openMenu(e.currentTarget);
          }
        }}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.75,
          flexShrink: 0,
          px: "14px",
          py: "9px",
          borderRadius: 999,
          fontSize: 14,
          fontWeight: 600,
          border: `1px solid ${tokens.rule}`,
          backgroundColor: tokens.bgElev,
          color: tokens.ink,
          cursor: phase === "working" ? "default" : "pointer",
          transition: "all .15s",
          "&:hover": { borderColor: tokens.ink2 },
        }}
      >
        <ShareIcon />
        {triggerLabel}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { borderRadius: "14px", minWidth: 200, mt: 0.5 } } }}
      >
        <MenuItem onClick={onCopy} sx={{ fontSize: 14 }}>
          <Glyph target="copy" />
          {copied ? "Link copied!" : "Copy link"}
        </MenuItem>

        {canNativeShare && (
          <MenuItem onClick={onNative} sx={{ fontSize: 14 }}>
            <Glyph target="native" />
            Share…
          </MenuItem>
        )}

        <Typography
          sx={{ px: 2, pt: 1, pb: 0.5, fontSize: 11, color: tokens.ink3, textTransform: "uppercase", letterSpacing: ".06em" }}
        >
          Share to
        </Typography>

        {targets.map((tg) => (
          <MenuItem key={tg.key} onClick={() => onWebTarget(tg.key, tg.href)} sx={{ fontSize: 14 }}>
            <Glyph target={tg.key} />
            {tg.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
