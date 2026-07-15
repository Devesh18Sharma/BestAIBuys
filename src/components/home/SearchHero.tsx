import { useRef } from "react";
import { Box, Typography, TextField, InputAdornment, Tooltip } from "@mui/material";
import { tokens } from "@/config/theme";

interface SearchHeroProps {
  query: string;
  isPriceMode: boolean;
  onQueryChange: (q: string) => void;
  onSubmit: () => void;
  onPriceSearch: () => void;
  onToggleMode: () => void;
  onSelectSuggestion: (search: string) => void;
  onImageSelect: (file: File) => void;
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // matches the backend's 8MB cap

// BES-62 — hero tagline accent colours from Alex's handoff. Semantic to the
// headline (green = "best product / in seconds", amber = "best price").
const HERO_GREEN = "#42A943";
const HERO_ORANGE = "#D99A12";

// Natalya: keep only three examples.
const SUGGESTIONS = [
  { label: "earbuds for running", icon: "/sneaker.png" },
  { label: "luggage", icon: "/luggage.png" },
  { label: "a quiet stand mixer", icon: "/mixer.png" },
] as const;

// Floating product cluster — mirrors hero.jsx FLOATERS
// Anchored to the actual edges (left/right + top/bottom) so they hug the
// corners and stay spread out at any width — matching Alex's spacing.
const FLOATING_PRODUCTS: Array<{
  src: string;
  label: string;
  pos: { left?: string; right?: string; top?: string; bottom?: string };
  size: number;
  rotate: number;
}> = [
  { src: "/sneaker.png", label: "running shoes", pos: { left: "5%", top: "3%" }, size: 172, rotate: -8 },
  { src: "/bag.png", label: "green clutch", pos: { right: "4%", top: "0%" }, size: 184, rotate: 10 },
  { src: "/coffee.png", label: "organic coffee", pos: { left: "2.5%", top: "36%" }, size: 145, rotate: 6 },
  { src: "/matcha.png", label: "matcha tea", pos: { right: "3%", top: "37%" }, size: 132, rotate: -10 },
  { src: "/chair.png", label: "office chair", pos: { left: "6%", bottom: "6%" }, size: 172, rotate: 4 },
  { src: "/mixer.png", label: "stand mixer", pos: { right: "5%", bottom: "5%" }, size: 172, rotate: -6 },
];

export function SearchHero({
  query,
  isPriceMode,
  onQueryChange,
  onSubmit,
  onPriceSearch,
  onToggleMode,
  onSelectSuggestion,
  onImageSelect,
}: SearchHeroProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasQuery = query.trim().length > 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Allow re-selecting the same file later (onChange won't fire otherwise).
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      window.alert("Please choose an image file (JPEG, PNG, or WebP).");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      window.alert("That image is over 8MB. Please choose a smaller photo.");
      return;
    }
    onImageSelect(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && hasQuery) {
      isPriceMode ? onPriceSearch() : onSubmit();
    }
  };

  const handleButtonClick = () => {
    if (!hasQuery) return;
    isPriceMode ? onPriceSearch() : onSubmit();
  };

  const handlePriceLinkClick = () => {
    onToggleMode();
    if (!isPriceMode && hasQuery) {
      onPriceSearch();
    } else if (!isPriceMode) {
      inputRef.current?.focus();
    }
  };

  // Scroll cue → the "How it works" section. Uses scrollIntoView (not
  // window.scrollBy) because the real scroll container is the app's <main>,
  // not the window. Honours prefers-reduced-motion.
  const handleScrollDown = () => {
    const el = document.getElementById("how");
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        // Fills the viewport but content is TOP-ALIGNED (flex-start) so there's
        // no dead gap under the nav. Products are edge/corner-anchored so they
        // hug all four corners at full height.
        justifyContent: "flex-start",
        textAlign: "center",
        // Full viewport height only where the corner products render (md+).
        // Below md they're hidden, so a full-height hero would just be a tall
        // empty band — size to content there instead.
        minHeight: { xs: "auto", md: "calc(100vh - 84px)" },
        pt: { xs: 5, sm: "56px" },
        pb: { xs: 6, sm: "56px" },
        px: { xs: 2.5, sm: 5 },
        overflow: "hidden",
        // Natalya: one solid colour matching the top nav (no gradient) —
        // tokens.bg is the page/nav cream, so the hero blends seamlessly.
        backgroundColor: tokens.bg,
      }}
    >
      {/* Floating product cluster — hidden on small screens */}
      <Box sx={{ display: { xs: "none", md: "block" }, position: "absolute", inset: 0, pointerEvents: "none" }}>
        {FLOATING_PRODUCTS.map((p, i) => (
          <Box
            key={p.label}
            onClick={() => onSelectSuggestion(p.label)}
            sx={{
              position: "absolute",
              ...p.pos,
              width: p.size,
              height: p.size,
              cursor: "pointer",
              pointerEvents: "auto",
              filter: "drop-shadow(0 18px 28px rgba(38,38,37,0.12))",
              transform: `rotate(${p.rotate}deg)`,
              animation: `float${i % 3} ${6 + i * 0.4}s ${i * -0.6}s ease-in-out infinite`,
              transition: "transform .35s cubic-bezier(.2,.8,.2,1)",
              "&:hover": { transform: `rotate(${p.rotate}deg) scale(1.06)` },
              "@keyframes float0": {
                "0%, 100%": { translate: "0 0" },
                "50%": { translate: "0 -12px" },
              },
              "@keyframes float1": {
                "0%, 100%": { translate: "0 -6px" },
                "50%": { translate: "0 8px" },
              },
              "@keyframes float2": {
                "0%, 100%": { translate: "0 6px" },
                "50%": { translate: "0 -10px" },
              },
            }}
            aria-label={`Search for ${p.label}`}
          >
            <Box
              component="img"
              src={p.src}
              alt=""
              sx={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }}
            />
          </Box>
        ))}
      </Box>

      {/* Tri-colour tagline — Alex's hero headline (BES-62). Reimplemented in
          the design-system serif (Fraunces), not the export's Georgia. */}
      <Typography
        component="h1"
        sx={{
          fontFamily: tokens.fontSerif,
          fontWeight: 500,
          color: tokens.ink,
          // Natalya: shorter headline, NO hard line breaks — the wrap to ~3
          // balanced lines is controlled purely by maxWidth.
          fontSize: { xs: "clamp(30px, 8vw, 40px)", sm: "clamp(34px, 4.4vw, 56px)" },
          lineHeight: { xs: 1.28, sm: 1.18 },
          letterSpacing: "-0.01em",
          maxWidth: { xs: 540, sm: 780 },
          // Nudge the headline lower (mt) while removing the same amount below
          // (mb) so the search-bar cluster stays exactly where it is.
          mt: { xs: 3, sm: 5 },
          mb: { xs: 2, sm: 9 },
          position: "relative",
          zIndex: 2,
        }}
      >
        Find the{" "}
        <Box component="span" sx={{ color: HERO_GREEN }}>
          best product
        </Box>
        {/* Desktop-only breaks give Natalya's exact 3-line wrap; hidden on
            mobile where max-width handles the wrap (no awkward hard breaks). */}
        <Box component="br" sx={{ display: { xs: "none", sm: "block" } }} />{" "}
        without hours of research,
        <Box component="br" sx={{ display: { xs: "none", sm: "block" } }} />{" "}
        <Box
          component="span"
          sx={{
            color: HERO_GREEN,
            fontStyle: "italic",
            position: "relative",
            whiteSpace: "nowrap",
            // Hand-drawn underline swash under "in seconds".
            "&::after": {
              content: '""',
              position: "absolute",
              left: "2%",
              right: "2%",
              bottom: { xs: -6, sm: -9 },
              height: { xs: 8, sm: 11 },
              borderBottom: `3px solid ${HERO_GREEN}`,
              borderRadius: "50%",
              opacity: 0.8,
            },
          }}
        >
          in seconds
        </Box>{" "}
        at the{" "}
        <Box component="span" sx={{ color: HERO_ORANGE }}>
          best price
        </Box>
        .
      </Typography>

      {/* Search input */}
      <Box
        sx={{
          width: "100%",
          maxWidth: { xs: "100%", sm: 900, md: 1020 },
          // Small gap so "Know the exact model?" sits right beneath the bar.
          mb: { xs: 1.25, sm: 1.5 },
          position: "relative",
          zIndex: 3,
        }}
      >
        <TextField
          variant="outlined"
          fullWidth
          inputRef={inputRef}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isPriceMode
              ? "Enter exact product name, e.g. Sony WH-1000XM5…"
              : "a quiet stand mixer under $400…"
          }
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Box
                  component="svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={tokens.greenDeep}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  sx={{ mr: 0.75 }}
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </Box>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  {/* Search by photo — camera icon with tooltip */}
                  <Tooltip title="Search by photo" arrow placement="top">
                    <Box
                      role="button"
                      aria-label="Search by photo"
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        width: { xs: 42, sm: 46 },
                        height: { xs: 42, sm: 46 },
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                        color: tokens.greenDeep,
                        transition: "background .15s ease, color .15s ease",
                        flexShrink: 0,
                        "&:hover": {
                          backgroundColor: `color-mix(in oklab, ${tokens.green} 16%, transparent)`,
                          color: tokens.ink,
                        },
                      }}
                    >
                      <Box
                        component="svg"
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
                        <circle cx="12" cy="13" r="3.5" />
                      </Box>
                    </Box>
                  </Tooltip>

                  <Box
                    role="button"
                    aria-label="Search"
                    onClick={handleButtonClick}
                    sx={{
                      width: { xs: 48, sm: 54 },
                      height: { xs: 48, sm: 54 },
                      borderRadius: "50%",
                      backgroundColor: tokens.green,
                      display: "grid",
                      placeItems: "center",
                      cursor: hasQuery ? "pointer" : "default",
                      transition: "background .15s ease, transform .15s ease",
                      flexShrink: 0,
                      "&:hover": {
                        backgroundColor: hasQuery ? tokens.greenDeep : tokens.green,
                        transform: hasQuery ? "scale(1.04)" : "none",
                      },
                    }}
                  >
                    <Box
                      component="svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 12h15M13 6l6 6-6 6" />
                    </Box>
                  </Box>
                </Box>
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "999px",
              fontSize: { xs: 16, sm: 21 },
              backgroundColor: tokens.bgElev,
              pl: { xs: 3, sm: 4 },
              pr: { xs: 1, sm: 1.5 },
              boxShadow: tokens.shadowMd,
              "& fieldset": { borderColor: "transparent", borderWidth: "1px" },
              "&:hover fieldset": { borderColor: tokens.rule },
              "&.Mui-focused fieldset": { borderColor: tokens.ink, borderWidth: "1px" },
              "&.Mui-focused": { boxShadow: tokens.shadowLg },
            },
            "& .MuiOutlinedInput-input": {
              // Big hero pill, but not oversized — ~40% shorter than before.
              padding: { xs: "16px 0", sm: "25px 14px" },
              color: tokens.ink,
              "&::placeholder": { color: tokens.greenDeep, opacity: 0.6 },
            },
          }}
        />
      </Box>

      {/* Mode toggle */}
      <Typography
        component="span"
        onClick={handlePriceLinkClick}
        sx={{
          fontSize: 13.5,
          color: isPriceMode ? tokens.greenDeep : tokens.ink2,
          fontWeight: 500,
          cursor: "pointer",
          transition: "color .15s",
          "&:hover": { color: tokens.ink },
          mb: 3.5,
          position: "relative",
          zIndex: 3,
        }}
      >
        {isPriceMode
          ? "← Back to recommendations"
          : "Know the exact model? Price check →"}
      </Typography>

      {/* Hidden file input — triggered by the camera icon inside the search bar */}
      <Box
        component="input"
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        sx={{ display: "none" }}
      />

      {/* "Try:" suggestion chips */}
      {!isPriceMode && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: 1,
            // Nudge the chips lower, into the open space beneath the bar.
            mt: { xs: 4, sm: 12 },
            position: "relative",
            zIndex: 3,
          }}
        >
          <Typography sx={{ fontSize: 13.5, color: tokens.ink2, mr: 0.5 }}>Try:</Typography>
          {SUGGESTIONS.map((item) => (
            <Box
              key={item.label}
              role="button"
              tabIndex={0}
              aria-label={`Search for ${item.label}`}
              onClick={() => onSelectSuggestion(item.label)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectSuggestion(item.label);
                }
              }}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                px: "14px",
                py: "8px",
                borderRadius: 999,
                backgroundColor: tokens.bgElev,
                border: `1px solid ${tokens.rule}`,
                fontSize: 13.5,
                color: tokens.ink,
                cursor: "pointer",
                transition: "all .15s ease",
                userSelect: "none",
                outline: "none",
                "&:hover, &:focus-visible": {
                  backgroundColor: tokens.ink,
                  color: "#FFFFFF",
                  borderColor: tokens.ink,
                },
              }}
            >
              <Box
                component="img"
                src={item.icon}
                alt=""
                sx={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover" }}
              />
              {item.label}
            </Box>
          ))}
        </Box>
      )}

      {/* Scroll cue — makes it clear there's more below the fold (Alex's note). */}
      <Box
        role="button"
        aria-label="Scroll down to see how it works"
        tabIndex={0}
        onClick={handleScrollDown}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleScrollDown();
          }
        }}
        sx={{
          display: { xs: "none", sm: "flex" },
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.5,
          color: tokens.ink3,
          cursor: "pointer",
          zIndex: 3,
          outline: "none",
          transition: "color .15s",
          "&:hover, &:focus-visible": { color: tokens.ink },
        }}
      >
        <Typography
          sx={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 600 }}
        >
          See how it works
        </Typography>
        <Box
          component="svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          sx={{
            // Size via sx so it's actually 14px (svg width/height attrs on a MUI
            // Box don't reliably constrain it — that's why it rendered huge).
            width: 14,
            height: 14,
            animation: "heroScrollBob 1.8s ease-in-out infinite",
            "@keyframes heroScrollBob": {
              "0%, 100%": { transform: "translateY(0)" },
              "50%": { transform: "translateY(3px)" },
            },
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </Box>
      </Box>
    </Box>
  );
}
