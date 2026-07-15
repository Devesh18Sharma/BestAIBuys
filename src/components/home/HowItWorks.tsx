import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { tokens } from "@/config/theme";

const STEPS = [
  {
    num: "01",
    title: "Tell us what you need",
    body: "We'll ask a few follow-up questions to help narrow it down.",
    visual: "type" as const,
  },
  {
    num: "02",
    title: "We find 3 best picks",
    body: "Reviews, expert roundups, popularity, return rates — distilled into three tiers you'd actually consider.",
    visual: "scan" as const,
  },
  {
    num: "03",
    title: "You save time and money",
    body: "Shop smarter and feel good about your new purchase and savings.",
    visual: "price" as const,
  },
];

/**
 * "How it works" 3-card grid. Mirrors how.jsx — including the animated
 * "typing", "scanning sources", and "price comparison" micro-visuals
 * inside each card.
 */
export function HowItWorks() {
  return (
    <Box
      component="section"
      sx={{
        px: { xs: 3, sm: 5 },
        py: { xs: 4, sm: 6 },
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Eyebrow>How it works</Eyebrow>
        {/* BES-3: anchor the URL fragment to the HEADING, not the
            section. scrollMarginTop on the heading lifts it just below
            the sticky AppBar (~62px tall) with a small breathing
            margin — that puts "Smart picks. Best buy." right at the
            visible top instead of 150px of cream above it. The eyebrow
            sits behind the header band, which is fine — it's
            decorative context, not the destination. */}
        <Typography
          component="h2"
          id="how"
          sx={{
            fontFamily: tokens.fontSerif,
            fontSize: { xs: "clamp(36px, 7vw, 56px)", sm: "clamp(40px, 5.4vw, 72px)" },
            fontWeight: 600,
            lineHeight: 1.02,
            letterSpacing: "-0.025em",
            mt: 2,
            mb: 0,
            maxWidth: "16ch",
            scrollMarginTop: { xs: "76px", sm: "84px" },
          }}
        >
          Smart picks.{" "}
          <Box component="span" sx={{ color: tokens.greenDeep, fontStyle: "italic" }}>
            Best buy.
          </Box>
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: 16, sm: 19 },
            color: tokens.ink2,
            maxWidth: "60ch",
            mt: 3,
            lineHeight: 1.55,
          }}
        >
          Skip the 47-tab comparison spiral. Tell BestAIBuys what you need, we ask a few
          follow-up questions, read the reviews, weigh popularity, and chase the lowest
          live price across retailers — so you can buy with confidence, fast.
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 3,
            mt: 8,
          }}
        >
          {STEPS.map((s) => (
            <Box
              key={s.num}
              sx={{
                backgroundColor: tokens.bgElev,
                borderRadius: tokens.radiusLg + "px",
                p: { xs: 3.5, sm: "36px 32px 32px" },
                border: `1px solid ${tokens.rule}`,
                display: "flex",
                flexDirection: "column",
                minHeight: 320,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  fontFamily: tokens.fontSerif,
                  fontSize: 56,
                  fontWeight: 600,
                  lineHeight: 1,
                  color: tokens.greenDeep,
                  letterSpacing: "-0.04em",
                }}
              >
                {s.num}
              </Box>
              <Typography
                sx={{
                  fontSize: 22,
                  fontWeight: 600,
                  mt: 3,
                  mb: 1,
                  letterSpacing: "-0.01em",
                  color: tokens.ink,
                }}
              >
                {s.title}
              </Typography>
              <Typography sx={{ fontSize: 15, color: tokens.ink2, lineHeight: 1.55 }}>
                {s.body}
              </Typography>
              <Box sx={{ mt: "auto", pt: 3.5 }}>
                {s.visual === "type" && <TypingVisual />}
                {s.visual === "scan" && <ScanVisual />}
                {s.visual === "price" && <PriceVisual />}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        fontSize: 13,
        fontWeight: 500,
        color: tokens.ink2,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      <Box sx={{ width: 24, height: "1px", backgroundColor: tokens.ink3 }} />
      {children}
    </Box>
  );
}

function TypingVisual() {
  const target = "a quiet stand mixer…";
  const [text, setText] = useState("");

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % (target.length + 14);
      setText(target.slice(0, Math.min(i, target.length)));
    }, 140);
    return () => clearInterval(id);
  }, []);

  return (
    <Box
      sx={{
        backgroundColor: tokens.bg,
        borderRadius: "14px",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        fontSize: 14,
        color: tokens.ink,
        border: `1px solid ${tokens.rule}`,
      }}
    >
      <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: tokens.green }} />
      <Box
        component="span"
        sx={{ fontFamily: tokens.fontSerif, fontStyle: "italic" }}
      >
        {text}
        <Box
          component="span"
          sx={{
            borderRight: `2px solid ${tokens.ink}`,
            ml: "1px",
            animation: "typeBlink 1s step-end infinite",
            "@keyframes typeBlink": { "50%": { borderColor: "transparent" } },
          }}
        >
          &nbsp;
        </Box>
      </Box>
    </Box>
  );
}

function ScanVisual() {
  const sources = ["Reviews", "Wirecutter", "Reddit", "Specs", "Returns"];
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
      {sources.map((s, i) => (
        <Box
          key={s}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            color: tokens.ink2,
            padding: "8px 12px",
            backgroundColor: tokens.bg,
            borderRadius: "8px",
            border: `1px solid ${tokens.rule}`,
          }}
        >
          <Box component="span">{s}</Box>
          <Box
            sx={{
              display: "inline-block",
              width: 60,
              height: 4,
              backgroundColor: tokens.rule,
              borderRadius: 4,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                backgroundColor: tokens.green,
                animation: `scanFill ${1.2 + i * 0.2}s ${i * 0.15}s ease-out forwards`,
                transformOrigin: "left",
                transform: "scaleX(0)",
                "@keyframes scanFill": { to: { transform: "scaleX(1)" } },
              }}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function PriceVisual() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: tokens.green,
          color: tokens.ink,
          padding: "10px 14px",
          borderRadius: "10px",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        <span>Amazon</span>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              fontSize: 10,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              backgroundColor: tokens.ink,
              color: tokens.green,
              padding: "2px 7px",
              borderRadius: 999,
            }}
          >
            Lowest
          </Box>
          <Box component="span" sx={{ fontVariantNumeric: "tabular-nums" }}>
            $269
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          backgroundColor: tokens.bg,
          padding: "10px 14px",
          borderRadius: "10px",
          fontSize: 13,
          border: `1px solid ${tokens.rule}`,
          color: tokens.ink2,
        }}
      >
        <span>Williams Sonoma</span>
        <Box component="span" sx={{ textDecoration: "line-through", fontVariantNumeric: "tabular-nums" }}>
          $379
        </Box>
      </Box>
    </Box>
  );
}
