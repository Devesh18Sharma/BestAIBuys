import { Box, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { tokens } from "@/config/theme";

/**
 * /privacy — BestAIBuys Privacy Policy.
 *
 * Static long-form content; no state, no data fetches. Layout follows
 * the rest of the design system (Fraunces headings, Inter body, cream
 * page) and constrains the measure to ~720px for comfortable reading.
 *
 * Source content is the policy text provided by Alex; structure here
 * just cleans the run-on lines from the original paste, gives each
 * section a stable heading id (so future deep-links like
 * /privacy#data-security work), and wires the contact email as a real
 * mailto link.
 */

const EFFECTIVE_DATE = "May 26, 2026";
const CONTACT_EMAIL = "support@bestaibuys.com";

export function PrivacyPolicyPage() {
  return (
    <Box
      component="main"
      sx={{
        maxWidth: 720,
        mx: "auto",
        px: { xs: 3, sm: 4 },
        py: { xs: 5, sm: 7 },
      }}
    >
      {/* ── Page head ── */}
      <Typography
        component="h1"
        sx={{
          fontFamily: tokens.fontSerif,
          fontSize: { xs: 36, sm: 52 },
          fontWeight: 500,
          letterSpacing: "-0.02em",
          lineHeight: 1.05,
          color: tokens.ink,
          mb: 1.5,
        }}
      >
        Privacy Policy
      </Typography>
      <Typography
        sx={{
          fontSize: 13,
          color: tokens.ink3,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          mb: { xs: 4, sm: 5 },
        }}
      >
        Effective Date · {EFFECTIVE_DATE}
      </Typography>

      <Paragraph sx={{ fontSize: 17, color: tokens.ink, mb: 5 }}>
        BestAIBuys Inc. (“BestAIBuys,” “we,” “our,” or “us”) respects your
        privacy. At this time, BestAIBuys does not collect personally
        identifiable information from users.
      </Paragraph>

      {/* ── Information We Collect ── */}
      <Section title="Information We Collect" id="information-we-collect">
        <Paragraph>
          We currently collect limited anonymous usage and diagnostic data to
          help improve app performance and user experience.
        </Paragraph>

        <SubSection title="Usage Data">
          <Paragraph>Anonymous usage data may include:</Paragraph>
          <List
            items={[
              "App launches",
              "Taps and clicks",
              "Screen interactions",
              "Feature usage",
              "General app activity",
            ]}
          />
        </SubSection>

        <SubSection title="Diagnostic Data">
          <Paragraph>Diagnostic data may include:</Paragraph>
          <List
            items={[
              "Crash logs",
              "Performance information",
              "App stability metrics",
              "Technical diagnostics",
            ]}
          />
        </SubSection>

        <Paragraph>This information is used solely to:</Paragraph>
        <List
          items={[
            "Improve app functionality",
            "Monitor app performance",
            "Fix bugs and crashes",
            "Enhance user experience",
          ]}
        />
      </Section>

      {/* ── Analytics ── */}
      <Section title="Analytics" id="analytics">
        <Paragraph>
          BestAIBuys may use third-party analytics tools to better understand
          overall app usage and improve the product. Analytics information is
          anonymous and is not used to identify individual users.
        </Paragraph>
      </Section>

      {/* ── Data Sharing ── */}
      <Section title="Data Sharing" id="data-sharing">
        <Paragraph>
          We do not sell personal data. We do not share data with advertisers
          for advertising purposes. Anonymous technical information may be
          processed by trusted service providers that help us operate and
          improve the app.
        </Paragraph>
      </Section>

      {/* ── Data Security ── */}
      <Section title="Data Security" id="data-security">
        <Paragraph>
          We use reasonable safeguards designed to protect app data and
          maintain security.
        </Paragraph>
      </Section>

      {/* ── Children's Privacy ── */}
      <Section title="Children’s Privacy" id="childrens-privacy">
        <Paragraph>
          BestAIBuys is not intended for children under the age of 13.
        </Paragraph>
      </Section>

      {/* ── Changes ── */}
      <Section title="Changes to This Policy" id="changes">
        <Paragraph>
          We may update this Privacy Policy from time to time. Updates will be
          posted within the app or on our website.
        </Paragraph>
      </Section>

      {/* ── Contact ── */}
      <Section title="Contact Us" id="contact">
        <Paragraph sx={{ mb: 0.5 }}>BestAIBuys Inc.</Paragraph>
        <Paragraph sx={{ mb: 0 }}>
          Email:{" "}
          <Box
            component="a"
            href={`mailto:${CONTACT_EMAIL}`}
            sx={{
              color: tokens.greenDeep,
              fontWeight: 500,
              textDecoration: "underline",
              textUnderlineOffset: "3px",
              "&:hover": { color: tokens.ink },
            }}
          >
            {CONTACT_EMAIL}
          </Box>
        </Paragraph>
      </Section>

      {/* Return link — keeps the keyboard/screen-reader path obvious
          even though the global AppBar wordmark also navigates home. */}
      <Box
        sx={{
          mt: { xs: 5, sm: 7 },
          pt: 3,
          borderTop: `1px solid ${tokens.rule}`,
          fontSize: 13,
        }}
      >
        <Box
          component={RouterLink}
          to="/"
          sx={{
            color: tokens.ink2,
            textDecoration: "none",
            "&:hover": { color: tokens.ink },
          }}
        >
          ← Return to BestAIBuys
        </Box>
      </Box>
    </Box>
  );
}

/* ── Internal layout primitives ────────────────────────────────────
 * Kept local to this file because nothing else in the codebase uses
 * the long-form-prose typography stack, and inlining keeps the policy
 * source readable.
 */

function Section({
  title,
  id,
  children,
}: {
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <Box component="section" sx={{ mb: { xs: 4, sm: 5 } }}>
      <Typography
        component="h2"
        id={id}
        sx={{
          fontFamily: tokens.fontSerif,
          fontSize: { xs: 22, sm: 26 },
          fontWeight: 500,
          letterSpacing: "-0.01em",
          color: tokens.ink,
          mb: 2,
          scrollMarginTop: { xs: "72px", sm: "84px" },
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        component="h3"
        sx={{
          fontFamily: tokens.fontSans,
          fontSize: { xs: 16, sm: 17 },
          fontWeight: 600,
          color: tokens.ink,
          mb: 1.25,
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function Paragraph({
  children,
  sx,
}: {
  children: React.ReactNode;
  sx?: Record<string, unknown>;
}) {
  return (
    <Typography
      sx={{
        fontSize: 16,
        color: tokens.ink2,
        lineHeight: 1.65,
        mb: 2,
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <Box
      component="ul"
      sx={{
        pl: 3,
        m: 0,
        mb: 2,
        "& li": {
          fontSize: 16,
          color: tokens.ink2,
          lineHeight: 1.6,
          mb: 0.75,
        },
      }}
    >
      {items.map((it) => (
        <Box component="li" key={it}>
          {it}
        </Box>
      ))}
    </Box>
  );
}
