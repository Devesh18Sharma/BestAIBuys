import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { tokens } from "@/config/theme";
import { OtpAuthForm } from "@/components/auth/OtpAuthForm";

/**
 * /login (and /signup) — centered card hosting the passwordless email +
 * one-time code auth flow. The form itself lives in OtpAuthForm so it can be
 * reused inside the save-gate modal.
 */
export function LoginPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        py: { xs: 6, sm: 10 },
        px: { xs: 2, sm: 4 },
        minHeight: "100%",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 440,
          backgroundColor: tokens.bgElev,
          border: `1px solid ${tokens.rule}`,
          borderRadius: "22px",
          p: { xs: 3.5, sm: 5 },
          boxShadow: tokens.shadowMd,
        }}
      >
        <OtpAuthForm onAuthenticated={() => navigate("/", { replace: true })} />
      </Box>
    </Box>
  );
}
