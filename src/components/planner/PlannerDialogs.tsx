import { useEffect, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";
import { tokens } from "@/config/theme";

const paperSx = {
  backgroundColor: tokens.bgElev,
  borderRadius: "22px",
  border: `1px solid ${tokens.rule}`,
} as const;

interface PromptDialogProps {
  open: boolean;
  title: string;
  label: string;
  /** Initial field value; re-applied each time the dialog opens. */
  initialValue?: string;
  confirmLabel?: string;
  /** Only allow numeric input (used for the budget field). */
  numeric?: boolean;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}

/**
 * Non-blocking replacement for `window.prompt` — a styled modal that collects a
 * single line of text. Enter confirms, Esc / backdrop / Cancel dismisses.
 */
export function PromptDialog({
  open,
  title,
  label,
  initialValue = "",
  confirmLabel = "Save",
  numeric = false,
  onCancel,
  onConfirm,
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset the field to the caller's initial value each time the dialog opens.
  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  const trimmed = value.trim();
  const submit = () => {
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: { sx: paperSx },
        // Focus the field once the open animation finishes — TextField's own
        // autoFocus races the Dialog focus-trap and loses, leaving focus on the
        // dialog container. onEntered fires after the trap has settled.
        transition: { onEntered: () => inputRef.current?.focus() },
      }}
    >
      <DialogTitle sx={{ fontSize: 18, fontWeight: 700, color: tokens.ink }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <TextField
          inputRef={inputRef}
          fullWidth
          label={label}
          value={value}
          onChange={(e) =>
            setValue(numeric ? e.target.value.replace(/[^0-9.]/g, "") : e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          inputMode={numeric ? "decimal" : "text"}
          variant="outlined"
          size="small"
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} sx={{ color: tokens.ink2, textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          onClick={submit}
          disabled={!trimmed}
          variant="contained"
          sx={{
            textTransform: "none",
            fontWeight: 600,
            backgroundColor: tokens.greenDeep,
            "&:hover": { backgroundColor: "#4AA33D" },
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  /** Style the confirm button as a destructive action. */
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Non-blocking replacement for `window.confirm` — a styled yes/no modal.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: paperSx } }}
    >
      <DialogTitle sx={{ fontSize: 18, fontWeight: 700, color: tokens.ink }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: 14.5, color: tokens.ink2 }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} sx={{ color: tokens.ink2, textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            textTransform: "none",
            fontWeight: 600,
            backgroundColor: danger ? "#C0392B" : tokens.greenDeep,
            "&:hover": { backgroundColor: danger ? "#A93226" : "#4AA33D" },
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
