import { useState, type FormEvent } from "react";
import { Box, Typography, TextField, Alert } from "@mui/material";
import { tokens } from "@/config/theme";
import { validateEmail } from "@/utils/authValidation";
import { useAuth } from "@/context/AuthContext";

interface OtpAuthFormProps {
  /** Called once the user is signed in (token stored). */
  onAuthenticated: () => void;
  /** Tighter heading sizes for embedding in a modal. */
  compact?: boolean;
}

/**
 * Passwordless email + one-time code auth form. Shared by the /login page and
 * the save-gate modal.
 *
 * Step 1: enter email → POST /auth/otp (creates + emails the code).
 * Step 2: enter code → POST /auth/verify (signs in, creating the account if the
 *         email is new). A single flow covers both sign-up and sign-in.
 */
export function OtpAuthForm({ onAuthenticated, compact = false }: OtpAuthFormProps) {
  const { requestOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [codeErr, setCodeErr] = useState<string | null>(null);
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resent, setResent] = useState(false);

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerErr(null);

    const err = validateEmail(email);
    setEmailErr(err);
    if (err) return;

    setSubmitting(true);
    try {
      await requestOtp(email.trim());
      setStep("code");
    } catch (err) {
      setServerErr(err instanceof Error ? err.message : "Couldn't send the code");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCodeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerErr(null);

    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setCodeErr("Enter the 6-digit code from your email");
      return;
    }
    setCodeErr(null);

    setSubmitting(true);
    try {
      await verifyOtp(email.trim(), trimmed);
      onAuthenticated();
    } catch (err) {
      setServerErr(err instanceof Error ? err.message : "Invalid or expired code");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setServerErr(null);
    setResent(false);
    setSubmitting(true);
    try {
      await requestOtp(email.trim());
      setResent(true);
    } catch (err) {
      setServerErr(err instanceof Error ? err.message : "Couldn't resend the code");
    } finally {
      setSubmitting(false);
    }
  };

  const backToEmail = () => {
    setStep("email");
    setCode("");
    setCodeErr(null);
    setServerErr(null);
    setResent(false);
  };

  const title = step === "email" ? "Sign in or sign up" : "Check your email";
  const subtitle =
    step === "email"
      ? "Enter your email and we'll send you a one-time code — no password needed."
      : `We sent a 6-digit code to ${email}. Enter it below to continue.`;

  return (
    <Box>
      <Typography
        component="h2"
        sx={{
          fontFamily: tokens.fontSerif,
          fontSize: compact ? { xs: 24, sm: 26 } : { xs: 30, sm: 36 },
          fontWeight: 500,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          color: tokens.ink,
          mb: 1,
        }}
      >
        {title}
      </Typography>
      <Typography sx={{ fontSize: 15, color: tokens.ink2, mb: 3.5 }}>
        {subtitle}
      </Typography>

      {serverErr && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {serverErr}
        </Alert>
      )}

      {step === "email" ? (
        <Box component="form" onSubmit={handleEmailSubmit} noValidate>
          <TextField
            fullWidth
            label="Email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailErr) setEmailErr(null);
            }}
            error={!!emailErr}
            helperText={emailErr ?? " "}
            disabled={submitting}
            sx={{ mb: 2.5 }}
          />

          <Box
            component="button"
            type="submit"
            disabled={submitting}
            sx={authButtonStyles(submitting)}
          >
            {submitting ? "Sending code…" : "Continue"}
          </Box>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleCodeSubmit} noValidate>
          <TextField
            fullWidth
            label="Verification code"
            autoComplete="one-time-code"
            autoFocus
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              if (codeErr) setCodeErr(null);
            }}
            slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 6 } }}
            error={!!codeErr}
            helperText={codeErr ?? (resent ? "A new code is on its way." : " ")}
            disabled={submitting}
            sx={{ mb: 2.5 }}
          />

          <Box
            component="button"
            type="submit"
            disabled={submitting}
            sx={authButtonStyles(submitting)}
          >
            {submitting ? "Verifying…" : "Verify & continue"}
          </Box>

          <Box
            sx={{
              mt: 3,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 14,
            }}
          >
            <Box
              component="button"
              type="button"
              onClick={backToEmail}
              disabled={submitting}
              sx={authLinkStyles}
            >
              Use a different email
            </Box>
            <Box
              component="button"
              type="button"
              onClick={handleResend}
              disabled={submitting}
              sx={authLinkStyles}
            >
              Resend code
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export function authButtonStyles(submitting: boolean) {
  return {
    width: "100%",
    py: "14px",
    borderRadius: "999px",
    border: 0,
    backgroundColor: submitting ? tokens.ink2 : tokens.ink,
    color: tokens.bg,
    fontSize: 15,
    fontWeight: 600,
    fontFamily: tokens.fontSans,
    cursor: submitting ? "not-allowed" : "pointer",
    transition: "background-color .15s, transform .15s",
    "&:hover": {
      backgroundColor: submitting ? tokens.ink2 : "#000",
    },
    "&:active": { transform: submitting ? "none" : "scale(0.99)" },
  } as const;
}

const authLinkStyles = {
  background: "transparent",
  border: 0,
  padding: 0,
  cursor: "pointer",
  color: tokens.greenDeep,
  fontWeight: 600,
  fontSize: 14,
  fontFamily: tokens.fontSans,
  "&:hover": { textDecoration: "underline" },
  "&:disabled": { cursor: "not-allowed", opacity: 0.6 },
} as const;
