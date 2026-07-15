import { Dialog, DialogContent, IconButton, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { tokens } from "@/config/theme";
import { OtpAuthForm } from "./OtpAuthForm";

interface AuthModalProps {
  open: boolean;
  /** Dismissed without signing in (backdrop / close button / Esc). */
  onClose: () => void;
  /** Signed in successfully. */
  onAuthenticated: () => void;
  /** Optional line above the form explaining why auth is being asked for. */
  reason?: string;
}

/**
 * Modal wrapper around the OTP auth form. Used to gate actions that require an
 * account (e.g. saving to the wishlist) without navigating away — so the user's
 * current screen and their pending action are preserved.
 */
export function AuthModal({ open, onClose, onAuthenticated, reason }: AuthModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: tokens.bgElev,
            borderRadius: "22px",
            border: `1px solid ${tokens.rule}`,
          },
        },
      }}
    >
      <IconButton
        aria-label="Close"
        onClick={onClose}
        sx={{ position: "absolute", top: 12, right: 12, color: tokens.ink2 }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      <DialogContent sx={{ p: { xs: 3, sm: 4 } }}>
        {reason && (
          <Box
            sx={{
              mb: 2,
              px: 1.5,
              py: 1,
              borderRadius: 2,
              backgroundColor: tokens.bg,
              border: `1px solid ${tokens.rule}`,
              fontSize: 13.5,
              color: tokens.ink2,
            }}
          >
            {reason}
          </Box>
        )}
        <OtpAuthForm onAuthenticated={onAuthenticated} compact />
      </DialogContent>
    </Dialog>
  );
}
