import { useState, type FormEvent } from "react";
import { Box, Typography, TextField, Alert } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { tokens } from "@/config/theme";

/**
 * /contact — Contact BestAIBuys.
 *
 * Standalone page that mirrors the landing hero language (floating
 * product cluster + AI · live pill + serif headline) above a clean
 * form card. Form is UI-only for now: validates inline, simulates a
 * 900 ms round trip, then shows a success state. When a real
 * "/contact-us" endpoint exists, only the submit handler changes.
 *
 * Per the spec, the form intentionally omits the "Reason for
 * contacting" dropdown and the "Product link" field — the message
 * box is rich enough to capture both without forcing categorisation
 * on the user up front.
 */

const CONTACT_EMAIL = "hello@bestaibuys.com";

const FLOATING_PRODUCTS = [
  { src: "/sneaker.png", x: "6%", y: "8%", size: 110, rotate: -8 },
  { src: "/bag.png", x: "82%", y: "4%", size: 120, rotate: 10 },
  { src: "/matcha.png", x: "3%", y: "40%", size: 92, rotate: 6 },
  { src: "/chair.png", x: "8%", y: "72%", size: 110, rotate: 4 },
  { src: "/mixer.png", x: "82%", y: "70%", size: 110, rotate: -6 },
] as const;

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
  consent?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_MESSAGE_LEN = 10;

export function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!name.trim()) next.name = "Please tell us your name";
    if (!email.trim()) next.email = "Email is required";
    else if (!EMAIL_RE.test(email.trim()))
      next.email = "Enter a valid email address";
    if (!message.trim()) next.message = "Tell us a bit about what you need";
    else if (message.trim().length < MIN_MESSAGE_LEN)
      next.message = `Please write at least ${MIN_MESSAGE_LEN} characters`;
    if (!consent) next.consent = "Please tick the box to continue";
    return next;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerErr(null);
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    // Simulated round trip. When the real endpoint exists, swap this
    // for a POST to /api/contact-us with { name, email, message }.
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setSubmitted(true);
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setMessage("");
    setConsent(false);
    setErrors({});
    setServerErr(null);
    setSubmitted(false);
  };

  return (
    <Box
      sx={{
        position: "relative",
        maxWidth: 1200,
        mx: "auto",
        px: { xs: 2.5, sm: 5 },
        py: { xs: 5, sm: 7 },
      }}
    >
      {/* ── Floating product cluster — same vocabulary as the landing
            hero, scaled smaller so the form stays the centre of gravity.
            Hidden below md so the form gets the full viewport width on
            phones / narrow tablets. ── */}
      <Box
        sx={{
          display: { xs: "none", md: "block" },
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      >
        {FLOATING_PRODUCTS.map((p, i) => (
          <Box
            key={p.src}
            sx={{
              position: "absolute",
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              filter: "drop-shadow(0 18px 28px rgba(38,38,37,0.10))",
              transform: `rotate(${p.rotate}deg)`,
              animation: `contactFloat${i % 3} ${7 + i * 0.5}s ${i * -0.7}s ease-in-out infinite`,
              "@keyframes contactFloat0": {
                "0%, 100%": { translate: "0 0" },
                "50%": { translate: "0 -10px" },
              },
              "@keyframes contactFloat1": {
                "0%, 100%": { translate: "0 -5px" },
                "50%": { translate: "0 7px" },
              },
              "@keyframes contactFloat2": {
                "0%, 100%": { translate: "0 5px" },
                "50%": { translate: "0 -9px" },
              },
            }}
            aria-hidden
          >
            <Box
              component="img"
              src={p.src}
              alt=""
              sx={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </Box>
        ))}
      </Box>

      {/* ── Hero copy ── */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          mb: { xs: 4, sm: 6 },
        }}
      >
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            px: 1.75,
            py: 0.75,
            backgroundColor: tokens.bgElev,
            border: `1px solid ${tokens.rule}`,
            borderRadius: 999,
            mb: 2.5,
            fontSize: 13,
            color: tokens.ink2,
          }}
        >
          <Box
            sx={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              backgroundColor: tokens.green,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: tokens.ink,
                animation: "contactPulse 1.8s ease-out infinite",
                "@keyframes contactPulse": {
                  "0%": { boxShadow: "0 0 0 0 rgba(123,195,98,0.6)" },
                  "100%": { boxShadow: "0 0 0 8px rgba(123,195,98,0)" },
                },
              }}
            />
          </Box>
          AI shopping assistant · live
        </Box>

        <Typography
          component="h1"
          sx={{
            fontFamily: tokens.fontSerif,
            fontSize: { xs: "clamp(40px, 11vw, 64px)", sm: "clamp(56px, 8vw, 88px)" },
            fontWeight: 500,
            color: tokens.ink,
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
            mb: 2,
          }}
        >
          Contact BestAIBuys
          <Box component="span" sx={{ color: tokens.green }}>
            .
          </Box>
        </Typography>

        <Typography
          sx={{
            fontSize: { xs: 15, sm: 17 },
            color: tokens.ink2,
            lineHeight: 1.55,
            maxWidth: 520,
            mx: "auto",
          }}
        >
          Questions, partnership ideas, product issues, or retailer inquiries —
          send us a note and we'll get back to you soon.
        </Typography>
      </Box>

      {/* ── Form card ── */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          maxWidth: 560,
          mx: "auto",
          backgroundColor: tokens.bgElev,
          border: `1px solid ${tokens.rule}`,
          borderRadius: "22px",
          p: { xs: 3, sm: 4.5 },
          boxShadow: tokens.shadowMd,
        }}
      >
        {submitted ? (
          <SuccessState onReset={resetForm} />
        ) : (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {serverErr && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {serverErr}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
              }}
              error={!!errors.name}
              helperText={errors.name ?? " "}
              disabled={submitting}
              autoComplete="name"
              sx={{ mb: 0.5 }}
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email)
                  setErrors((p) => ({ ...p, email: undefined }));
              }}
              error={!!errors.email}
              helperText={errors.email ?? " "}
              disabled={submitting}
              autoComplete="email"
              sx={{ mb: 0.5 }}
            />

            <TextField
              fullWidth
              label="Message"
              multiline
              minRows={5}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message)
                  setErrors((p) => ({ ...p, message: undefined }));
              }}
              error={!!errors.message}
              helperText={
                errors.message ?? `${message.length} / ${MIN_MESSAGE_LEN}+ chars`
              }
              disabled={submitting}
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": { borderRadius: "14px" },
              }}
            />

            {/* Consent — custom checkbox so the styling matches the
                rest of the design system (not MUI's default light
                blue tick). Hidden native input keeps it accessible /
                form-bindable. */}
            <Box
              component="label"
              htmlFor="contact-consent"
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.25,
                cursor: "pointer",
                mb: errors.consent ? 0.5 : 2.5,
                userSelect: "none",
              }}
            >
              <Box
                component="input"
                id="contact-consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  if (errors.consent)
                    setErrors((p) => ({ ...p, consent: undefined }));
                }}
                disabled={submitting}
                sx={{
                  appearance: "none",
                  WebkitAppearance: "none",
                  width: 20,
                  height: 20,
                  flexShrink: 0,
                  marginTop: "2px",
                  borderRadius: "5px",
                  border: `1.5px solid ${errors.consent ? tokens.error : tokens.rule}`,
                  backgroundColor: consent ? tokens.greenDeep : "transparent",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background-color .15s, border-color .15s",
                  "&::after": consent
                    ? {
                        content: '""',
                        position: "absolute",
                        left: "5px",
                        top: "1px",
                        width: "5px",
                        height: "10px",
                        border: "solid #fff",
                        borderWidth: "0 2px 2px 0",
                        transform: "rotate(45deg)",
                      }
                    : undefined,
                  "&:focus-visible": {
                    outline: `2px solid ${tokens.greenDeep}`,
                    outlineOffset: 2,
                  },
                }}
              />
              <Typography
                component="span"
                sx={{
                  fontSize: 13.5,
                  color: tokens.ink2,
                  lineHeight: 1.5,
                }}
              >
                I agree that BestAIBuys may contact me about this inquiry.
              </Typography>
            </Box>
            {errors.consent && (
              <Typography
                sx={{
                  fontSize: 12,
                  color: tokens.error,
                  mb: 2,
                  ml: 0.5,
                }}
              >
                {errors.consent}
              </Typography>
            )}

            <Box
              component="button"
              type="submit"
              disabled={submitting}
              sx={{
                width: "100%",
                py: "16px",
                borderRadius: 999,
                border: 0,
                backgroundColor: submitting ? tokens.ink2 : tokens.greenDeep,
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: tokens.fontSans,
                letterSpacing: "0.02em",
                cursor: submitting ? "not-allowed" : "pointer",
                transition: "background-color .15s, transform .15s",
                boxShadow: submitting
                  ? "none"
                  : "0 8px 20px -8px rgba(92,186,73,0.55)",
                "&:hover": {
                  backgroundColor: submitting ? tokens.ink2 : "#4AA33D",
                  transform: submitting ? "none" : "translateY(-1px)",
                },
                "&:active": {
                  transform: submitting ? "none" : "translateY(0)",
                },
              }}
            >
              {submitting ? "Sending…" : "Send message"}
            </Box>
          </Box>
        )}
      </Box>

      {/* ── Email fallback ── */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          mt: { xs: 3, sm: 4 },
          textAlign: "center",
          fontSize: 13.5,
          color: tokens.ink2,
        }}
      >
        Prefer email? You can also write us at{" "}
        <Box
          component="a"
          href={`mailto:${CONTACT_EMAIL}`}
          sx={{
            color: tokens.greenDeep,
            fontWeight: 600,
            textDecoration: "underline",
            textUnderlineOffset: "3px",
            "&:hover": { color: tokens.ink },
          }}
        >
          {CONTACT_EMAIL}
        </Box>
      </Box>

      {/* ── Return link ── */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          mt: 3,
          textAlign: "center",
          fontSize: 13,
        }}
      >
        <Box
          component={RouterLink}
          to="/"
          sx={{
            color: tokens.ink3,
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

function SuccessState({ onReset }: { onReset: () => void }) {
  return (
    <Box sx={{ textAlign: "center", py: 2 }} role="status" aria-live="polite">
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          mx: "auto",
          mb: 2,
          backgroundColor: `color-mix(in oklab, ${tokens.green} 22%, ${tokens.bgElev})`,
          display: "grid",
          placeItems: "center",
          color: tokens.greenDeep,
        }}
      >
        <Box
          component="svg"
          viewBox="0 0 24 24"
          width={28}
          height={28}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M20 6 9 17l-5-5" />
        </Box>
      </Box>
      <Typography
        component="h2"
        sx={{
          fontFamily: tokens.fontSerif,
          fontSize: { xs: 26, sm: 30 },
          fontWeight: 500,
          color: tokens.ink,
          mb: 1,
          letterSpacing: "-0.01em",
        }}
      >
        Message sent
      </Typography>
      <Typography sx={{ fontSize: 15, color: tokens.ink2, mb: 3 }}>
        Thanks for reaching out — we'll get back to you within a few business
        days.
      </Typography>
      <Box
        component="button"
        onClick={onReset}
        sx={{
          backgroundColor: "transparent",
          border: `1px solid ${tokens.rule}`,
          color: tokens.ink,
          padding: "10px 20px",
          borderRadius: 999,
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 500,
          fontFamily: tokens.fontSans,
          transition: "all .15s",
          "&:hover": { borderColor: tokens.ink, backgroundColor: tokens.bg },
        }}
      >
        Send another message
      </Box>
    </Box>
  );
}
